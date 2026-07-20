-- OpenAI key for AI Assistant replies (works without Edge Function deploy)
-- Uses extensions.http so the school-stored key never reaches the browser.

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Status for UI (never returns the raw key)
CREATE OR REPLACE FUNCTION public.ai_assistant_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id uuid;
  v_enabled boolean;
  v_model text;
  v_has_key boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unauthorized');
  END IF;

  SELECT p.school_id INTO v_school_id
  FROM profiles p
  WHERE p.id = auth.uid();

  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No school');
  END IF;

  SELECT
    COALESCE(s.ai_tutor_enabled, true),
    COALESCE(s.ai_tutor_model, 'gpt-5.5'),
    (s.openai_api_key IS NOT NULL AND length(trim(s.openai_api_key)) > 10)
  INTO v_enabled, v_model, v_has_key
  FROM schools s
  WHERE s.id = v_school_id;

  RETURN jsonb_build_object(
    'ok', true,
    'enabled', COALESCE(v_enabled, true),
    'model', COALESCE(v_model, 'gpt-5.5'),
    'hasKey', COALESCE(v_has_key, false)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ai_assistant_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_assistant_status() TO authenticated;

-- Complete a chat turn using the school OpenAI key (server-side only)
CREATE OR REPLACE FUNCTION public.ai_assistant_complete(
  p_system_prompt text,
  p_messages jsonb,
  p_model text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_role text;
  v_school_id uuid;
  v_enabled boolean;
  v_key text;
  v_preferred text;
  v_models text[];
  v_model text;
  v_payload jsonb;
  v_req extensions.http_request;
  v_res extensions.http_response;
  v_body jsonb;
  v_reply text;
  v_last_error text := 'OpenAI unavailable';
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unauthorized', 'code', 'UNAUTHORIZED');
  END IF;

  SELECT p.role, p.school_id INTO v_role, v_school_id
  FROM profiles p
  WHERE p.id = auth.uid();

  IF v_school_id IS NULL OR v_role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Profile missing', 'code', 'NO_PROFILE');
  END IF;

  -- Students use the assistant; admins may test from settings later
  IF v_role NOT IN ('student', 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed', 'code', 'FORBIDDEN');
  END IF;

  SELECT
    COALESCE(s.ai_tutor_enabled, true),
    NULLIF(trim(s.openai_api_key), ''),
    COALESCE(NULLIF(trim(s.ai_tutor_model), ''), 'gpt-5.5')
  INTO v_enabled, v_key, v_preferred
  FROM schools s
  WHERE s.id = v_school_id;

  IF v_enabled IS FALSE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AI Assistant disabled', 'code', 'DISABLED');
  END IF;

  IF v_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'OpenAI key not configured', 'code', 'NO_KEY');
  END IF;

  IF p_system_prompt IS NULL OR length(trim(p_system_prompt)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing system prompt', 'code', 'BAD_REQUEST');
  END IF;

  IF p_messages IS NULL OR jsonb_typeof(p_messages) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Messages must be an array', 'code', 'BAD_REQUEST');
  END IF;

  v_preferred := COALESCE(NULLIF(trim(p_model), ''), v_preferred, 'gpt-5.5');
  -- Prefer configured model, then latest known fallbacks (unique, ordered)
  v_models := ARRAY[]::text[];
  FOREACH v_model IN ARRAY ARRAY[v_preferred, 'gpt-5.5', 'gpt-5', 'gpt-4.1', 'gpt-4o']
  LOOP
    IF v_model IS NOT NULL AND length(v_model) > 0 AND NOT (v_model = ANY (v_models)) THEN
      v_models := v_models || v_model;
    END IF;
  END LOOP;

  FOREACH v_model IN ARRAY v_models
  LOOP
    v_payload := jsonb_build_object(
      'model', v_model,
      'messages', jsonb_build_array(
        jsonb_build_object('role', 'system', 'content', p_system_prompt)
      ) || p_messages
    );

    IF v_model LIKE 'gpt-4%' THEN
      v_payload := v_payload || jsonb_build_object('temperature', 0.35);
    END IF;

    BEGIN
      v_req := (
        'POST',
        'https://api.openai.com/v1/chat/completions',
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || v_key),
          extensions.http_header('Content-Type', 'application/json')
        ],
        'application/json',
        v_payload::text
      )::extensions.http_request;

      v_res := extensions.http(v_req);

      IF v_res.status >= 200 AND v_res.status < 300 THEN
        v_body := v_res.content::jsonb;
        v_reply := trim(both FROM COALESCE(v_body #>> '{choices,0,message,content}', ''));
        IF length(v_reply) > 0 THEN
          RETURN jsonb_build_object(
            'ok', true,
            'reply', v_reply,
            'provider', 'openai',
            'model', v_model
          );
        END IF;
        v_last_error := format('Empty response from %s', v_model);
      ELSE
        v_last_error := format('OpenAI %s: %s', v_model, left(COALESCE(v_res.content, ''), 180));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_last_error := SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', false,
    'error', v_last_error,
    'code', 'OPENAI_FAILED'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ai_assistant_complete(text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_assistant_complete(text, jsonb, text) TO authenticated;
