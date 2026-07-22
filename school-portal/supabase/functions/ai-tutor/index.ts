// Supabase Edge Function: CAPS AI Assistant (GPT-5.5 + vision + optional SSE stream)
// Deploy: supabase functions deploy ai-tutor --project-ref <ref>
// Secrets: OPENAI_API_KEY. School key: schools.openai_api_key

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL_FALLBACKS = ['gpt-5.5', 'gpt-5', 'gpt-4.1', 'gpt-4o']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })
    }

    const body = await req.json()
    if (body.ping) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

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
    const wantStream = Boolean(body.stream)
    const preferred = (school?.ai_tutor_model as string) || 'gpt-5.5'
    const models = [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)]

    let lastError = 'OpenAI failed'
    for (const model of models) {
      const payload: Record<string, unknown> = {
        model,
        stream: wantStream,
        messages: [{ role: 'system', content: system }, ...messages],
      }
      if (String(model).startsWith('gpt-4')) payload.temperature = 0.7

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        lastError = (await res.text()).slice(0, 240)
        continue
      }

      if (wantStream && res.body) {
        return new Response(res.body, {
          headers: {
            ...cors,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-AI-Model': model,
          },
        })
      }

      const json = await res.json()
      const reply = json.choices?.[0]?.message?.content ?? ''
      if (!reply) {
        lastError = `Empty response from ${model}`
        continue
      }
      return new Response(JSON.stringify({ reply, provider: 'openai', model }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: lastError }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
