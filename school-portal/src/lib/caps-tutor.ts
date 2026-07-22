/**
 * Leroy AI Assistant — CAPS-aligned GPT for South African schools (Grade R–12).
 * Prefers GPT-5.5 (vision + chat + streaming); falls back through gpt-5 → gpt-4.1 → gpt-4o.
 * Without an API key, an honest CAPS study assistant still works with file extraction.
 */

export const CAPS_PHASES = [
  { id: 'foundation', label: 'Foundation Phase', grades: 'R–3' },
  { id: 'intermediate', label: 'Intermediate Phase', grades: '4–6' },
  { id: 'senior', label: 'Senior Phase', grades: '7–9' },
  { id: 'fet', label: 'FET Phase', grades: '10–12' },
] as const

export const CAPS_LEVELS = [
  { level: 7, min: 80, label: 'Outstanding achievement' },
  { level: 6, min: 70, label: 'Meritorious achievement' },
  { level: 5, min: 60, label: 'Substantial achievement' },
  { level: 4, min: 50, label: 'Adequate achievement' },
  { level: 3, min: 40, label: 'Moderate achievement' },
  { level: 2, min: 30, label: 'Elementary achievement' },
  { level: 1, min: 0, label: 'Not achieved' },
] as const

export const SA_OFFICIAL_LANGUAGES = [
  { code: 'en-ZA', name: 'English', native: 'English' },
  { code: 'af-ZA', name: 'Afrikaans', native: 'Afrikaans' },
  { code: 'zu-ZA', name: 'isiZulu', native: 'isiZulu' },
  { code: 'xh-ZA', name: 'isiXhosa', native: 'isiXhosa' },
  { code: 'st-ZA', name: 'Sesotho', native: 'Sesotho' },
  { code: 'nso-ZA', name: 'Sepedi', native: 'Sepedi (Northern Sotho)' },
  { code: 'tn-ZA', name: 'Setswana', native: 'Setswana' },
  { code: 'ts-ZA', name: 'Xitsonga', native: 'Xitsonga' },
  { code: 've-ZA', name: 'Tshivenda', native: 'Tshivenda' },
  { code: 'ss-ZA', name: 'Siswati', native: 'siSwati' },
  { code: 'nr-ZA', name: 'isiNdebele', native: 'isiNdebele' },
  { code: 'en-ZA-sign', name: 'SASL', native: 'South African Sign Language (written support)' },
] as const

export const CAPS_SUBJECTS = [
  'Mathematics',
  'Mathematical Literacy',
  'Physical Sciences',
  'Life Sciences',
  'Accounting',
  'Economics',
  'Business Studies',
  'Geography',
  'History',
  'Computer Applications Technology (CAT)',
  'Information Technology (IT)',
  'Life Orientation',
  'English Home Language',
  'English First Additional Language',
  'Afrikaans Home Language',
  'Afrikaans First Additional Language',
  'isiZulu',
  'isiXhosa',
  'Sepedi',
  'Setswana',
  'Sesotho',
  'Tshivenda',
  'Xitsonga',
  'Siswati',
  'isiNdebele',
  'Technology',
  'Creative Arts',
  'Natural Sciences',
  'Social Sciences',
  'EMS',
] as const

export type TutorMode =
  | 'chat'
  | 'explain'
  | 'homework'
  | 'exam'
  | 'quiz'
  | 'test'
  | 'flashcards'
  | 'summary'
  | 'study_plan'
  | 'revision'

export type TutorChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  imageDataUrl?: string
}

export type TutorRequest = {
  question: string
  subjectName?: string
  gradeLevel?: string
  languageCode?: string
  mode?: TutorMode
  history?: TutorChatMessage[]
  imageDataUrl?: string
  pdfText?: string
  learnerName?: string
  apiKey?: string
}

export function formatZar(cents: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100)
}

export function overallCapsFromSbaExam(sbaPct: number, examPct: number, sbaWeight = 25, examWeight = 75) {
  const weighted = (sbaPct * sbaWeight + examPct * examWeight) / (sbaWeight + examWeight)
  return Math.round(weighted)
}

