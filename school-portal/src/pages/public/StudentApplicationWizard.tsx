import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import {
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  APPLICATION_DOC_TYPES,
  APPLICATION_GRADES,
  APPLICATION_LANGUAGES,
  DRAFT_STORAGE_KEY,
  detectImageBlur,
  uiText,
} from '@/lib/applications'
import { applicationsApi } from '@/services/applications-api'
import { streamTutorReply } from '@/lib/caps-tutor'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ApplicationDocument, StudentApplication, StudentApplicationType } from '@/types'

type Step = 0 | 1 | 2 | 3 | 4

type FormState = {
  applicationType: StudentApplicationType
  firstName: string
  middleName: string
  surname: string
  dateOfBirth: string
  gender: string
  idOrPassport: string
  nationality: string
  homeLanguage: string
  gradeApplyingFor: string
  previousSchool: string
  currentGrade: string
  residentialAddress: string
  parentFullName: string
  parentRelationship: string
  parentIdNumber: string
  parentPhone: string
  parentWhatsapp: string
  parentEmail: string
  parentOccupation: string
  emergencyContact: string
  medicalAid: string
  medicalConditions: string
  allergies: string
  doctorName: string
  doctorContact: string
  formLocale: string
}

const emptyForm = (locale = 'en-ZA'): FormState => ({
  applicationType: 'new_student',
  firstName: '',
  middleName: '',
  surname: '',
  dateOfBirth: '',
  gender: 'prefer_not_to_say',
  idOrPassport: '',
  nationality: 'South African',
  homeLanguage: 'English',
  gradeApplyingFor: '8',
  previousSchool: '',
  currentGrade: '',
  residentialAddress: '',
  parentFullName: '',
  parentRelationship: 'Mother',
  parentIdNumber: '',
  parentPhone: '',
  parentWhatsapp: '',
  parentEmail: '',
  parentOccupation: '',
  emergencyContact: '',
  medicalAid: '',
  medicalConditions: '',
  allergies: '',
  doctorName: '',
  doctorContact: '',
  formLocale: locale,
})

function toPayload(form: FormState) {
  return {
    application_type: form.applicationType,
    first_name: form.firstName,
    middle_name: form.middleName,
    surname: form.surname,
    date_of_birth: form.dateOfBirth || undefined,
    gender: form.gender,
    id_or_passport: form.idOrPassport,
    nationality: form.nationality,
    home_language: form.homeLanguage,
    grade_applying_for: form.gradeApplyingFor,
    previous_school: form.previousSchool,
    current_grade: form.currentGrade,
    residential_address: form.residentialAddress,
    parent_full_name: form.parentFullName,
    parent_relationship: form.parentRelationship,
    parent_id_number: form.parentIdNumber,
    parent_phone: form.parentPhone,
    parent_whatsapp: form.parentWhatsapp,
    parent_email: form.parentEmail,
    parent_occupation: form.parentOccupation,
    emergency_contact: form.emergencyContact,
    medical_aid: form.medicalAid,
    medical_conditions: form.medicalConditions,
    allergies: form.allergies,
    doctor_name: form.doctorName,
    doctor_contact: form.doctorContact,
    form_locale: form.formLocale,
  }
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  )
}

type UploadItem = ApplicationDocument & { progress?: number; localPreview?: string }

