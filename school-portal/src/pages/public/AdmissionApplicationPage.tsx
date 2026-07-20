import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { School, Upload } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { schoolName } from '@/lib/supabase'
import type { Gender } from '@/types'
import { validateSaId } from '@/lib/utils'

export function AdmissionApplicationPage() {
  const [form, setForm] = useState({
    applicantName: '',
    applicantSurname: '',
    idNumber: '',
    gender: 'prefer_not_to_say' as Gender,
    dateOfBirth: '',
    gradeApplyingFor: '8',
    currentSchool: '',
    previousGrade: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    physicalAddress: '',
    emergencyContact: '',
  })
  const [files, setFiles] = useState({
    birthCertificateUrl: '',
    parentIdUrl: '',
    latestReportUrl: '',
    proofOfResidenceUrl: '',
  })
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function onFile(key: keyof typeof files, file?: File | null) {
    if (!file) return
    setFiles((f) => ({ ...f, [key]: `uploads/${file.name}` }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateSaId(form.idNumber) && form.idNumber.replace(/\s/g, '').length === 13) {
      // soft warning — still allow if Luhn fails for demo flexibility with sample IDs
      toast.message('ID number failed Luhn check — please verify')
    }
    if (!files.birthCertificateUrl || !files.parentIdUrl || !files.latestReportUrl || !files.proofOfResidenceUrl) {
      toast.error('Please upload all required documents')
      return
    }
    try {
      const adm = await api.createAdmission({
        applicantName: form.applicantName,
        applicantSurname: form.applicantSurname,
        idNumber: form.idNumber.replace(/\s/g, ''),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        gradeApplyingFor: Number(form.gradeApplyingFor),
        currentSchool: form.currentSchool || undefined,
        previousGrade: form.previousGrade ? Number(form.previousGrade) : undefined,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        physicalAddress: form.physicalAddress,
        emergencyContact: form.emergencyContact || undefined,
        ...files,
      })
      setSubmittedId(adm.id)
      toast.success('Application submitted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  if (submittedId) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg animate-slide-up">
          <CardHeader>
            <CardTitle>Application received</CardTitle>
            <CardDescription>
              Reference <span className="font-mono font-semibold">{submittedId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Status: <strong>Pending</strong></p>
            <p className="text-muted-foreground">
              The admissions office will review your documents. You will be contacted at the parent email provided.
            </p>
            <div className="flex gap-2">
              <Link to="/login">
                <Button>Sign in</Button>
              </Link>
              <Button variant="outline" onClick={() => setSubmittedId(null)}>
                Submit another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl animate-slide-up">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <School className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary">{schoolName}</h1>
          <p className="text-sm text-muted-foreground">Online Admission Application · Grades 8–12</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application form</CardTitle>
            <CardDescription>All fields and document uploads are required unless marked optional</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
              <Field label="Applicant name">
                <Input required value={form.applicantName} onChange={(e) => set('applicantName', e.target.value)} />
              </Field>
              <Field label="Surname">
                <Input required value={form.applicantSurname} onChange={(e) => set('applicantSurname', e.target.value)} />
              </Field>
              <Field label="ID number">
                <Input required value={form.idNumber} onChange={(e) => set('idNumber', e.target.value)} placeholder="13-digit SA ID" />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </Field>
              <Field label="Date of birth">
                <Input type="date" required value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </Field>
              <Field label="Grade applying for">
                <Select value={form.gradeApplyingFor} onChange={(e) => set('gradeApplyingFor', e.target.value)}>
                  {[8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Current school (optional)">
                <Input value={form.currentSchool} onChange={(e) => set('currentSchool', e.target.value)} />
              </Field>
              <Field label="Previous grade (optional)">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.previousGrade}
                  onChange={(e) => set('previousGrade', e.target.value)}
                />
              </Field>
              <Field label="Parent name">
                <Input required value={form.parentName} onChange={(e) => set('parentName', e.target.value)} />
              </Field>
              <Field label="Parent phone">
                <Input required value={form.parentPhone} onChange={(e) => set('parentPhone', e.target.value)} />
              </Field>
              <Field label="Parent email">
                <Input type="email" required value={form.parentEmail} onChange={(e) => set('parentEmail', e.target.value)} />
              </Field>
              <Field label="Emergency contact (optional)">
                <Input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
              </Field>
              <div className="sm:col-span-2 space-y-2">
                <Label>Physical address</Label>
                <Textarea required value={form.physicalAddress} onChange={(e) => set('physicalAddress', e.target.value)} />
              </div>

              <UploadField
                label="Birth certificate"
                file={files.birthCertificateUrl}
                onChange={(f) => onFile('birthCertificateUrl', f)}
              />
              <UploadField label="Parent ID" file={files.parentIdUrl} onChange={(f) => onFile('parentIdUrl', f)} />
              <UploadField
                label="Latest report"
                file={files.latestReportUrl}
                onChange={(f) => onFile('latestReportUrl', f)}
              />
              <UploadField
                label="Proof of residence"
                file={files.proofOfResidenceUrl}
                onChange={(f) => onFile('proofOfResidenceUrl', f)}
              />

              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
                <Button type="submit">Submit application</Button>
                <Link to="/login">
                  <Button type="button" variant="outline">
                    Back to login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function UploadField({
  label,
  file,
  onChange,
}: {
  label: string
  file: string
  onChange: (f?: File | null) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-3 text-sm hover:bg-muted">
        <Upload className="h-4 w-4 text-primary" />
        <span className="truncate">{file ? file.replace('uploads/', '') : 'Choose file…'}</span>
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files?.[0])} />
      </label>
    </div>
  )
}
