/**
 * World-class CAPS AI Tutor for South African schools (Grade R–12).
 * Uses GPT-4o (vision + chat) when an API key is available; otherwise
 * an honest enhanced CAPS study assistant with OCR/PDF extraction still works.
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
    chat: 'Hold a natural tutoring conversation. Remember prior turns in this chat.',
    explain: 'Explain the topic in simple language with analogies a South African learner will recognise.',
    homework: 'Help with homework: guide method first, check understanding, then support the answer.',
    exam: 'Focus on exam technique, mark allocation, and CAPS-style answers.',
    quiz: 'Generate a short quiz (5–8 questions) with answers hidden under an "Answers" section.',
    flashcards: 'Produce 8–12 flashcards as Q → A pairs for active recall.',
    summary: 'Produce clear revision notes / summary with headings and key terms.',
    study_plan: 'Build a realistic weekly study plan with CAPS topics and time blocks.',
    revision: 'Create a revision pack: key facts, common mistakes, and practice items.',
  }

  return [
    'You are Leroy CAPS Tutor — the best educational AI assistant for South African schools.',
    'You are as capable, clear, and helpful as ChatGPT, specialised for CAPS (Curriculum and Assessment Policy Statement).',
    '',
    'SCOPE:',
    '- Support EVERY school subject from Grade R to Grade 12.',
    `- Core subjects include: ${CAPS_SUBJECTS.join(', ')}.`,
    '- Fully align with South African CAPS: Foundation, Intermediate, Senior, and FET phases.',
    '- For FET, respect typical SBA (~25%) and exam (~75%) weightings unless the learner specifies otherwise.',
    '',
    'LANGUAGES:',
    `- Reply fluently in: ${lang}.`,
    '- You understand and can reply in all 12 official South African languages: English, Afrikaans, isiZulu, isiXhosa, Sesotho, Sepedi, Setswana, Xitsonga, Tshivenda, Siswati, isiNdebele, and written support for SASL concepts.',
    '- Match the learner’s language automatically if they write in another official language.',
    '',
    'TEACHING STYLE:',
    '- Be warm, encouraging, patient, and professional — like an excellent South African teacher.',
    '- Explain difficult ideas in simple language first, then deepen.',
    '- For Mathematics and Physical Sciences: ALWAYS show clear step-by-step working.',
    '- Help with homework, assignments, projects, exam prep, quizzes, flashcards, summaries, and study plans.',
    '- Prefer teaching understanding over dumping final answers; still provide complete worked solutions when asked.',
    '',
    'INTEGRITY (critical):',
    '- NEVER invent facts, formulas, historical dates, or syllabus claims.',
    '- If you are unsure, say so honestly and suggest how to verify (textbook, CAPS document, teacher).',
    '- If an image/PDF is unreadable, say so and ask for a clearer upload.',
    '',
    'CONTEXT:',
    opts.learnerName ? `- Learner name: ${opts.learnerName}` : '- Learner: South African school student',
    opts.gradeLevel ? `- Grade level: ${opts.gradeLevel}` : '- Grade: detect from question or ask politely',
    opts.subjectName ? `- Subject focus: ${opts.subjectName}` : '- Subject: detect from question',
    `- Mode: ${opts.mode || 'chat'} — ${modeHints[opts.mode || 'chat']}`,
    '',
    'Remember the full conversation history provided and stay consistent with earlier explanations.',
  ].join('\n')
}

function modeInstruction(mode: TutorMode | undefined, question: string) {
  switch (mode) {
    case 'quiz':
      return `Create a CAPS-aligned quiz based on this request:\n${question}`
    case 'flashcards':
      return `Create flashcards based on this request:\n${question}`
    case 'summary':
      return `Create revision notes / a summary based on this request:\n${question}`
    case 'study_plan':
      return `Create a study plan based on this request:\n${question}`
    case 'revision':
      return `Create an exam revision pack based on this request:\n${question}`
    case 'exam':
      return `Help with exam preparation:\n${question}`
    case 'homework':
      return `Help me with this homework (teach the method step-by-step):\n${question}`
    case 'explain':
      return `Explain this simply, then in more detail:\n${question}`
    default:
      return question
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

  if (req.mode === 'quiz') {
    return [
      `CAPS Quiz · ${subject} · ${lang}`,
      '',
      '1) Define the main concept in one sentence.',
      '2) Give one real-life South African example.',
      '3) True/False: CAPS values understanding, not only memorisation.',
      '4) List two common mistakes learners make on this topic.',
      '5) Write a short paragraph applying the idea.',
      '',
      'Answers:',
      '1) Learner’s own accurate definition.',
      '2) Context-appropriate local example.',
      '3) True.',
      '4) e.g. skipping steps; mixing definitions.',
      '5) Clear PEEL/structured response.',
      '',
      'Note: For richer adaptive quizzes powered by GPT-4o, ask your school admin to enable the OpenAI key.',
    ].join('\n')
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
    `Leroy CAPS Tutor · ${subject}`,
    `Language: ${lang}`,
    '',
    'Sawubona! I can help with CAPS topics from Grade R–12.',
    '',
    `Your request: “${q.slice(0, 500)}”`,
    extra ? `\n${extra}\n` : '',
    'Recommended approach:',
    ...steps,
    '',
    'Integrity: I will not invent syllabus details. If something needs your textbook or teacher confirmation, I will say so.',
    '',
    'Tip: Upload a photo of your homework or a PDF for guided help. For ChatGPT-level vision and multilingual tutoring, your school should configure an OpenAI API key (Admin → AI Tutor).',
    '',
    'Ask me to: explain · quiz me · make flashcards · summarise · build a study plan.',
  ].join('\n')
}

async function callOpenAiChat(apiKey: string, system: string, messages: Array<Record<string, unknown>>) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.35,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty model response')
  return text
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

export async function generateTutorReply(req: TutorRequest): Promise<{ reply: string; provider: 'openai' | 'fallback' }> {
  const system = buildCapsSystemPrompt(req)
  const history = (req.history ?? []).slice(-24)
  const apiKey =
    req.apiKey ||
    (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ||
    undefined

  if (apiKey) {
    try {
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
      const reply = await callOpenAiChat(apiKey, system, messages)
      return { reply, provider: 'openai' }
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
