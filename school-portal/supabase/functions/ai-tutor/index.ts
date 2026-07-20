// Supabase Edge Function: world-class CAPS AI Tutor (GPT-4o + vision)
// Deploy: supabase functions deploy ai-tutor --project-ref <ref>
// Secrets: OPENAI_API_KEY (fallback). School-specific key read from schools.openai_api_key via service role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })
    }

    const body = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })
    }

    const admin = createClient(supabaseUrl, service)
    const { data: profile } = await admin
      .from('profiles')
      .select('school_id, first_name, role')
      .eq('id', userData.user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return new Response(JSON.stringify({ error: 'Students only' }), { status: 403, headers: cors })
    }

    const { data: school } = await admin
      .from('schools')
      .select('openai_api_key, ai_tutor_enabled, ai_tutor_model, name')
      .eq('id', profile.school_id)
      .single()

    if (school && school.ai_tutor_enabled === false) {
      return new Response(JSON.stringify({ error: 'AI Tutor disabled by school' }), { status: 403, headers: cors })
    }

    const apiKey = school?.openai_api_key || Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI key not configured', code: 'NO_KEY' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const system = body.systemPrompt as string
    const messages = body.messages as unknown[]
    const model = (school?.ai_tutor_model as string) || 'gpt-4o'

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: json.error?.message || 'OpenAI failed' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const reply = json.choices?.[0]?.message?.content ?? ''
    return new Response(JSON.stringify({ reply, provider: 'openai', model }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
