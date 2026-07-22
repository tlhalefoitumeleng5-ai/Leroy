import { requireSupabase, supabase } from '@/lib/supabase'
import { APPLICATION_DOC_TYPES, detectImageBlur, validateApplicationFile } from '@/lib/applications'
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
    applicantUserId: row.applicant_user_id ? String(row.applicant_user_id) : undefined,
    applicationNumber: String(row.application_number),
    accessCode: String(row.access_code),
    storageToken: row.storage_token ? String(row.storage_token) : undefined,
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
    parentResidentialAddress: row.parent_residential_address
      ? String(row.parent_residential_address)
      : undefined,
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
    applicationId: String(row.application_id ?? row.applicationId),
    docType: String(row.doc_type ?? row.docType),
    fileName: String(row.file_name ?? row.fileName),
    mimeType: row.mime_type || row.mimeType ? String(row.mime_type ?? row.mimeType) : undefined,
    storagePath: String(row.storage_path ?? row.storagePath),
    fileSize: Number(row.file_size ?? row.fileSize ?? 0),
    isBlurry: Boolean(row.is_blurry ?? row.isBlurry),
    createdAt: String(row.created_at ?? row.createdAt),
  }
}

function mapEvent(row: Record<string, unknown>): ApplicationStatusEvent {
  return {
    id: String(row.id),
    applicationId: String(row.application_id ?? row.applicationId),
    fromStatus: row.from_status || row.fromStatus ? String(row.from_status ?? row.fromStatus) : undefined,
    toStatus: String(row.to_status ?? row.toStatus),
    note: row.note ? String(row.note) : undefined,
    actorId: row.actor_id || row.actorId ? String(row.actor_id ?? row.actorId) : undefined,
    createdAt: String(row.created_at ?? row.createdAt),
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

function applicationFileMime(file: File) {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'doc') return 'application/msword'
  if (extension === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (extension === 'png') return 'image/png'
  return 'image/jpeg'
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
  parent_residential_address: string
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

  async listMyApplications(): Promise<StudentApplication[]> {
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
    return mapApp(result.application)
  },

  async trackById(id: string, accessCode: string) {
    const sb = requireSupabase()
    let { data: applicationData, error: applicationError } = await sb.rpc(
      'get_student_application_by_credentials',
      {
        p_id: id,
        p_access_code: accessCode,
      },
    )

    // Backward compatibility while the forward migration is being deployed.
    if (applicationError?.code === 'PGRST202' || applicationError?.code === '42883') {
      const legacy = await sb.rpc('save_student_application_draft', {
        p_id: id,
        p_access_code: accessCode,
        p_payload: {},
      })
      applicationData = legacy.data
      applicationError = legacy.error
    }
    if (applicationError) throw applicationError
    const applicationResult = applicationData as {
      ok?: boolean
      application?: Record<string, unknown>
      error?: string
    }
    if (!applicationResult?.ok || !applicationResult.application) {
      throw new Error(applicationResult?.error || 'Not found')
    }
    const application = mapApp(applicationResult.application)

    const { data: docsData, error: docsErr } = await sb.rpc('list_application_documents_secure', {
      p_application_id: id,
      p_access_code: accessCode,
    })
    if (docsErr) throw docsErr
    const docsResult = docsData as { ok?: boolean; documents?: Array<Record<string, unknown>>; error?: string }
    if (!docsResult?.ok) throw new Error(docsResult?.error || 'Could not load documents')
    const documents = (docsResult.documents ?? []).map(mapDoc)
    for (const document of documents) {
      const { data: signed } = await sb.storage
        .from('admissions-docs')
        .createSignedUrl(document.storagePath, 60 * 60)
      document.signedUrl = signed?.signedUrl
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
    for (const document of documents) {
      const { data: signed } = await sb.storage
        .from('admissions-docs')
        .createSignedUrl(document.storagePath, 60 * 60)
      document.signedUrl = signed?.signedUrl
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
    storageToken: string
    docType: string
    file: File
    onProgress?: (pct: number) => void
  }): Promise<ApplicationDocument> {
    const validationIssue = await validateApplicationFile(input.file)
    if (validationIssue) throw new Error(validationIssue)

    const sb = requireSupabase()
    input.onProgress?.(10)
    const isBlurry = await detectImageBlur(input.file)
    input.onProgress?.(25)

    if (!input.storageToken) throw new Error('This draft needs to be refreshed before uploading documents')
    const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const mimeType = applicationFileMime(input.file)
    const path = `${input.applicationId}/${input.storageToken}/${input.docType}/${Date.now()}_${safeName}`
    const { error: upErr } = await sb.storage.from('admissions-docs').upload(path, input.file, {
      upsert: false,
      contentType: mimeType,
    })
    if (upErr) throw upErr
    input.onProgress?.(80)

    const { data, error } = await sb.rpc('add_application_document', {
      p_application_id: input.applicationId,
      p_access_code: input.accessCode,
      p_doc_type: input.docType,
      p_file_name: input.file.name,
      p_mime_type: mimeType,
      p_storage_path: path,
      p_file_size: input.file.size,
      p_is_blurry: isBlurry,
    })
    if (error) {
      await sb.storage.from('admissions-docs').remove([path])
      throw error
    }
    const result = data as { ok?: boolean; document?: Record<string, unknown>; error?: string }
    if (!result?.ok || !result.document) {
      await sb.storage.from('admissions-docs').remove([path])
      throw new Error(result?.error || 'Upload metadata failed')
    }
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
    const result = data as { ok?: boolean; storagePath?: string; storageDeleted?: boolean; error?: string }
    if (!result?.ok) throw new Error(result?.error || 'Delete failed')
    if (result.storagePath && !result.storageDeleted) {
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
    const { data, error } = await sb.rpc('admin_update_student_application_status', {
      p_id: input.id,
      p_status: input.status,
      p_note: input.note || null,
      p_missing_documents_note: input.missingDocumentsNote || null,
      p_admin_notes: input.adminNotes || null,
      p_actor_id: input.actorId || null,
    })
    if (error) throw error
    const result = data as { ok?: boolean; application?: Record<string, unknown>; error?: string }
    if (!result?.ok || !result.application) throw new Error(result?.error || 'Update failed')
    return mapApp(result.application)
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