export function buildCapsSystemPrompt(opts: {
  subjectName?: string
  gradeLevel?: string
  languageCode?: string
  mode?: TutorMode
  learnerName?: string
}) {
  const lang =
    SA_OFFICIAL_LANGUAGES.find((l) => l.code === opts.languageCode)?.name ||
    'the learner’s preferred South African official language (detect from their message)'
  const modeHints: Record<TutorMode, string> = {
    chat: 'Hold a natural ChatGPT-style conversation. Answer fully, then ask a helpful follow-up.',
    explain: 'Explain clearly with examples. Do the explaining work yourself — do not leave the learner guessing.',
    homework:
      'Complete the homework help: show method, full working, and the answer. Then ask if they want another similar question.',
    exam: 'Focus on exam technique, mark allocation, and CAPS-style model answers. Provide complete sample answers.',
    quiz: 'Generate a short quiz (5–8 questions) with answers under an "Answers" section. Ask which topic to quiz next.',
    test: 'Generate a CAPS-style test (10–15 questions) with mark allocations and a full memo. Ask if they want a harder or easier version.',
    flashcards: 'Produce 8–12 flashcards as Q → A pairs. Ask which cards to expand.',
    summary: 'Produce clear study notes with headings, key terms, and exam tips. Ask what to deepen.',
    study_plan: 'Build a realistic weekly study plan with time blocks. Ask about their exam date and weak topics.',
    revision: 'Create a revision pack: key facts, common mistakes, and practice items. Ask what to prioritise.',
  }

  return [
    'You are Leroy AI Assistant — a ChatGPT-class helper for South African learners (and anyone using this school portal).',
    'Be as capable, thorough, and conversational as ChatGPT or Cursor Cloud: clear, proactive, and useful.',
    '',
    'MISSION:',
    '- Answer EVERY question you are asked — school subjects, general knowledge, life skills, careers, study advice, research, writing, maths, science, languages, coding concepts, current topics, and more.',
    '- Do MOST of the work yourself. Give complete answers, full drafts, full workings, and ready-to-use notes — not vague tips.',
    '- After helping, ASK BACK: one or two short clarifying or next-step questions so the conversation continues (e.g. “Want a harder example?” / “Should I rewrite this in isiZulu?” / “Do you have a due date?”).',
    '- If the request is unclear, make a best attempt first, then ask what to refine.',
    '',
    'HARD LIMIT — DO NOT BUILD APPS OR WEBSITES:',
    '- Never scaffold, generate, or ship full apps, websites, web apps, mobile apps, or production software projects.',
    '- You may explain programming ideas, debug short school code snippets, and help with IT/CAT homework.',
    '- If someone asks you to build an app or website, politely refuse, explain you are a study/assistant AI (not an app builder), and offer to teach the concepts, plan the idea, or help with a small homework code example instead.',
    '',
    'SCHOOL STRENGTH (CAPS):',
    '- You are excellent at South African CAPS: Grade R–12, all phases (Foundation → FET).',
    `- Subjects include (not limited to): ${CAPS_SUBJECTS.join(', ')}.`,
    '- For FET, respect typical SBA (~25%) and exam (~75%) weightings unless told otherwise.',
    '- For Mathematics and Physical Sciences: ALWAYS show full step-by-step working.',
    '',
    'LANGUAGES:',
    `- Prefer replying in: ${lang}.`,
    '- Fluently support all 12 official South African languages: English, Afrikaans, isiZulu, isiXhosa, Sesotho, Sepedi, Setswana, Xitsonga, Tshivenda, Siswati, isiNdebele, plus written SASL support.',
    '- Match the user’s language automatically when they write in another official language.',
    '',
    'STYLE (like ChatGPT / Cloud):',
    '- Warm, patient, direct, and encouraging — like an excellent teacher and a smart friend.',
    '- Lead with the answer, then explain. Use short sections and bullet points when helpful.',
    '- For essays: provide outlines AND full draft paragraphs when asked; improve PEEL structure.',
    '- For research: give outlines, key points, and how to verify sources — do not invent citations.',
    '- When images/PDFs/docs are attached: read them carefully (including handwriting) and answer from the content.',
    '- Remember conversation history and stay consistent.',
    '',
    'INTEGRITY:',
    '- Never invent facts, formulas, dates, marks, or syllabus claims. If unsure, say so and ask how to verify.',
    '- If an upload is unreadable, say so and ask for a clearer photo/file.',
    '- Stay safe and age-appropriate for school learners.',
    '',
    'CONTEXT:',
    opts.learnerName ? `- Learner name: ${opts.learnerName}` : '- User: South African school portal learner',
    opts.gradeLevel ? `- Grade level: ${opts.gradeLevel}` : '- Grade: detect from the question or ask once',
    opts.subjectName ? `- Subject focus: ${opts.subjectName}` : '- Subject: detect from the question (or treat as general)',
    `- Mode: ${opts.mode || 'chat'} — ${modeHints[opts.mode || 'chat']}`,
    '',
    'End most replies with a brief “What next?” style question so you keep assisting.',
  ].join('\n')
}

