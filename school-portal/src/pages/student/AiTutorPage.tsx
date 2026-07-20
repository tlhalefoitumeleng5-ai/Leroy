import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Camera,
  FileText,
  Mic,
  MicOff,
  Plus,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Paperclip,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/services/api'
import { useApiRefresh } from '@/lib/student-helpers'
import {
  CAPS_SUBJECTS,
  SA_OFFICIAL_LANGUAGES,
  createSpeechRecognition,
  extractPdfText,
  fileToImageDataUrl,
  speakText,
  stopSpeaking,
  type TutorMode,
} from '@/lib/caps-tutor'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { fullName } from '@/lib/utils'

const MODES: Array<{ id: TutorMode; label: string; hint: string }> = [
  { id: 'chat', label: 'Chat', hint: 'Ask anything' },
  { id: 'explain', label: 'Explain', hint: 'Simple language' },
  { id: 'homework', label: 'Homework', hint: 'Step-by-step help' },
  { id: 'exam', label: 'Exam prep', hint: 'Technique & marks' },
  { id: 'quiz', label: 'Quiz', hint: 'Test yourself' },
  { id: 'flashcards', label: 'Flashcards', hint: 'Active recall' },
  { id: 'summary', label: 'Summary', hint: 'Revision notes' },
  { id: 'study_plan', label: 'Study plan', hint: 'Weekly plan' },
  { id: 'revision', label: 'Revision', hint: 'Exam pack' },
]

