import type { ApplicationDocType, StudentApplicationStatus, StudentApplicationType } from '@/types'
import { SA_OFFICIAL_LANGUAGES } from '@/lib/caps-tutor'

export const APPLICATION_DOC_TYPES: Array<{
  id: ApplicationDocType
  label: string
  requiredForNew: boolean
  requiredForReturning: boolean
}> = [
  { id: 'birth_certificate', label: 'Birth Certificate', requiredForNew: true, requiredForReturning: false },
  { id: 'id_copy', label: 'ID Copy / Passport', requiredForNew: true, requiredForReturning: true },
  { id: 'parent_id', label: 'Parent / Guardian ID', requiredForNew: true, requiredForReturning: true },
  { id: 'latest_report', label: 'Latest School Report', requiredForNew: true, requiredForReturning: true },
  { id: 'transfer_letter', label: 'Transfer Letter', requiredForNew: false, requiredForReturning: false },
  { id: 'proof_of_residence', label: 'Proof of Residence', requiredForNew: true, requiredForReturning: true },
  { id: 'passport_photo', label: 'Passport Photo', requiredForNew: true, requiredForReturning: false },
  { id: 'vaccination_card', label: 'Vaccination Card', requiredForNew: false, requiredForReturning: false },
  { id: 'court_documents', label: 'Court Documents (Optional)', requiredForNew: false, requiredForReturning: false },
  { id: 'other', label: 'Any Other Document', requiredForNew: false, requiredForReturning: false },
]

export const APPLICATION_STATUSES: Array<{ id: StudentApplicationStatus; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'pending', label: 'Pending' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'waiting_for_documents', label: 'Waiting for Documents' },
]