export function StudentApplicationWizard({
  schoolName,
  onSubmitted,
}: {
  schoolName: string
  onSubmitted: (app: StudentApplication) => void
}) {
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<FormState>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (raw) return { ...emptyForm(), ...JSON.parse(raw).form }
    } catch {
      /* ignore */
    }
    return emptyForm()
  })
  const [appMeta, setAppMeta] = useState<{ id: string; accessCode: string; applicationNumber: string } | null>(
    () => {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (raw) return JSON.parse(raw).meta ?? null
      } catch {
        /* ignore */
      }
      return null
    },
  )
  const [docs, setDocs] = useState<UploadItem[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiQ, setAiQ] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const saveTimer = useRef<number | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadDocType, setUploadDocType] = useState(APPLICATION_DOC_TYPES[0].id)
  const [dragOver, setDragOver] = useState(false)

  const t = useCallback((key: string) => uiText(form.formLocale, key), [form.formLocale])

  const steps = useMemo(
    () => [
      { id: 0 as Step, label: t('personal') },
      { id: 1 as Step, label: t('parent') },
      { id: 2 as Step, label: t('medical') },
      { id: 3 as Step, label: t('documents') },
      { id: 4 as Step, label: t('review') },
    ],
    [t],
  )

  const progress = ((step + 1) / steps.length) * 100

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Local autosave every field change
  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, meta: appMeta }))
  }, [form, appMeta])

  // Remote autosave (debounced)
  useEffect(() => {
    if (!appMeta) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        setSaving(true)
        try {
          await applicationsApi.saveDraft(appMeta.id, appMeta.accessCode, toPayload(form))
          setSavedAt(new Date().toLocaleTimeString())
        } catch {
          /* keep local draft */
        } finally {
          setSaving(false)
        }
      })()
    }, 700)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [form, appMeta])

  async function ensureDraft() {
    if (appMeta) return appMeta
    const created = await applicationsApi.startDraft({
      applicationType: form.applicationType,
      formLocale: form.formLocale,
      firstName: form.firstName,
      surname: form.surname,
    })
    const meta = {
      id: created.id,
      accessCode: created.accessCode,
      applicationNumber: created.applicationNumber,
    }
    setAppMeta(meta)
    await applicationsApi.saveDraft(meta.id, meta.accessCode, toPayload(form))
    return meta
  }

  async function loadDocs(id: string) {
    if (!appMeta) return
    const tracked = await applicationsApi.trackById(id, appMeta.accessCode)
    setDocs(tracked.documents)
  }

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return
    const meta = await ensureDraft()
    for (const file of Array.from(fileList)) {
      const tempId = crypto.randomUUID()
      const localPreview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      setDocs((prev) => [
        ...prev,
        {
          id: tempId,
          applicationId: meta.id,
          docType: uploadDocType,
          fileName: file.name,
          mimeType: file.type,
          storagePath: '',
          fileSize: file.size,
          isBlurry: false,
          createdAt: new Date().toISOString(),
          progress: 5,
          localPreview,
        },
      ])
      try {
        if (file.type.startsWith('image/')) {
          const blurry = await detectImageBlur(file)
          if (blurry) toast.message('This photo looks blurry — please upload a clearer copy if possible')
        }
        const uploaded = await applicationsApi.uploadDocument({
          applicationId: meta.id,
          accessCode: meta.accessCode,
          docType: uploadDocType,
          file,
          onProgress: (pct) =>
            setDocs((prev) => prev.map((d) => (d.id === tempId ? { ...d, progress: pct } : d))),
        })
        setDocs((prev) => prev.map((d) => (d.id === tempId ? { ...uploaded, progress: 100, localPreview } : d)))
        if (uploaded.isBlurry) {
          toast.warning(`${file.name} may be blurry. Please re-upload a clearer copy.`)
        } else {
          toast.success(`${file.name} uploaded`)
        }
      } catch (err) {
        setDocs((prev) => prev.filter((d) => d.id !== tempId))
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      }
    }
  }

  async function removeDoc(doc: UploadItem) {
    if (!appMeta || !doc.storagePath) {
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
      return
    }
    try {
      await applicationsApi.deleteDocument(doc.id, appMeta.id, appMeta.accessCode)
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
      toast.success('File removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    void handleFiles(e.dataTransfer.files)
  }

  async function goNext() {
    try {
      setBusy(true)
      const meta = await ensureDraft()
      if (step === 3) await loadDocs(meta.id)
      setStep((s) => Math.min(4, s + 1) as Step)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save draft')
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    try {
      setBusy(true)
      const meta = await ensureDraft()
      await applicationsApi.saveDraft(meta.id, meta.accessCode, toPayload(form))
      const submitted = await applicationsApi.submitApplication(meta.id, meta.accessCode)
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      onSubmitted(submitted)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  async function askAi() {
    if (!aiQ.trim()) return
    setAiBusy(true)
    setAiReply('')
    try {
      const missing = APPLICATION_DOC_TYPES.filter((d) =>
        form.applicationType === 'new_student' ? d.requiredForNew : d.requiredForReturning,
      )
        .filter((r) => !docs.some((d) => d.docType === r.id))
        .map((m) => m.label)
      const blurry = docs.filter((d) => d.isBlurry).map((d) => d.fileName)
      const context = [
        `The parent is completing a South African school ${form.applicationType} application form.`,
        `UI language: ${form.formLocale}. Translate explanations into this language when helpful.`,
        `Current step: ${steps[step]?.label}.`,
        `Grade applying for: ${form.gradeApplyingFor}.`,
        missing.length ? `Missing required documents: ${missing.join(', ')}.` : 'Required documents look present.',
        blurry.length ? `Possibly blurry uploads: ${blurry.join(', ')}. Ask them to re-upload clearer copies.` : '',
        'Explain form questions clearly. Do NOT build apps or websites. Do most of the writing help and ask a follow-up.',
      ]
        .filter(Boolean)
        .join('\n')
      const result = await streamTutorReply(
        {
          question: `${context}\n\nParent question: ${aiQ}`,
          languageCode: form.formLocale,
          mode: 'explain',
          gradeLevel: form.gradeApplyingFor ? `Grade ${form.gradeApplyingFor}` : undefined,
        },
        (_c, full) => setAiReply(full),
      )
      setAiReply(result.reply)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI unavailable')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">{schoolName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-sky-100">{t('subtitle')}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-sky-100">
          <span>
            Step {step + 1} of {steps.length} · {steps[step]?.label}
          </span>
          <span className="inline-flex items-center gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            {savedAt ? `${t('save')} ${savedAt}` : t('save')}
          </span>
        </div>
        {appMeta ? (
          <p className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-xs">
            Application <span className="font-mono font-semibold">{appMeta.applicationNumber}</span> · Access code{' '}
            <span className="font-mono font-semibold">{appMeta.accessCode}</span>
          </p>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              step === s.id
                ? 'border-sky-600 bg-sky-600 text-white'
                : step > s.id
                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-white text-slate-600',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card className="border-sky-100 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    form.applicationType === 'new_student'
                      ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-200'
                      : 'border-slate-200',
                  )}
                  onClick={() => patch('applicationType', 'new_student')}
                >
                  <p className="font-semibold text-sky-900">{t('newStudent')}</p>
                  <p className="text-xs text-slate-500">First-time enrolment</p>
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    form.applicationType === 'returning_student'
                      ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-200'
                      : 'border-slate-200',
                  )}
                  onClick={() => patch('applicationType', 'returning_student')}
                >
                  <p className="font-semibold text-sky-900">{t('returning')}</p>
                  <p className="text-xs text-slate-500">Re-registering learner</p>
                </button>
              </div>
              <Field label="Form language">
                <Select value={form.formLocale} onChange={(e) => patch('formLocale', e.target.value)}>
                  {APPLICATION_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="First Name">
                <Input value={form.firstName} onChange={(e) => patch('firstName', e.target.value)} required />
              </Field>
              <Field label="Middle Name (Optional)">
                <Input value={form.middleName} onChange={(e) => patch('middleName', e.target.value)} />
              </Field>
              <Field label="Surname">
                <Input value={form.surname} onChange={(e) => patch('surname', e.target.value)} required />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => patch('dateOfBirth', e.target.value)} />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => patch('gender', e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </Field>
              <Field label="ID Number or Passport Number">
                <Input value={form.idOrPassport} onChange={(e) => patch('idOrPassport', e.target.value)} />
              </Field>
              <Field label="Nationality">
                <Input value={form.nationality} onChange={(e) => patch('nationality', e.target.value)} />
              </Field>
              <Field label="Home Language">
                <Input value={form.homeLanguage} onChange={(e) => patch('homeLanguage', e.target.value)} />
              </Field>
              <Field label="Grade Applying For">
                <Select value={form.gradeApplyingFor} onChange={(e) => patch('gradeApplyingFor', e.target.value)}>
                  {APPLICATION_GRADES.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Previous School">
                <Input value={form.previousSchool} onChange={(e) => patch('previousSchool', e.target.value)} />
              </Field>
              <Field label="Current Grade">
                <Select value={form.currentGrade} onChange={(e) => patch('currentGrade', e.target.value)}>
                  <option value="">—</option>
                  {APPLICATION_GRADES.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Residential Address">
                  <Textarea
                    value={form.residentialAddress}
                    onChange={(e) => patch('residentialAddress', e.target.value)}
                    rows={3}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Parent Full Name">
                <Input value={form.parentFullName} onChange={(e) => patch('parentFullName', e.target.value)} />
              </Field>
              <Field label="Relationship">
                <Select value={form.parentRelationship} onChange={(e) => patch('parentRelationship', e.target.value)}>
                  {['Mother', 'Father', 'Guardian', 'Grandparent', 'Other'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ID Number">
                <Input value={form.parentIdNumber} onChange={(e) => patch('parentIdNumber', e.target.value)} />
              </Field>
              <Field label="Phone Number">
                <Input value={form.parentPhone} onChange={(e) => patch('parentPhone', e.target.value)} />
              </Field>
              <Field label="WhatsApp Number">
                <Input value={form.parentWhatsapp} onChange={(e) => patch('parentWhatsapp', e.target.value)} />
              </Field>
              <Field label="Email Address">
                <Input
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) => patch('parentEmail', e.target.value)}
                />
              </Field>
              <Field label="Occupation">
                <Input value={form.parentOccupation} onChange={(e) => patch('parentOccupation', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Emergency Contact">
                  <Textarea
                    value={form.emergencyContact}
                    onChange={(e) => patch('emergencyContact', e.target.value)}
                    placeholder="Name, relationship, phone"
                    rows={2}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Medical Aid">
                <Input value={form.medicalAid} onChange={(e) => patch('medicalAid', e.target.value)} />
              </Field>
              <Field label="Doctor Name">
                <Input value={form.doctorName} onChange={(e) => patch('doctorName', e.target.value)} />
              </Field>
              <Field label="Doctor Contact">
                <Input value={form.doctorContact} onChange={(e) => patch('doctorContact', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Medical Conditions">
                  <Textarea
                    value={form.medicalConditions}
                    onChange={(e) => patch('medicalConditions', e.target.value)}
                    rows={2}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Allergies">
                  <Textarea value={form.allergies} onChange={(e) => patch('allergies', e.target.value)} rows={2} />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Field label="Document type">
                <Select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as typeof uploadDocType)}
                >
                  {APPLICATION_DOC_TYPES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                      {(form.applicationType === 'new_student' ? d.requiredForNew : d.requiredForReturning)
                        ? ' *'
                        : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  'rounded-2xl border-2 border-dashed p-5 text-center transition',
                  dragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-slate-50/60',
                )}
              >
                <Upload className="mx-auto h-8 w-8 text-sky-600" />
                <p className="mt-2 text-sm font-medium text-slate-800">Drag & drop files here</p>
                <p className="text-xs text-slate-500">Camera · Gallery · PDF · DOCX · multiple files</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()}>
                    <Camera className="mr-1 h-4 w-4" /> Camera
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <ImageIcon className="mr-1 h-4 w-4" /> Gallery / Files
                  </Button>
                </div>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void handleFiles(e.target.files)}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleFiles(e.target.files)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {docs.map((d) => (
                  <div key={d.id} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                    {d.localPreview || (d.signedUrl && d.mimeType?.startsWith('image/')) ? (
                      <img
                        src={d.localPreview || d.signedUrl}
                        alt=""
                        className="h-28 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-lg bg-slate-50">
                        <FileText className="h-8 w-8 text-sky-600" />
                      </div>
                    )}
                    <p className="mt-1 truncate text-xs font-medium">{d.fileName}</p>
                    <p className="text-[10px] text-slate-500">
                      {APPLICATION_DOC_TYPES.find((x) => x.id === d.docType)?.label || d.docType}
                      {d.isBlurry ? ' · Blurry?' : ''}
                    </p>
                    {d.progress != null && d.progress < 100 ? (
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-sky-600 transition-all" style={{ width: `${d.progress}%` }} />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                      onClick={() => void removeDoc(d)}
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-sky-50 p-3">
                <p className="font-semibold text-sky-900">
                  {form.firstName} {form.middleName} {form.surname}
                </p>
                <p className="text-slate-600">
                  {form.applicationType === 'new_student' ? t('newStudent') : t('returning')} · Grade{' '}
                  {form.gradeApplyingFor}
                </p>
                <p className="text-slate-600">
                  Parent: {form.parentFullName} · {form.parentPhone} · {form.parentEmail}
                </p>
              </div>
              <p className="text-slate-600">{docs.length} document(s) attached</p>
              {appMeta ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  After submit, track with <strong>{appMeta.applicationNumber}</strong> and access code{' '}
                  <strong>{appMeta.accessCode}</strong>.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => (s - 1) as Step)}>
              {t('back')}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => setAiOpen((v) => !v)}>
                <Sparkles className="mr-1 h-4 w-4" /> {t('help')}
              </Button>
              {step < 4 ? (
                <Button type="button" disabled={busy} onClick={() => void goNext()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('next')}
                </Button>
              ) : (
                <Button type="button" disabled={busy} onClick={() => void submit()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submit')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {aiOpen ? (
        <Card className="border-sky-200 shadow-md animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="flex items-center gap-2 text-base text-sky-900">
              <Sparkles className="h-4 w-4" /> AI form helper
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setAiOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Explains questions, translates into all 12 official languages, checks missing docs, and warns about blurry
              uploads.
            </p>
            <Textarea
              value={aiQ}
              onChange={(e) => setAiQ(e.target.value)}
              placeholder="e.g. What is proof of residence? Explain in isiZulu."
              rows={2}
            />
            <Button type="button" disabled={aiBusy} onClick={() => void askAi()}>
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask AI'}
            </Button>
            {aiReply ? (
              <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-800">{aiReply}</div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function ApplicationSuccess({ app }: { app: StudentApplication }) {
  return (
    <Card className="mx-auto max-w-lg border-sky-100 shadow-lg animate-slide-up">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <CardTitle>Application submitted</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Application number:{' '}
          <span className="font-mono text-base font-bold text-sky-800">{app.applicationNumber}</span>
        </p>
        <p>
          Access code: <span className="font-mono text-base font-bold text-sky-800">{app.accessCode}</span>
        </p>
        <Badge variant="secondary">Pending</Badge>
        <p className="text-slate-600">
          We queued email, WhatsApp and SMS confirmations to the parent contacts. Use your number and access code anytime
          to track status.
        </p>
      </CardContent>
    </Card>
  )
}
