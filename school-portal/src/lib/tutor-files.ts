/** Client-side extraction for AI Tutor attachments (images, PDF, Office, text). */

import { extractPdfText, fileToImageDataUrl } from '@/lib/caps-tutor'

export type TutorAttachmentKind = 'image' | 'pdf' | 'docx' | 'txt' | 'pptx' | 'xlsx' | 'audio'

export type TutorAttachment = {
  id: string
  kind: TutorAttachmentKind
  fileName: string
  mimeType: string
  sizeBytes: number
  /** Preview URL for images / object URL for others */
  previewUrl?: string
  /** Base64 data URL for vision models */
  imageDataUrl?: string
  /** Extracted plain text for documents */
  extractedText?: string
  /** Audio blob for voice notes */
  audioBlob?: Blob
  /** Progress 0–100 while processing */
  progress: number
  status: 'processing' | 'ready' | 'error'
  error?: string
}

function ext(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

export function classifyFile(file: File): TutorAttachmentKind | null {
  const e = ext(file.name)
  const t = file.type
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'].includes(e)) return 'image'
  if (t === 'application/pdf' || e === 'pdf') return 'pdf'
  if (
    t.includes('wordprocessingml') ||
    t === 'application/msword' ||
    e === 'docx' ||
    e === 'doc'
  )
    return 'docx'
  if (t.startsWith('text/') || e === 'txt' || e === 'md' || e === 'csv') return 'txt'
  if (t.includes('presentationml') || e === 'pptx' || e === 'ppt') return 'pptx'
  if (t.includes('spreadsheetml') || e === 'xlsx' || e === 'xls') return 'xlsx'
  if (t.startsWith('audio/') || ['webm', 'mp3', 'wav', 'm4a', 'ogg'].includes(e)) return 'audio'
  return null
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buf = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return result.value.trim() || 'No text could be extracted from this Word document.'
}

async function extractTxt(file: File): Promise<string> {
  return (await file.text()).trim()
}

async function extractXlsx(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const parts: string[] = []
  for (const name of wb.SheetNames.slice(0, 8)) {
    const sheet = wb.Sheets[name]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    parts.push(`## Sheet: ${name}\n${csv}`)
  }
  return parts.join('\n\n').slice(0, 40000) || 'No cells found in this spreadsheet.'
}

async function extractPptx(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const texts: string[] = []
  for (const path of slideFiles.slice(0, 40)) {
    const xml = await zip.files[path].async('string')
    const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((m) => m[1])
    const slideText = matches.join(' ').replace(/\s+/g, ' ').trim()
    if (slideText) texts.push(`Slide ${texts.length + 1}: ${slideText}`)
  }
  return texts.join('\n') || 'No readable text found in this PowerPoint file.'
}

export async function processTutorFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Omit<TutorAttachment, 'id'>> {
  const kind = classifyFile(file)
  if (!kind) {
    return {
      kind: 'txt',
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      progress: 100,
      status: 'error',
      error: 'Unsupported file type',
    }
  }

  onProgress?.(10)
  try {
    if (kind === 'image') {
      onProgress?.(40)
      const imageDataUrl = await fileToImageDataUrl(file)
      onProgress?.(100)
      return {
        kind,
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
        previewUrl: imageDataUrl,
        imageDataUrl,
        progress: 100,
        status: 'ready',
      }
    }

    if (kind === 'audio') {
      const previewUrl = URL.createObjectURL(file)
      onProgress?.(100)
      return {
        kind,
        fileName: file.name,
        mimeType: file.type || 'audio/webm',
        sizeBytes: file.size,
        previewUrl,
        audioBlob: file,
        progress: 100,
        status: 'ready',
      }
    }

    onProgress?.(30)
    let extractedText = ''
    if (kind === 'pdf') extractedText = await extractPdfText(file)
    else if (kind === 'docx') extractedText = await extractDocx(file)
    else if (kind === 'txt') extractedText = await extractTxt(file)
    else if (kind === 'xlsx') extractedText = await extractXlsx(file)
    else if (kind === 'pptx') extractedText = await extractPptx(file)
    onProgress?.(100)

    return {
      kind,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      extractedText,
      progress: 100,
      status: 'ready',
    }
  } catch (err) {
    return {
      kind,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      progress: 100,
      status: 'error',
      error: err instanceof Error ? err.message : 'Failed to process file',
    }
  }
}

/** Transcribe recorded voice with OpenAI Whisper when a key is available. */
export async function transcribeAudio(blob: Blob, apiKey?: string): Promise<string> {
  const key = apiKey || (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)
  if (!key) {
    throw new Error('Voice transcription needs an OpenAI API key. Use the mic for live speech-to-text, or enable GPT-4o in Admin.')
  }
  const form = new FormData()
  form.append('file', blob, 'voice-note.webm')
  form.append('model', 'whisper-1')
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Transcription failed: ${t.slice(0, 160)}`)
  }
  const data = (await res.json()) as { text?: string }
  return (data.text || '').trim()
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function kindLabel(kind: TutorAttachmentKind) {
  switch (kind) {
    case 'image':
      return 'Image'
    case 'pdf':
      return 'PDF'
    case 'docx':
      return 'Word'
    case 'txt':
      return 'Text'
    case 'pptx':
      return 'PowerPoint'
    case 'xlsx':
      return 'Excel'
    case 'audio':
      return 'Voice'
  }
}