export const APPLICATION_GRADES = ['R', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export const APPLICATION_LANGUAGES = SA_OFFICIAL_LANGUAGES

/** Short UI strings for the applications wizard (12 official languages). */
export const APPLICATION_UI: Record<string, Record<string, string>> = {
  'en-ZA': {
    title: 'Student Applications',
    subtitle: 'Apply online — new or returning learners',
    newStudent: 'New Student Application',
    returning: 'Returning Student Registration',
    personal: 'Personal Details',
    parent: 'Parent / Guardian',
    medical: 'Medical Information',
    documents: 'Document Uploads',
    review: 'Review & Submit',
    continueLater: 'Continue later',
    track: 'Track application',
    save: 'Autosaved',
    submit: 'Submit application',
    next: 'Next',
    back: 'Back',
    help: 'Ask AI for help',
  },
  'af-ZA': {
    title: 'Studente-aansoeke',
    subtitle: 'Doen aanlyn aansoek — nuut of terugkerend',
    newStudent: 'Nuwe student-aansoek',
    returning: 'Terugkerende student-registrasie',
    personal: 'Persoonlike besonderhede',
    parent: 'Ouer / Voog',
    medical: 'Mediese inligting',
    documents: 'Dokumentoplaaie',
    review: 'Hersien & indien',
    continueLater: 'Gaan later voort',
    track: 'Volg aansoek',
    save: 'Outomaties gestoor',
    submit: 'Dien aansoek in',
    next: 'Volgende',
    back: 'Terug',
    help: 'Vra AI om hulp',
  },
  'zu-ZA': {
    title: 'Izicelo Zabafundi',
    subtitle: 'Faka isicelo ku-inthanethi',
    newStudent: 'Isicelo somfundi omusha',
    returning: 'Ukubhaliswa komfundi obuyayo',
    personal: 'Imininingwane yomuntu',
    parent: 'Umzali / Umqaphi',
    medical: 'Ulwazi lwezokwelapha',
    documents: 'Ukulayisha amadokhumenti',
    review: 'Buyekeza & Thumela',
    continueLater: 'Qhubeka kamuva',
    track: 'Landelela isicelo',
    save: 'Kulondolozwe ngokuzenzekelayo',
    submit: 'Thumela isicelo',
    next: 'Okulandelayo',
    back: 'Emuva',
    help: 'Cela usizo lwe-AI',
  },
  'xh-ZA': {
    title: 'Izicelo Zabafundi',
    subtitle: 'Faka isicelo kwi-intanethi',
    newStudent: 'Isicelo somfundi omtsha',
    returning: 'Ukubhaliswa komfundi obuyayo',
    personal: 'Iinkcukacha zobuqu',
    parent: 'Umzali / Umgcini',
    medical: 'Ulwazi lwezonyango',
    documents: 'Ukulayisha amaxwebhu',
    review: 'Phonononga & Ngenisa',
    continueLater: 'Qhubeka kamva',
    track: 'Landela isicelo',
    save: 'Kugciniwe ngokuzenzekelayo',
    submit: 'Ngenisa isicelo',
    next: 'Okulandelayo',
    back: 'Emva',
    help: 'Cela uncedo lwe-AI',
  },
  'st-ZA': {
    title: 'Likopo tsa Baithuti',
    subtitle: 'Etsa kopo inthaneteng',
    newStudent: 'Kopo ea moithuti e mocha',
    returning: 'Ngoliso ea moithuti ea ho khutla',
    personal: 'Lintlha tsa botho',
    parent: 'Motsoali / Mohlokomeli',
    medical: 'Tlhabollo ea bongaka',
    documents: 'Ho kenya litokomane',
    review: 'Hlahloba & Romela',
    continueLater: 'Tsoela pele hamorao',
    track: 'Latedisa kopo',
    save: 'E bolokiloe ka bo eona',
    submit: 'Romela kopo',
    next: 'E latelang',
    back: 'Morao',
    help: 'Kopa thuso ea AI',
  },
  'nso-ZA': {
    title: 'Dikopo tša Baithuti',
    subtitle: 'Dira kgopelo inthaneteng',
    newStudent: 'Kgopelo ya moithuti yo moswa',
    returning: 'Ngwadišo ya moithuti yo a boago',
    personal: 'Dintlha tša motho',
    parent: 'Motswadi / Mohlokomedi',
    medical: 'Tshedimošo ya kalafo',
    documents: 'Go tsenya ditokumente',
    review: 'Lekola & Romela',
    continueLater: 'Tšwela pele ka morago',
    track: 'Latela kgopelo',
    save: 'E bolokilwe ka go itiragalela',
    submit: 'Romela kgopelo',
    next: 'E latelago',
    back: 'Morago',
    help: 'Kgopela thušo ya AI',
  },
  'tn-ZA': {
    title: 'Dikopo tsa Baithuti',
    subtitle: 'Dirisa kopo mo inthaneteng',
    newStudent: 'Kopo ya moithuti yo mosha',
    returning: 'Kwadišo ya moithuti yo o boang',
    personal: 'Dintlha tsa motho',
    parent: 'Motsadi / Motlhokomedi',
    medical: 'Tshedimosetso ya kalafi',
    documents: 'Go tsenya ditokomane',
    review: 'Tlhatlhoba & Romela',
    continueLater: 'Tswelela pele moragonyana',
    track: 'Latela kopo',
    save: 'E bolokilwe ka go itiragalela',
    submit: 'Romela kopo',
    next: 'E e latelang',
    back: 'Morago',
    help: 'Kopa thuso ya AI',
  },
  'ts-ZA': {
    title: 'Swikombelo swa Vadyondzi',
    subtitle: 'Endla xikombelo eka inthanete',
    newStudent: 'Xikombelo xa mudyondzi luntshwa',
    returning: 'Ku tsarisiwa ka mudyondzi loyi a vuyaka',
    personal: 'Vuxokoxoko bya munhu',
    parent: 'Mutswari / Mulanguteri',
    medical: 'Mahungu ya vutshunguri',
    documents: 'Ku layicha tidokhumente',
    review: 'Kambisisa & Rhumerisa',
    continueLater: 'Yisa emahlweni endzhaku',
    track: 'Landzelela xikombelo',
    save: 'Ku hlayisiwile hi ku titirhisa',
    submit: 'Rhumerisa xikombelo',
    next: 'Leswi landzelaka',
    back: 'Endzhaku',
    help: 'Combela mpfuno wa AI',
  },
  've-ZA': {
    title: 'Zwikumbelo zwa Vhagudi',
    subtitle: 'Ita khumbelo kha inthanete',
    newStudent: 'Khumbelo ya mugudi muswa',
    returning: 'U ṅwaliswa ha mugudi a vhuyaho',
    personal: 'Zwidodombedzwa zwa muthu',
    parent: 'Mubebi / Mulanguli',
    medical: 'Mafhungo a vhushaka',
    documents: 'U longela zwidokhumente',
    review: 'Sedzulusa & Rumela',
    continueLater: 'Bvela phanḓa nga murahu',
    track: 'Tevedza khumbelo',
    save: 'Zwo vhulungwa nga u ḓiita',
    submit: 'Rumela khumbelo',
    next: 'Zwi tevhelaho',
    back: 'Murahu',
    help: 'Kumbela thuso ya AI',
  },
  'ss-ZA': {
    title: 'Ticelomfundi',
    subtitle: 'Faka sicelo ku-inthanethi',
    newStudent: 'Sicelo semfundi lomusha',
    returning: 'Kubhaliswa kwemfundi lobuyako',
    personal: 'Imininingwane yemuntfu',
    parent: 'Umzali / Umlondvoli',
    medical: 'Lwati lwetekwelapha',
    documents: 'Kulayisha emadokhumenti',
    review: 'Buyekeza & Tfumela',
    continueLater: 'Chubeka kamuva',
    track: 'Landzela sicelo',
    save: 'Kulondvolotwe ngekutentekela',
    submit: 'Tfumela sicelo',
    next: 'Lokulandzelako',
    back: 'Emuva',
    help: 'Cela lusito lwe-AI',
  },
  'nr-ZA': {
    title: 'Izicelo Zabafundi',
    subtitle: 'Faka isicelo ku-inthanethi',
    newStudent: 'Isicelo somfundi omutjha',
    returning: 'Ukubhaliswa komfundi obuyako',
    personal: 'Imininingwana yomuntu',
    parent: 'Umzali / Umlondolozi',
    medical: 'Ilwazi lezokwelapha',
    documents: 'Ukulayitjha amadokhumenti',
    review: 'Buyekeza & Thumela',
    continueLater: 'Qhubeka kamuva',
    track: 'Landela isicelo',
    save: 'Kulondolozwe ngokuzenzakalela',
    submit: 'Thumela isicelo',
    next: 'Okulandelako',
    back: 'Emuva',
    help: 'Cela usizo lwe-AI',
  },
  'en-ZA-sign': {
    title: 'Student Applications (SASL support)',
    subtitle: 'Apply online — written SASL support available via AI',
    newStudent: 'New Student Application',
    returning: 'Returning Student Registration',
    personal: 'Personal Details',
    parent: 'Parent / Guardian',
    medical: 'Medical Information',
    documents: 'Document Uploads',
    review: 'Review & Submit',
    continueLater: 'Continue later',
    track: 'Track application',
    save: 'Autosaved',
    submit: 'Submit application',
    next: 'Next',
    back: 'Back',
    help: 'Ask AI for help',
  },
}

export function uiText(locale: string, key: string) {
  return APPLICATION_UI[locale]?.[key] || APPLICATION_UI['en-ZA'][key] || key
}

export function statusLabel(status: StudentApplicationStatus) {
  return APPLICATION_STATUSES.find((s) => s.id === status)?.label || status
}

export const MAX_APPLICATION_FILE_BYTES = 15 * 1024 * 1024

const ALLOWED_APPLICATION_FILE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
const ALLOWED_APPLICATION_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
])

