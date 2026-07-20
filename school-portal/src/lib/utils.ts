import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fullName(first: string, last: string) {
  return `${first} ${last}`.trim()
}

export function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

export function percentageColor(pct: number) {
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

export function roleLabel(role: string) {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function validateSaId(id: string) {
  const clean = id.replace(/\s/g, '')
  if (!/^\d{13}$/.test(clean)) return false
  // Luhn check for SA ID
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let d = Number(clean[i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

export function gradeFromDob(dob: string): number | null {
  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  )
  if (age < 13 || age > 20) return null
  return Math.min(12, Math.max(8, age - 6))
}
