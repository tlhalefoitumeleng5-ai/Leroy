import { requireSupabase, supabase } from '@/lib/supabase'
import { APPLICATION_DOC_TYPES, detectImageBlur } from '@/lib/applications'
import type {
  ApplicationDocument,
  ApplicationNotification,
  ApplicationStatusEvent,
  StudentApplication,
  StudentApplicationStatus,
  StudentApplicationType,
} from '@/types'

function mapApp(row: Record<string, unknown>): StudentApplication {
  return {
    id: String(row.id),
    schoolId: String(row.school_id),
    applicationNumber: String(row.application_number),
    accessCode: String(row.access_code),
    applicationType: row.application_type as StudentApplicationType,
    status: row.status as StudentApplicationStatus,
    firstName: String(row.first_name ?? ''),
    middleName: row.middle_name ? String(row.middle_name) : undefined,
    surname: String(row.surname ?? ''),
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : undefined,
    gender: row.gender ? String(row.gender) : undefined,
    idOrPassport: row.id_or_passport ? String(row.id_or_passport) : undefined,
    nationality: row.nationality ? String(row.nationality) : undefined,
    homeLanguage: row.home_language ? String(row.home_language) : undefined,
    gradeApplyingFor: row.grade_applying_for ? String(row.grade_applying_for) : undefined,
    previousSchool: row.previous_school ? String(row.previous_school) : undefined,
    currentGrade: row.current_grade ? String(row.current_grade) : undefined,
    residentialAddress: row.residential_address ? String(row.residential_address) : undefined,
    parentFullName: row.parent_full_name ? String(row.parent_full_name) : undefined,
    parentRelationship: row.parent_relationship ? String(row.parent_relationship) : undefined,
    parentIdNumber: row.parent_id_number ? String(row.parent_id_number) : undefined,
    parentPhone: row.parent_phone ? String(row.parent_phone) : undefined,
    parentWhatsapp: row.parent_whatsapp ? String(row.parent_whatsapp) : undefined,
    parentEmail: row.parent_email ? String(row.parent_email) : undefined,
    parentOccupation: row.parent_occupation ? String(row.parent_occupation) : undefined,
    emergencyContact: row.emergency_contact ? String(row.emergency_contact) : undefined,
    medicalAid: row.medical_aid ? String(row.medical_aid) : undefined,
    medicalConditions: row.medical_conditions ? String(row.medical_conditions) : undefined,
    allergies: row.allergies ? String(row.allergies) : undefined,
    doctorName: row.doctor_name ? String(row.doctor_name) : undefined,
    doctorContact: row.doctor_contact ? String(row.doctor_contact) : undefined,
    formLocale: row.form_locale ? String(row.form_locale) : 'en-ZA',
    isDraft: Boolean(row.is_draft ?? true),
    adminNotes: row.admin_notes ? String(row.admin_notes) : undefined,
    missingDocumentsNote: row.missing_documents_note ? String(row.missing_documents_note) : undefined,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapDoc(row: Record<string, unknown>): ApplicationDocument {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    docType: String(row.doc_type),
    fileName: String(row.file_name),
    mimeType: row.mime_type ? String(row.mime_type) : undefined,
    storagePath: String(row.storage_path),
    fileSize: Number(row.file_size ?? 0),
    isBlurry: Boolean(row.is_blurry),
    createdAt: String(row.created_at),
  }
}

function mapEvent(row: Record<string, unknown>): ApplicationStatusEvent {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    fromStatus: row.from_status ? String(row.from_status) : undefined,
    toStatus: String(row.to_status),
    note: row.note ? String(row.note) : undefined,
    actorId: row.actor_id ? String(row.actor_id) : undefined,
    createdAt: String(row.created_at),
  }
}

function mapNotif(row: Record<string, unknown>): ApplicationNotification {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    channel: row.channel as ApplicationNotification['channel'],
    recipient: String(row.recipient),
    subject: row.subject ? String(row.subject) : undefined,
    body: String(row.body),
    status: row.status as ApplicationNotification['status'],
    error: row.error ? String(row.error) : undefined,
    createdAt: String(row.created_at),
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
  }
}

export type ApplicationFormPayload = Partial<{
  application_type: StudentApplicationType
  first_name: string
  middle_name: string
  surname: string
  date_of_birth: string
  gender: string
  id_or_passport: string
  nationality: string
  home_language: string
  grade_applying_for: string
  previous_school: string
  current_grade: string
  residential_address: string
  parent_full_name: string
  parent_relationship: string
  parent_id_number: string
  parent_phone: string
  parent_whatsapp: string
  parent_email: string
  parent_occupation: string
  emergency_contact: string
  medical_aid: string
  medical_conditions: string
  allergies: string
  doctor_name: string
  doctor_contact: string
  form_locale: string
}>

async function resolveSchoolId(): Promise<string> {
  const sb = requireSupabase()
  const { data, error } = await sb.rpc('public_school_info')
  if (error) throw error
  const info = data as { id?: string } | null
  if (!info?.id) throw new Error('No school configured')
  return String(info.id)
}