export function validateApplicationFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const supportedType =
    ALLOWED_APPLICATION_FILE_EXTENSIONS.has(extension) &&
    (!file.type || ALLOWED_APPLICATION_MIME_TYPES.has(file.type))

  if (!supportedType) {
    return `${file.name} is not supported. Upload PDF, DOC, DOCX, JPG, or PNG files.`
  }
  if (file.size <= 0) return `${file.name} is empty.`
  if (file.size > MAX_APPLICATION_FILE_BYTES) {
    return `${file.name} is larger than the 15 MB limit.`
  }
  return null
}

export function formatApplicationFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface SavedApplicationDraftSummary {
  applicationType: StudentApplicationType
  applicationNumber?: string
  learnerName?: string
}

export function readSavedApplicationDraftSummary(): SavedApplicationDraftSummary | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as {
      form?: { applicationType?: StudentApplicationType; firstName?: string; surname?: string }
      meta?: { applicationNumber?: string }
    }
    if (!saved.form?.applicationType) return null
    return {
      applicationType: saved.form.applicationType,
      applicationNumber: saved.meta?.applicationNumber,
      learnerName: [saved.form.firstName, saved.form.surname].filter(Boolean).join(' ') || undefined,
    }
  } catch {
    return null
  }
}

/** Rough blur detection for photos (variance of greyscale luminance). */
export async function detectImageBlur(file: File): Promise<boolean> {
  if (!file.type.startsWith('image/')) return false
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const w = Math.min(320, bitmap.width)
    const h = Math.round((bitmap.height / bitmap.width) * w)
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.drawImage(bitmap, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    let sum = 0
    let sumSq = 0
    const n = w * h
    for (let i = 0; i < data.length; i += 4) {
      const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      sum += y
      sumSq += y * y
    }
    const mean = sum / n
    const variance = sumSq / n - mean * mean
    // Low variance often means flat/blurry capture
    return variance < 180
  } catch {
    return false
  }
}

export const DRAFT_STORAGE_KEY = 'leroy_student_application_draft_v1'
