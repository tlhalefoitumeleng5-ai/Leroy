/** South African CAPS curriculum helpers and offline AI tutor engine. */

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

export function formatZar(cents: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100)
}

export function overallCapsFromSbaExam(sbaPct: number, examPct: number, sbaWeight = 25, examWeight = 75) {
  const weighted = (sbaPct * sbaWeight + examPct * examWeight) / (sbaWeight + examWeight)
  return Math.round(weighted)
}

const CAPS_KNOWLEDGE: Record<string, string[]> = {
  maths: [
    'CAPS Mathematics emphasises problem-solving, conceptual understanding, and application.',
    'For FET Mathematics, focus areas include algebra, functions, trigonometry, calculus (Grade 12), and statistics.',
    'Always show working: state the formula, substitute carefully, and check units where relevant.',
    'SBA (School-Based Assessment) typically counts 25% and the final exam 75% in FET subjects.',
  ],
  english: [
    'CAPS English Home Language develops listening, speaking, reading, and writing skills.',
    'Literature responses should use PEEL: Point, Evidence, Explanation, Link.',
    'Transactional writing must match the format (formal letter, email, report) and register.',
  ],
  life: [
    'Life Orientation covers personal well-being, citizenship, careers, and physical education.',
    'Use CAPS topics: development of the self, social and environmental responsibility, democracy and human rights.',
  ],
  science: [
    'Physical Sciences combines Physics and Chemistry; balance equations and use SI units.',
    'Life Sciences requires accurate biological terminology and labelled diagrams.',
    'Always relate theory to CAPS specific aims: knowledge, investigation, and applications.',
  ],
  history: [
    'CAPS History builds source analysis, chronology, and multiperspectivity.',
    'Structure essays with introduction, argument, evidence, and conclusion.',
  ],
  general: [
    'I am your CAPS-aligned study tutor for South African schools.',
    'Ask about a topic, homework question, or exam technique and I will guide you step by step.',
    'I will not give full exam answers without teaching the method — learning comes first.',
  ],
}

function matchDomain(text: string, subjectName?: string) {
  const hay = `${subjectName ?? ''} ${text}`.toLowerCase()
  if (/math|algebra|trig|calculus|geometry|fraction/.test(hay)) return 'maths'
  if (/english|essay|poem|literature|comprehension/.test(hay)) return 'english'
  if (/life orientation|lo\b|career|citizenship/.test(hay)) return 'life'
  if (/physics|chem|biology|science|cell|force|reaction/.test(hay)) return 'science'
  if (/history|apartheid|source-based/.test(hay)) return 'history'
  return 'general'
}

/** Offline CAPS tutor — works without external API keys. */
export function generateCapsTutorReply(question: string, subjectName?: string): string {
  const domain = matchDomain(question, subjectName)
  const tips = CAPS_KNOWLEDGE[domain]
  const q = question.trim()
  const lower = q.toLowerCase()

  let method = ''
  if (/how|explain|what is|define/.test(lower)) {
    method =
      'Start with the CAPS definition, then give one worked example, then a quick check question for yourself.'
  } else if (/solve|calculate|find/.test(lower)) {
    method =
      'Break the problem into steps: (1) identify knowns, (2) choose the formula/method, (3) substitute, (4) simplify, (5) verify.'
  } else if (/essay|write|paragraph/.test(lower)) {
    method =
      'Plan first: mind-map ideas → topic sentence → evidence → analysis → link. Aim for CAPS-level language and structure.'
  } else {
    method = 'Clarify the CAPS topic, list key concepts, then practise with a short example.'
  }

  return [
    `CAPS Tutor · ${subjectName || 'General study'}`,
    '',
    tips[0],
    tips[1] ?? tips[0],
    '',
    `Approach for your question: ${method}`,
    '',
    `Your question: “${q.slice(0, 400)}”`,
    '',
    'Next steps:',
    '• Re-read the relevant CAPS topic notes or textbook section.',
    '• Attempt one practice item using the method above.',
    '• Reply with your working if you want feedback.',
    '',
    domain === 'maths'
      ? 'Remember: CAPS FET Mathematics rewards clear reasoning, not only the final answer.'
      : 'Remember: CAPS assesses knowledge, skills, and values — show your thinking.',
  ].join('\n')
}

export async function generateTutorReply(question: string, subjectName?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (!apiKey) return generateCapsTutorReply(question, subjectName)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a South African CAPS curriculum tutor for school learners. Be clear, encouraging, and step-by-step. Prefer teaching methods over giving final exam answers. Use South African English.',
          },
          {
            role: 'user',
            content: subjectName ? `Subject: ${subjectName}\n\n${question}` : question,
          },
        ],
        temperature: 0.4,
      }),
    })
    if (!res.ok) return generateCapsTutorReply(question, subjectName)
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content?.trim() || generateCapsTutorReply(question, subjectName)
  } catch {
    return generateCapsTutorReply(question, subjectName)
  }
}
