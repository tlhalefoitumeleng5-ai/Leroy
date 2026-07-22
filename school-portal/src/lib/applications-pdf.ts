import { jsPDF } from 'jspdf'
import { APPLICATION_DOC_TYPES, statusLabel } from '@/lib/applications'
import type { ApplicationDocument, StudentApplication } from '@/types'

function value(input: string | undefined) {
  return input?.trim() || '—'
}

export function buildApplicationPdf(app: StudentApplication, documents: ApplicationDocument[] = []) {
  const pdf = new jsPDF()
  const left = 16
  const width = 178
  let y = 18

  const ensureSpace = (height = 12) => {
    if (y + height <= 282) return
    pdf.addPage()
    y = 18
  }

  const heading = (text: string) => {
    ensureSpace(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(3, 105, 161)
    pdf.text(text, left, y)
    y += 8
  }

  const line = (label: string, text: string | undefined) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(30, 41, 59)
    const rows = pdf.splitTextToSize(`${label}: ${value(text)}`, width) as string[]
    ensureSpace(rows.length * 5 + 3)
    pdf.text(rows, left, y)
    y += rows.length * 5 + 3
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(15, 23, 42)
  pdf.text('Student Application', left, y)
  y += 9
  pdf.setFontSize(11)
  pdf.setTextColor(3, 105, 161)
  pdf.text(`${app.applicationNumber} · ${statusLabel(app.status)}`, left, y)
  y += 11

  heading('Application')
  line('Type', app.applicationType === 'new_student' ? 'New Student Application' : 'Returning Student Application')
  line('Application number', app.applicationNumber)
  line('Status', statusLabel(app.status))
  line('Submitted', app.submittedAt ? new Date(app.submittedAt).toLocaleString('en-ZA') : undefined)

  heading('Personal Information')
  line('First name', app.firstName)
  line('Middle name', app.middleName)
  line('Surname', app.surname)
  line('Date of birth', app.dateOfBirth)
  line('Gender', app.gender)
  line('SA ID or passport', app.idOrPassport)
  line('Nationality', app.nationality)
  line('Home language', app.homeLanguage)
  line('Grade applying for', app.gradeApplyingFor)
  line('Current grade', app.currentGrade)
  line('Previous school', app.previousSchool)
  line('Residential address', app.residentialAddress)

  heading('Parent / Guardian')
  line('Full name', app.parentFullName)
  line('Relationship', app.parentRelationship)
  line('ID number', app.parentIdNumber)
  line('Phone number', app.parentPhone)
  line('WhatsApp number', app.parentWhatsapp)
  line('Email address', app.parentEmail)
  line('Occupation', app.parentOccupation)
  line('Residential address', app.parentResidentialAddress)
  line('Emergency contact', app.emergencyContact)

  heading('Medical Information')
  line('Medical aid', app.medicalAid)
  line('Medical conditions', app.medicalConditions)
  line('Allergies', app.allergies)
  line('Doctor name', app.doctorName)
  line('Doctor phone number', app.doctorContact)

  heading(`Documents (${documents.length})`)
  if (documents.length === 0) {
    line('Uploaded files', undefined)
  } else {
    for (const document of documents) {
      const label = APPLICATION_DOC_TYPES.find((item) => item.id === document.docType)?.label || document.docType
      line(label, document.fileName)
    }
  }

  ensureSpace(18)
  y += 4
  pdf.setDrawColor(203, 213, 225)
  pdf.line(left, y, left + width, y)
  y += 7
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text('Generated securely from the School Portal.', left, y)

  return pdf
}

export function downloadApplicationPdf(app: StudentApplication, documents: ApplicationDocument[] = []) {
  buildApplicationPdf(app, documents).save(`${app.applicationNumber}.pdf`)
}