async function queueNotifications(
  application: StudentApplication,
  kind: 'submitted' | 'status',
  extraNote?: string,
) {
  const sb = requireSupabase()
  await sb.rpc('queue_application_notifications', {
    p_application_id: application.id,
    p_kind: kind,
    p_extra_note: extraNote || null,
  })
}

export const applicationsApi = {
  async listApplications(): Promise<StudentApplication[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('student_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapApp(r as Record<string, unknown>))
  },

  async getApplication(id: string): Promise<StudentApplication | null> {
    const sb = requireSupabase()
    const { data, error } = await sb.from('student_applications').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapApp(data as Record<string, unknown>) : null
  },

  async listDocuments(applicationId: string): Promise<ApplicationDocument[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('application_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    const docs = (data ?? []).map((r) => mapDoc(r as Record<string, unknown>))
    for (const d of docs) {
      const { data: signed } = await sb.storage.from('admissions-docs').createSignedUrl(d.storagePath, 60 * 60)
      d.signedUrl = signed?.signedUrl
    }
    return docs
  },

  async listEvents(applicationId: string): Promise<ApplicationStatusEvent[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('application_status_events')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapEvent(r as Record<string, unknown>))
  },

  async listNotifications(applicationId: string): Promise<ApplicationNotification[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('application_notifications')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapNotif(r as Record<string, unknown>))
  },

  async startDraft(input: {
    applicationType: StudentApplicationType
    formLocale?: string
    firstName?: string
    surname?: string
  }): Promise<StudentApplication> {
    const sb = requireSupabase()
    const schoolId = await resolveSchoolId()
    const { data, error } = await sb.rpc('start_student_application_draft', {
      p_school_id: schoolId,
      p_application_type: input.applicationType,
      p_form_locale: input.formLocale || 'en-ZA',
      p_first_name: input.firstName || '',
      p_surname: input.surname || '',
    })
    if (error) throw error
    const result = data as { ok?: boolean; application?: Record<string, unknown>; error?: string }
    if (!result?.ok || !result.application) throw new Error(result?.error || 'Could not start application')
    return mapApp(result.application)
  },

  async saveDraft(id: string, accessCode: string, payload: ApplicationFormPayload): Promise<StudentApplication> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('save_student_application_draft', {
      p_id: id,
      p_access_code: accessCode,
      p_payload: payload,
    })
    if (error) throw error
    const result = data as { ok?: boolean; application?: Record<string, unknown>; error?: string }
    if (!result?.ok || !result.application) throw new Error(result?.error || 'Save failed')
    return mapApp(result.application)
  },

  async submitApplication(id: string, accessCode: string): Promise<StudentApplication> {
    const sb = requireSupabase()
    const tracked = await this.trackById(id, accessCode)
    const app = tracked.application
    const docs = tracked.documents

    const required = APPLICATION_DOC_TYPES.filter((d) =>
      app.applicationType === 'new_student' ? d.requiredForNew : d.requiredForReturning,
    )
    const missing = required.filter((r) => !docs.some((d) => d.docType === r.id))
    if (missing.length) {
      throw new Error(`Missing required documents: ${missing.map((m) => m.label).join(', ')}`)
    }
    if (!app.firstName || !app.surname || !app.parentFullName || !app.parentPhone || !app.parentEmail) {
      throw new Error('Please complete personal and parent details before submitting')
    }

    const { data, error } = await sb.rpc('submit_student_application', {
      p_id: id,
      p_access_code: accessCode,
    })
    if (error) throw error
    const result = data as { ok?: boolean; application?: Record<string, unknown>; error?: string }
    if (!result?.ok || !result.application) throw new Error(result?.error || 'Submit failed')

    const submitted = mapApp(result.application)
    await queueNotifications(submitted, 'submitted')
    return submitted
  },

  async trackById(id: string, accessCode: string) {
    const sb = requireSupabase()
    // Reuse track RPC via number lookup first — fall back to secure document list + draft save proof
    const { data: draft } = await sb.rpc('save_student_application_draft', {
      p_id: id,
      p_access_code: accessCode,
      p_payload: {},
    })
    const draftResult = draft as { ok?: boolean; application?: Record<string, unknown>; error?: string }
    if (!draftResult?.ok || !draftResult.application) throw new Error(draftResult?.error || 'Not found')
    const application = mapApp(draftResult.application)
    const { data: docsData, error: docsErr } = await sb.rpc('list_application_documents_secure', {
      p_application_id: id,
      p_access_code: accessCode,
    })
    if (docsErr) throw docsErr
    const docsResult = docsData as { ok?: boolean; documents?: Array<Record<string, unknown>>; error?: string }
    if (!docsResult?.ok) throw new Error(docsResult?.error || 'Could not load documents')
    const documents = (docsResult.documents ?? []).map((r) =>
      mapDoc({
        ...r,
        application_id: r.application_id ?? r.applicationId,
        doc_type: r.doc_type ?? r.docType,
        file_name: r.file_name ?? r.fileName,
        mime_type: r.mime_type ?? r.mimeType,
        storage_path: r.storage_path ?? r.storagePath,
        file_size: r.file_size ?? r.fileSize,
        is_blurry: r.is_blurry ?? r.isBlurry,
        created_at: r.created_at ?? r.createdAt,
      }),
    )
    for (const d of documents) {
      const { data: signed } = await sb.storage.from('admissions-docs').createSignedUrl(d.storagePath, 60 * 60)
      d.signedUrl = signed?.signedUrl
    }
    return { application, documents }
  },

  async track(applicationNumber: string, accessCode: string) {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('track_student_application', {
      p_application_number: applicationNumber,
      p_access_code: accessCode,
    })
    if (error) throw error
    const result = data as {
      ok?: boolean
      error?: string
      application?: Record<string, unknown>
      documents?: Array<Record<string, unknown>>
      events?: Array<Record<string, unknown>>
    }
    if (!result?.ok || !result.application) throw new Error(result?.error || 'Not found')
    const application = mapApp(result.application)
    const documents = (result.documents ?? []).map(mapDoc)
    for (const d of documents) {
      const { data: signed } = await sb.storage.from('admissions-docs').createSignedUrl(d.storagePath, 60 * 60)
      d.signedUrl = signed?.signedUrl
    }
    return {
      application,
      documents,
      events: (result.events ?? []).map(mapEvent),
    }
  },

  async uploadDocument(input: {
    applicationId: string
    accessCode: string
    docType: string
    file: File
    onProgress?: (pct: number) => void
  }): Promise<ApplicationDocument> {
    const sb = requireSupabase()
    input.onProgress?.(10)
    const isBlurry = await detectImageBlur(input.file)
    input.onProgress?.(25)

    const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${input.applicationId}/${input.docType}/${Date.now()}_${safeName}`
    const { error: upErr } = await sb.storage.from('admissions-docs').upload(path, input.file, {
      upsert: true,
      contentType: input.file.type || undefined,
    })
    if (upErr) throw upErr
    input.onProgress?.(80)

    const { data, error } = await sb.rpc('add_application_document', {
      p_application_id: input.applicationId,
      p_access_code: input.accessCode,
      p_doc_type: input.docType,
      p_file_name: input.file.name,
      p_mime_type: input.file.type || null,
      p_storage_path: path,
      p_file_size: input.file.size,
      p_is_blurry: isBlurry,
    })
    if (error) throw error
    const result = data as { ok?: boolean; document?: Record<string, unknown>; error?: string }
    if (!result?.ok || !result.document) throw new Error(result?.error || 'Upload metadata failed')
    input.onProgress?.(100)

    const doc = mapDoc(result.document)
    const { data: signed } = await sb.storage.from('admissions-docs').createSignedUrl(path, 60 * 60)
    doc.signedUrl = signed?.signedUrl
    return doc
  },

  async deleteDocument(documentId: string, applicationId: string, accessCode: string) {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('delete_application_document_secure', {
      p_document_id: documentId,
      p_application_id: applicationId,
      p_access_code: accessCode,
    })
    if (error) throw error
    const result = data as { ok?: boolean; storagePath?: string; error?: string }
    if (!result?.ok) throw new Error(result?.error || 'Delete failed')
    if (result.storagePath) {
      await sb.storage.from('admissions-docs').remove([result.storagePath])
    }
  },

  async updateStatus(input: {
    id: string
    status: StudentApplicationStatus
    note?: string
    missingDocumentsNote?: string
    adminNotes?: string
    actorId?: string
  }): Promise<StudentApplication> {
    const sb = requireSupabase()
    const { data: existing, error: getErr } = await sb
      .from('student_applications')
      .select('*')
      .eq('id', input.id)
      .single()
    if (getErr) throw getErr
    const prev = mapApp(existing as Record<string, unknown>)

    const { data, error } = await sb
      .from('student_applications')
      .update({
        status: input.status,
        is_draft: input.status === 'draft',
        admin_notes: input.adminNotes ?? prev.adminNotes ?? null,
        missing_documents_note: input.missingDocumentsNote ?? prev.missingDocumentsNote ?? null,
        reviewed_by: input.actorId || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select('*')
      .single()
    if (error) throw error

    await sb.from('application_status_events').insert({
      application_id: input.id,
      from_status: prev.status,
      to_status: input.status,
      note: input.note || input.missingDocumentsNote || null,
      actor_id: input.actorId || null,
    })

    const updated = mapApp(data as Record<string, unknown>)
    await queueNotifications(updated, 'status', input.note || input.missingDocumentsNote)
    return updated
  },

  async downloadDocumentBlob(storagePath: string) {
    const sb = requireSupabase()
    const { data, error } = await sb.storage.from('admissions-docs').download(storagePath)
    if (error) throw error
    return data
  },

  missingRequiredDocs(app: StudentApplication, docs: ApplicationDocument[]) {
    return APPLICATION_DOC_TYPES.filter((d) =>
      app.applicationType === 'new_student' ? d.requiredForNew : d.requiredForReturning,
    ).filter((r) => !docs.some((d) => d.docType === r.id))
  },

  /** Public school name for the apply header */
  async getSchoolName() {
    if (!supabase) return 'School'
    const { data } = await supabase.rpc('public_school_info')
    const info = data as { name?: string } | null
    return info?.name || 'School'
  },
}