function modeInstruction(mode: TutorMode | undefined, question: string) {
  switch (mode) {
    case 'quiz':
      return `Create a CAPS-aligned quiz based on this request:\n${question}`
    case 'test':
      return `Create a CAPS-aligned test/assessment (with mark allocations and a full memo) based on this request:\n${question}`
    case 'flashcards':
      return `Create flashcards based on this request:\n${question}`
    case 'summary':
      return `Create revision notes / study notes based on this request:\n${question}`
    case 'study_plan':
      return `Create a study plan based on this request:\n${question}`
    case 'revision':
      return `Create an exam revision pack based on this request:\n${question}`
    case 'exam':
      return `Help with exam preparation:\n${question}`
    case 'homework':
      return `Help me with this homework. Do most of the work: show the method, full working, and the answer, then ask a follow-up:\n${question}`
    case 'explain':
      return `Explain this fully (simple first, then deeper), then ask what I should clarify next:\n${question}`
    default:
      return `Answer this completely like ChatGPT. Do the work for me, then ask one short follow-up question:\n${question}`
  }
}

/** Offline / fallback tutor — honest, CAPS-aware, not a substitute for GPT-4o. */
export function generateCapsTutorReply(req: TutorRequest): string {
  const q = req.question.trim()
  const subject = req.subjectName || 'General CAPS study'
  const lang = SA_OFFICIAL_LANGUAGES.find((l) => l.code === req.languageCode)?.name || 'English'
  const extra = [req.pdfText ? `Document extract:\n${req.pdfText.slice(0, 3500)}` : '', req.imageDataUrl ? 'An image of homework was attached (enable OpenAI for full vision analysis).' : '']
    .filter(Boolean)
    .join('\n\n')

  const math =
    /math|algebra|equation|solve|calculate|triangle|fraction|geometry|trigonometry|calculus/i.test(
      `${subject} ${q}`,
    )

  const steps = math
    ? [
        '1. Identify what is given and what is asked.',
        '2. Write the relevant formula or theorem.',
        '3. Substitute carefully (watch units and signs).',
        '4. Simplify step-by-step — show each line.',
        '5. Check your answer (estimate / reverse operation).',
      ]
    : [
        '1. Restate the question in your own words.',
        '2. List key CAPS concepts involved.',
        '3. Explain with a simple example.',
        '4. Link back to exam/homework expectations.',
        '5. Try a short practice item to check understanding.',
      ]

  if (req.mode === 'quiz' || req.mode === 'test') {
    const title = req.mode === 'test' ? 'CAPS Test' : 'CAPS Quiz'
    return [
      `${title} · ${subject} · ${lang}`,
      '',
      '1) Define the main concept in one sentence. (2)',
      '2) Give one real-life South African example. (2)',
      '3) True/False: CAPS values understanding, not only memorisation. (1)',
      '4) List two common mistakes learners make on this topic. (4)',
      '5) Write a short paragraph applying the idea. (6)',
      req.mode === 'test'
        ? '6) Extended response: explain the topic with an example and a diagram description. (10)\n7) Application question linked to a CAPS exam skill. (5)'
        : '',
      '',
      req.mode === 'test' ? 'Memo:' : 'Answers:',
      '1) Accurate definition in the learner’s words.',
      '2) Context-appropriate local example.',
      '3) True.',
      '4) e.g. skipping steps; mixing definitions.',
      '5) Clear PEEL/structured response.',
      '',
      'Note: For richer GPT-5.5 quizzes and tests, ask your school admin to enable the OpenAI key (Admin → WhatsApp & AI).',
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (req.mode === 'flashcards') {
    return [
      `Flashcards · ${subject}`,
      '',
      'Q: What is the core idea of this topic? → A: State the CAPS definition simply.',
      'Q: Key formula / key term? → A: Write it and when to use it.',
      'Q: Common exam trap? → A: Name it and how to avoid it.',
      'Q: One worked example cue? → A: Outline the steps without rushing.',
      '',
      extra,
      '',
      'Enable OpenAI for unlimited subject-specific flashcards.',
    ].join('\n')
  }

  return [
    `Leroy AI Assistant · ${subject}`,
    `Language: ${lang}`,
    '',
    'Sawubona! Ask me anything — schoolwork, life questions, essays, maths, research, or study plans.',
    'I answer like ChatGPT: I do most of the work, then ask what you want next.',
    'I do not build apps or websites; I can still explain coding ideas and help with school IT/CAT tasks.',
    '',
    `Your request: “${q.slice(0, 500)}”`,
    extra ? `\n${extra}\n` : '',
    'Here is how I would tackle it:',
    ...steps,
    '',
    'Integrity: I will not invent facts. If something needs your textbook or teacher confirmation, I will say so.',
    '',
    'What next? Tell me your grade, language, or attach a photo/PDF — and I will finish the answer in more detail.',
    '(Full GPT-5.5 replies need an OpenAI key in Admin → WhatsApp & AI.)',
  ].join('\n')
}

export const AI_TUTOR_MODELS = ['gpt-5.5', 'gpt-5', 'gpt-4.1', 'gpt-4o'] as const

export function preferredTutorModel(configured?: string) {
  if (configured && configured.trim()) return configured.trim()
  return (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || 'gpt-5.5'
}

async function callOpenAiChat(
  apiKey: string,
  system: string,
  messages: Array<Record<string, unknown>>,
  modelPreference?: string,
) {
  const candidates = [
    preferredTutorModel(modelPreference),
    ...AI_TUTOR_MODELS.filter((m) => m !== preferredTutorModel(modelPreference)),
  ]
  let lastError = 'OpenAI unavailable'
  for (const model of candidates) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages: [{ role: 'system', content: system }, ...messages],
      }
      // gpt-5.x may reject temperature; use a natural ChatGPT-like setting for gpt-4*
      if (model.startsWith('gpt-4')) body.temperature = 0.7

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errText = await res.text()
        lastError = `OpenAI ${model}: ${errText.slice(0, 180)}`
        continue
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const text = data.choices?.[0]?.message?.content?.trim()
      if (!text) {
        lastError = `Empty response from ${model}`
        continue
      }
      return { text, model }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Network error'
    }
  }
  throw new Error(lastError)
}

