import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bot,
  Camera,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Mic,
  MicOff,
  Plus,
  Presentation,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/services/api'
import { useApiRefresh } from '@/lib/student-helpers'
import {
  CAPS_SUBJECTS,
  SA_OFFICIAL_LANGUAGES,
  createSpeechRecognition,
  speakText,
  stopSpeaking,
  type TutorMode,
} from '@/lib/caps-tutor'
import {
  formatBytes,
  kindLabel,
  processTutorFile,
  transcribeAudio,
  type TutorAttachment,
} from '@/lib/tutor-files'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label, Select, Textarea } from '@/components/ui/input'
import { cn, formatDateTime, fullName } from '@/lib/utils'

const MODES: Array<{ id: TutorMode; label: string }> = [
  { id: 'chat', label: 'Chat' },
  { id: 'explain', label: 'Explain' },
  { id: 'homework', label: 'Homework' },
  { id: 'exam', label: 'Exam prep' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'summary', label: 'Summary' },
  { id: 'study_plan', label: 'Study plan' },
  { id: 'revision', label: 'Revision' },
]

const GRADES = ['R', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

type AttachMenu = 'closed' | 'open'

function newId() {
  return crypto.randomUUID()
}

export function StudentAiTutorPage() {
  useApiRefresh()
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [gradeLevel, setGradeLevel] = useState('10')
  const [languageCode, setLanguageCode] = useState('en-ZA')
  const [mode, setMode] = useState<TutorMode>('chat')
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(true)
  const [attachMenu, setAttachMenu] = useState<AttachMenu>('closed')
  const [attachments, setAttachments] = useState<TutorAttachment[]>([])
  const [providerHint, setProviderHint] = useState<'openai' | 'fallback' | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => () => stopSpeaking(), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  })

  const student = user ? api.getStudentByProfile(user.id) : undefined
  const gradeFromStudent = student?.gradeId ? api.getGrade(student.gradeId)?.gradeNumber : undefined

  useEffect(() => {
    if (gradeFromStudent) setGradeLevel(String(gradeFromStudent))
  }, [gradeFromStudent])

  if (!user) return null
  const sessions = student ? api.listAiSessions(student.id) : []
  const activeId = sessionId || sessions[0]?.id || ''
  const messages = activeId ? api.listAiMessages(activeId) : []
  const enrolled = api.listClassSubjects().filter((cs) => cs.classId === student?.classId)

  async function addFiles(fileList: FileList | File[] | null, opts?: { fromCamera?: boolean }) {
    if (!fileList) return
    const files = Array.from(fileList)
    setAttachMenu('closed')
    for (const file of files) {
      const id = newId()
      setAttachments((prev) => [
        ...prev,
        {
          id,
          kind: 'txt',
          fileName: file.name || (opts?.fromCamera ? 'camera-photo.jpg' : 'file'),
          mimeType: file.type,
          sizeBytes: file.size,
          progress: 5,
          status: 'processing',
        },
      ])
      const result = await processTutorFile(file, (pct) => {
        setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, progress: pct } : a)))
      })
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...result,
                id,
                progress: 100,
              }
            : a,
        ),
      )
      if (result.status === 'error') toast.error(result.error || 'Upload failed')
      else toast.success(`${result.fileName} ready`)
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const hit = prev.find((a) => a.id === id)
      if (hit?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(hit.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  function toggleLiveMic() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = createSpeechRecognition(languageCode)
    if (!rec) {
      toast.error('Live voice typing is not supported here. Try Chrome, or use Record Voice.')
      return
    }
    recognitionRef.current = rec
    rec.onresult = (ev) => {
      let transcript = ''
      for (let i = 0; i < ev.results.length; i++) transcript += ev.results[i][0]?.transcript ?? ''
      setQuestion(transcript)
    }
    rec.onerror = () => {
      setListening(false)
      toast.error('Microphone error — check permissions')
    }
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
    toast.message('Listening…')
  }

  async function toggleRecordVoice() {
    setAttachMenu('closed')
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const id = newId()
        const previewUrl = URL.createObjectURL(blob)
        setAttachments((prev) => [
          ...prev,
          {
            id,
            kind: 'audio',
            fileName: `voice-${new Date().toISOString().slice(11, 19)}.webm`,
            mimeType: 'audio/webm',
            sizeBytes: blob.size,
            previewUrl,
            audioBlob: blob,
            progress: 40,
            status: 'processing',
          },
        ])
        try {
          const text = await transcribeAudio(blob)
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === id
                ? { ...a, extractedText: text, progress: 100, status: 'ready' }
                : a,
            ),
          )
          if (text) setQuestion((q) => (q ? `${q} ${text}` : text))
          toast.success('Voice note transcribed')
        } catch (err) {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    progress: 100,
                    status: 'ready',
                    error: err instanceof Error ? err.message : 'Transcription pending',
                  }
                : a,
            ),
          )
          toast.message(err instanceof Error ? err.message : 'Voice saved — enable OpenAI for transcription')
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      toast.message('Recording… tap again to stop')
    } catch {
      toast.error('Could not access microphone')
    }
  }

  async function send() {
    if (!student) return
    const ready = attachments.filter((a) => a.status === 'ready')
    const processing = attachments.some((a) => a.status === 'processing')
    if (processing) return toast.error('Please wait for uploads to finish')
    if (!question.trim() && ready.length === 0) {
      return toast.error('Type a message, record voice, or attach a file')
    }

    const images = ready.filter((a) => a.kind === 'image' && a.imageDataUrl)
    const docs = ready.filter((a) => a.extractedText && a.kind !== 'audio')
    const voiceTexts = ready.filter((a) => a.kind === 'audio' && a.extractedText)
    const documentText = [...docs, ...voiceTexts]
      .map((a) => `### ${a.fileName}\n${a.extractedText}`)
      .join('\n\n')
    const imageDataUrl = images[0]?.imageDataUrl
    // Extra images: append note in document text for model context
    const extraImageNote =
      images.length > 1
        ? `\n(${images.length} images attached; analysing the first in detail. Describe others in your question if needed.)`
        : ''

    setBusy(true)
    stopSpeaking()
    try {
      const matched = api.listSubjects().find((s) => s.name === subjectName || s.id === subjectId)
      const res = await api.askAiTutor({
        studentId: student.id,
        subjectId: matched?.id || subjectId || undefined,
        question:
          (question.trim() ||
            (imageDataUrl
              ? 'Please read this image carefully (including handwriting) and explain / solve it step-by-step.'
              : documentText
                ? 'Please read the uploaded document(s) and teach me the key points. Answer questions about the content.'
                : 'Hello')) + extraImageNote,
        sessionId: activeId || undefined,
        gradeLevel: `Grade ${gradeLevel}`,
        languageCode,
        mode,
        imageDataUrl,
        documentText: documentText || undefined,
        learnerName: user?.profile.firstName,
        attachmentLabel: ready.map((a) => a.fileName).join(', ') || undefined,
      })
      setSessionId(res.sessionId)
      setProviderHint(res.provider)
      setQuestion('')
      setAttachments([])
      if (speakReplies) speakText(res.reply, languageCode)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tutor unavailable')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 animate-fade-in pb-6">
      <PageHeader
        title="AI Tutor"
        description="ChatGPT-style CAPS assistant · photos, PDFs, Office docs, voice"
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> CAPS · 12 languages
            </Badge>
            {providerHint === 'openai' ? <Badge variant="success">GPT-4o live</Badge> : null}
            {providerHint === 'fallback' ? <Badge variant="warning">Study mode</Badge> : null}
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              mode === m.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <Card className="order-2 h-fit lg:order-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Chats</CardTitle>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="New chat"
                onClick={() => {
                  setSessionId('')
                  setQuestion('')
                  setAttachments([])
                  stopSpeaking()
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-40 space-y-1.5 overflow-y-auto lg:max-h-[55vh]">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  'w-full rounded-xl border px-2.5 py-2 text-left text-xs transition',
                  activeId === s.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
                )}
                onClick={() => setSessionId(s.id)}
              >
                <p className="truncate font-medium">{s.title}</p>
              </button>
            ))}
            {sessions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Conversations are remembered here.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="order-1 flex min-h-[72vh] flex-col overflow-hidden border-border/80 shadow-md lg:order-2">
          <CardHeader className="space-y-3 border-b border-border bg-card/80 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">Leroy CAPS Tutor</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Maths · Sciences · Languages · Commerce · CAT/IT · LO
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={speakReplies ? 'Mute' : 'Unmute'}
                onClick={() => {
                  setSpeakReplies((v) => !v)
                  if (speakReplies) stopSpeaking()
                }}
              >
                {speakReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Grade</Label>
                <Select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Language</Label>
                <Select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)}>
                  {SA_OFFICIAL_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Subject</Label>
                <Select
                  value={subjectId || subjectName}
                  onChange={(e) => {
                    const val = e.target.value
                    const enrolledHit = enrolled.find((cs) => cs.subjectId === val)
                    if (enrolledHit) {
                      setSubjectId(val)
                      setSubjectName(api.getSubject(val)?.name || '')
                    } else {
                      setSubjectId('')
                      setSubjectName(val)
                    }
                  }}
                >
                  <option value="">Auto-detect</option>
                  {enrolled.map((cs) => (
                    <option key={cs.id} value={cs.subjectId}>
                      {api.getSubject(cs.subjectId)?.name}
                    </option>
                  ))}
                  {CAPS_SUBJECTS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-muted/30 via-background to-background px-3 py-4 sm:px-5"
          >
            {messages.length === 0 && !busy ? (
              <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-dashed border-border bg-card/60 p-5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Sawubona{user.profile.firstName ? `, ${user.profile.firstName}` : ''}!
                </p>
                <p>
                  Attach a homework photo, PDF, Word, Excel or PowerPoint with the <strong>+</strong> button — or record
                  your voice. I read handwriting and reply in all official South African languages.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Explain this photo', 'Summarise my PDF', 'Quiz me in isiZulu'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary"
                      onClick={() => setQuestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m) => {
              const mine = m.role === 'user'
              return (
                <div key={m.id} className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[80%]',
                      mine
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border border-border bg-card text-card-foreground',
                    )}
                  >
                    {!mine ? (
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        <Bot className="h-3 w-3" /> AI Tutor
                      </p>
                    ) : null}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={cn(
                        'mt-1.5 flex items-center gap-2 text-[10px]',
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                      )}
                    >
                      <span>{formatDateTime(m.createdAt)}</span>
                      {!mine ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 hover:opacity-100 opacity-80"
                          onClick={() => speakText(m.content, languageCode)}
                        >
                          <Volume2 className="h-3 w-3" /> Listen
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}

            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    AI Tutor is typing…
                  </span>
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {/* Attachment previews */}
          {attachments.length > 0 ? (
            <div className="space-y-2 border-t border-border bg-muted/20 px-3 py-2 sm:px-4">
              <p className="text-[11px] font-medium text-muted-foreground">Ready to send · preview</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="relative w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    {a.kind === 'image' && a.previewUrl ? (
                      <img src={a.previewUrl} alt="" className="h-24 w-full object-cover" />
                    ) : a.kind === 'audio' && a.previewUrl ? (
                      <div className="flex h-24 flex-col items-center justify-center gap-1 bg-primary/5 p-2">
                        <Mic className="h-5 w-5 text-primary" />
                        <audio src={a.previewUrl} controls className="w-full scale-90" />
                      </div>
                    ) : (
                      <div className="flex h-24 flex-col items-center justify-center gap-1 bg-muted/40 p-2 text-center">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-medium">{kindLabel(a.kind)}</span>
                      </div>
                    )}
                    <div className="space-y-1 p-2">
                      <p className="truncate text-[10px] font-medium">{a.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(a.sizeBytes)}</p>
                      {a.status === 'processing' ? (
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${a.progress}%` }}
                          />
                        </div>
                      ) : null}
                      {a.status === 'error' ? (
                        <p className="text-[10px] text-destructive">{a.error}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                      aria-label="Remove attachment"
                      onClick={() => removeAttachment(a.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Composer */}
          <div className="relative border-t border-border bg-card p-3 sm:p-4">
            {attachMenu === 'open' ? (
              <div className="absolute bottom-[calc(100%-0.25rem)] left-3 z-20 w-[min(100%-1.5rem,280px)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-scale-in">
                <p className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Add to message
                </p>
                <div className="grid gap-0.5 p-1.5">
                  <AttachOption
                    icon={<Camera className="h-4 w-4" />}
                    label="Take Photo"
                    hint="Open camera"
                    onClick={() => cameraRef.current?.click()}
                  />
                  <AttachOption
                    icon={<ImageIcon className="h-4 w-4" />}
                    label="Upload Image"
                    hint="JPG, PNG, WebP"
                    onClick={() => imageRef.current?.click()}
                  />
                  <AttachOption
                    icon={<FileText className="h-4 w-4" />}
                    label="Upload PDF"
                    hint="Notes & worksheets"
                    onClick={() => pdfRef.current?.click()}
                  />
                  <AttachOption
                    icon={<FileType className="h-4 w-4" />}
                    label="Upload Document"
                    hint="DOCX, TXT, PPTX, XLSX"
                    onClick={() => docRef.current?.click()}
                  />
                  <AttachOption
                    icon={recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    label={recording ? 'Stop Recording' : 'Record Voice'}
                    hint="Voice note"
                    onClick={() => void toggleRecordVoice()}
                  />
                </div>
              </div>
            ) : null}

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void addFiles(e.target.files, { fromCamera: true })}
            />
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void addFiles(e.target.files)}
            />
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => void addFiles(e.target.files)}
            />
            <input
              ref={docRef}
              type="file"
              accept=".docx,.doc,.txt,.md,.csv,.pptx,.ppt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
              multiple
              className="hidden"
              onChange={(e) => void addFiles(e.target.files)}
            />

            <div className="flex items-end gap-2">
              <Button
                type="button"
                size="icon"
                variant={attachMenu === 'open' ? 'default' : 'outline'}
                className="h-11 w-11 shrink-0 rounded-full"
                aria-label="Attach"
                onClick={() => setAttachMenu((m) => (m === 'open' ? 'closed' : 'open'))}
              >
                {attachMenu === 'open' ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant={listening ? 'destructive' : 'outline'}
                className="h-11 w-11 shrink-0 rounded-full"
                aria-label="Voice typing"
                onClick={toggleLiveMic}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Message AI Tutor…"
                className="min-h-11 max-h-36 flex-1 resize-y rounded-2xl border-border bg-muted/30 px-3 py-2.5"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                onFocus={() => setAttachMenu('closed')}
              />
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full"
                disabled={busy || attachments.some((a) => a.status === 'processing')}
                onClick={() => void send()}
                aria-label="Send"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {fullName(user.profile.firstName, user.profile.lastName)} · Tap + for camera, files & voice · Shift+Enter
              for new line
            </p>
            {/* Hidden icons kept for tree-shaking clarity of supported types */}
            <span className="hidden">
              <FileSpreadsheet />
              <Presentation />
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AttachOption({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}