const GRADES = ['R', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

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
  const [speakReplies, setSpeakReplies] = useState(true)
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>()
  const [pdfText, setPdfText] = useState<string | undefined>()
  const [attachmentName, setAttachmentName] = useState<string | undefined>()
  const [providerHint, setProviderHint] = useState<'openai' | 'fallback' | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null)

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

  async function onPickFile(file: File | undefined) {
    if (!file) return
    try {
      if (file.type.startsWith('image/')) {
        const url = await fileToImageDataUrl(file)
        setImageDataUrl(url)
        setPdfText(undefined)
        setAttachmentName(file.name)
        toast.success('Photo ready — the tutor can read your homework')
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        toast.message('Reading PDF…')
        const text = await extractPdfText(file)
        setPdfText(text)
        setImageDataUrl(undefined)
        setAttachmentName(file.name)
        toast.success('PDF text extracted')
      } else {
        toast.error('Upload a photo (JPG/PNG) or PDF')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read file')
    }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = createSpeechRecognition(languageCode)
    if (!rec) {
      toast.error('Voice input is not supported in this browser. Try Chrome on Android/desktop.')
      return
    }
    recognitionRef.current = rec
    rec.onresult = (ev) => {
      let transcript = ''
      for (let i = 0; i < ev.results.length; i++) {
        transcript += ev.results[i][0]?.transcript ?? ''
      }
      setQuestion(transcript)
    }
    rec.onerror = () => {
      setListening(false)
      toast.error('Microphone error — check permissions')
    }
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
    toast.message('Listening… speak your question')
  }

  async function send() {
    if (!student) return
    if (!question.trim() && !imageDataUrl && !pdfText) {
      toast.error('Type a question, speak, or upload homework')
      return
    }
    setBusy(true)
    stopSpeaking()
    try {
      const matched = api.listSubjects().find((s) => s.name === subjectName || s.id === subjectId)
      const res = await api.askAiTutor({
        studentId: student.id,
        subjectId: matched?.id || subjectId || undefined,
        question:
          question.trim() ||
          (imageDataUrl
            ? 'Please read this homework photo and explain how to solve it step-by-step.'
            : 'Please summarise this document and teach me the key CAPS points.'),
        sessionId: activeId || undefined,
        gradeLevel: `Grade ${gradeLevel}`,
        languageCode,
        mode,
        imageDataUrl,
        pdfText,
        learnerName: user?.profile.firstName,
        attachmentLabel: attachmentName,
      })
      setSessionId(res.sessionId)
      setProviderHint(res.provider)
      setQuestion('')
      setImageDataUrl(undefined)
      setPdfText(undefined)
      setAttachmentName(undefined)
      if (speakReplies) speakText(res.reply, languageCode)
      if (res.provider === 'fallback') {
        toast.message('Study assistant ready — enable OpenAI in Admin for GPT-4o power')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tutor unavailable')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <PageHeader
        title="AI Tutor"
        description="World-class CAPS assistant · Grade R–12 · all official languages"
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> CAPS
            </Badge>
            {providerHint === 'openai' ? (
              <Badge variant="success">GPT-4o live</Badge>
            ) : providerHint === 'fallback' ? (
              <Badge variant="warning">Study mode</Badge>
            ) : null}
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              mode === m.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="order-2 lg:order-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Sessions</CardTitle>
              <Button
                size="icon"
                variant="outline"
                aria-label="New chat"
                onClick={() => {
                  setSessionId('')
                  setQuestion('')
                  setImageDataUrl(undefined)
                  setPdfText(undefined)
                  stopSpeaking()
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-48 space-y-2 overflow-y-auto lg:max-h-[50vh]">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  activeId === s.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                }`}
                onClick={() => setSessionId(s.id)}
              >
                <p className="truncate font-medium">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">{s.languageCode || 'en-ZA'}</p>
              </button>
            ))}
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Your conversations appear here and are remembered.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="order-1 flex min-h-[70vh] flex-col lg:order-2 lg:min-h-[560px]">
          <CardHeader className="space-y-3 border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              Leroy CAPS Tutor
            </CardTitle>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Grade</Label>
                <Select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Language</Label>
                <Select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)}>
                  {SA_OFFICIAL_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subject</Label>
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
                  {enrolled.map((cs) => {
                    const sub = api.getSubject(cs.subjectId)
                    return (
                      <option key={cs.id} value={cs.subjectId}>
                        {sub?.name}
                      </option>
                    )
                  })}
                  {CAPS_SUBJECTS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-gradient-to-b from-muted/40 to-transparent p-3 max-h-[46vh] lg:max-h-[42vh]">
              {messages.length === 0 ? (
                <div className="space-y-3 p-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Sawubona{user.profile.firstName ? `, ${user.profile.firstName}` : ''}! I’m your CAPS tutor.
                  </p>
                  <p>
                    Ask in any official language. I can explain Maths step-by-step, help with Physical Sciences, Life
                    Sciences, Accounting, languages, CAT/IT, and more — Grade R to 12.
                  </p>
                  <p>Upload a homework photo or PDF, tap the mic to speak, or choose Quiz / Flashcards / Study plan.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Explain fractions simply', 'Quiz me on photosynthesis', 'Study plan for June exams'].map((s) => (
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
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'mr-auto border border-border bg-card'
                  }`}
                >
                  {m.content}
                  {m.role === 'assistant' ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100"
                      onClick={() => speakText(m.content, languageCode)}
                    >
                      <Volume2 className="h-3 w-3" /> Listen
                    </button>
                  ) : null}
                </div>
              ))}
              {busy ? (
                <div className="mr-auto animate-pulse rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  Thinking like a great teacher…
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {(imageDataUrl || pdfText) && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                {imageDataUrl ? <Camera className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                <span className="flex-1 truncate">{attachmentName || 'Attachment ready'}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setImageDataUrl(undefined)
                    setPdfText(undefined)
                    setAttachmentName(undefined)
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="hidden"
                onChange={(e) => void onPickFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Upload homework photo or PDF"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={listening ? 'destructive' : 'outline'}
                aria-label={listening ? 'Stop listening' : 'Voice input'}
                onClick={toggleVoice}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={speakReplies ? 'Mute voice replies' : 'Enable voice replies'}
                onClick={() => {
                  setSpeakReplies((v) => !v)
                  if (speakReplies) stopSpeaking()
                }}
              >
                {speakReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  mode === 'quiz'
                    ? 'What should I quiz you on?'
                    : 'Ask in English, isiZulu, Afrikaans, or any official language…'
                }
                className="min-h-11 max-h-32 flex-1 resize-y"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <Button type="button" size="icon" disabled={busy} onClick={() => void send()} aria-label="Send">
                {busy ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Honest AI: if unsure, the tutor says so. Photos use GPT-4o vision when enabled. Voice works best in Chrome.
              Logged in as {fullName(user.profile.firstName, user.profile.lastName)}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