function buildOpenAiMessages(req: TutorRequest) {
  const history = (req.history ?? []).slice(-40)
  const messages: Array<Record<string, unknown>> = []
  for (const h of history) {
    if (h.imageDataUrl) {
      messages.push({
        role: h.role,
        content: [
          { type: 'text', text: h.content },
          { type: 'image_url', image_url: { url: h.imageDataUrl, detail: 'low' } },
        ],
      })
    } else {
      messages.push({ role: h.role, content: h.content })
    }
  }
  messages.push({ role: 'user', content: buildUserContent(req) })
  return messages
}

/** Parse OpenAI Chat Completions SSE body into a full reply. */
export async function parseOpenAiSseStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string, full: string) => void,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          full += delta
          onDelta(delta, full)
        }
      } catch {
        // ignore partial JSON
      }
    }
  }
  return full.trim()
}

/** Stream GPT replies token-by-token (Chat Completions SSE). */
export async function streamTutorReply(
  req: TutorRequest & { model?: string },
  onDelta: (chunk: string, full: string) => void,
): Promise<{ reply: string; provider: 'openai' | 'fallback'; model?: string }> {
  const system = buildCapsSystemPrompt(req)
  const apiKey =
    req.apiKey || (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) || undefined
  if (!apiKey) {
    const reply = generateCapsTutorReply(req)
    onDelta(reply, reply)
    return { reply, provider: 'fallback' }
  }

  const candidates = [
    preferredTutorModel(req.model),
    ...AI_TUTOR_MODELS.filter((m) => m !== preferredTutorModel(req.model)),
  ]
  const messages = buildOpenAiMessages(req)
  let lastError = 'OpenAI stream unavailable'

  for (const model of candidates) {
    try {
      const body: Record<string, unknown> = {
        model,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      }
      if (model.startsWith('gpt-4')) body.temperature = 0.7

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok || !res.body) {
        lastError = `OpenAI ${model}: ${(await res.text()).slice(0, 180)}`
        continue
      }

      const full = await parseOpenAiSseStream(res.body, onDelta)
      if (full) return { reply: full, provider: 'openai', model }
      lastError = `Empty stream from ${model}`
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Stream error'
    }
  }

  const reply =
    generateCapsTutorReply(req) + `\n\n(AI provider temporarily unavailable: ${lastError})`
  onDelta(reply, reply)
  return { reply, provider: 'fallback' }
}

function buildUserContent(req: TutorRequest) {
  const parts: Array<Record<string, unknown>> = []
  let text = modeInstruction(req.mode, req.question)
  if (req.pdfText) {
    text += `\n\n--- Uploaded PDF / document text ---\n${req.pdfText.slice(0, 20000)}\n--- end ---`
  }
  if (req.imageDataUrl) {
    parts.push({ type: 'text', text })
    parts.push({
      type: 'image_url',
      image_url: { url: req.imageDataUrl, detail: 'high' },
    })
    return parts
  }
  return text
}

export async function generateTutorReply(
  req: TutorRequest & { model?: string },
): Promise<{ reply: string; provider: 'openai' | 'fallback'; model?: string }> {
  const system = buildCapsSystemPrompt(req)
  const apiKey =
    req.apiKey ||
    (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ||
    undefined

  if (apiKey) {
    try {
      const messages = buildOpenAiMessages(req)
      const { text, model } = await callOpenAiChat(apiKey, system, messages, req.model)
      return { reply: text, provider: 'openai', model }
    } catch (err) {
      console.warn('OpenAI tutor failed, using fallback', err)
      return {
        reply:
          generateCapsTutorReply(req) +
          `\n\n(AI provider temporarily unavailable: ${err instanceof Error ? err.message : 'unknown error'})`,
        provider: 'fallback',
      }
    }
  }

  return { reply: generateCapsTutorReply(req), provider: 'fallback' }
}

/** Extract text from a PDF file in the browser. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise
  const maxPages = Math.min(doc.numPages, 15)
  const chunks: string[] = []
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ('str' in item ? String(item.str) : '')).join(' ')
    chunks.push(text)
  }
  const joined = chunks.join('\n').replace(/\s+/g, ' ').trim()
  if (!joined) {
    return 'No extractable text found in this PDF (it may be a scanned image). Please upload a clearer photo of the pages or a text-based PDF.'
  }
  return joined
}

/** Read an image file as a compressed data URL for vision models. */
export async function fileToImageDataUrl(file: File, maxWidth = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function speakText(text: string, langCode = 'en-ZA') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text.slice(0, 1200))
  const lang = langCode.startsWith('en') ? 'en-ZA' : langCode.slice(0, 5)
  utter.lang = lang
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
}

type SpeechRec = typeof window extends never
  ? never
  : Window &
      typeof globalThis & {
        webkitSpeechRecognition?: new () => SpeechRecognition
        SpeechRecognition?: new () => SpeechRecognition
      }

export function createSpeechRecognition(langCode: string) {
  const w = window as SpeechRec
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = langCode.startsWith('en') ? 'en-ZA' : langCode
  rec.interimResults = true
  rec.continuous = false
  return rec
}
