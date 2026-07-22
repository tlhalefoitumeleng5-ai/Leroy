import { useEffect, useState } from 'react'
import { api } from '@/services/api'

/** Re-render when live API cache refreshes (marks, attendance, etc.). */
export function useApiRefresh() {
  const [, setTick] = useState(0)
  useEffect(() => api.subscribe(() => setTick((t) => t + 1)), [])
}

export function capsLevel(percentage: number): { level: number; label: string; color: string } {
  if (percentage >= 80) return { level: 7, label: 'Outstanding', color: 'text-emerald-600' }
  if (percentage >= 70) return { level: 6, label: 'Meritorious', color: 'text-emerald-600' }
  if (percentage >= 60) return { level: 5, label: 'Substantial', color: 'text-sky-600' }
  if (percentage >= 50) return { level: 4, label: 'Adequate', color: 'text-amber-600' }
  if (percentage >= 40) return { level: 3, label: 'Moderate', color: 'text-amber-600' }
  if (percentage >= 30) return { level: 2, label: 'Elementary', color: 'text-orange-600' }
  return { level: 1, label: 'Not achieved', color: 'text-rose-600' }
}

const SUBJECT_COLORS = [
  'bg-sky-500/15 text-sky-800 border-sky-300 dark:text-sky-200',
  'bg-emerald-500/15 text-emerald-800 border-emerald-300 dark:text-emerald-200',
  'bg-amber-500/15 text-amber-900 border-amber-300 dark:text-amber-200',
  'bg-rose-500/15 text-rose-800 border-rose-300 dark:text-rose-200',
  'bg-indigo-500/15 text-indigo-800 border-indigo-300 dark:text-indigo-200',
  'bg-teal-500/15 text-teal-800 border-teal-300 dark:text-teal-200',
  'bg-fuchsia-500/15 text-fuchsia-800 border-fuchsia-300 dark:text-fuchsia-200',
  'bg-orange-500/15 text-orange-900 border-orange-300 dark:text-orange-200',
]

export function subjectColor(subjectId: string) {
  let hash = 0
  for (let i = 0; i < subjectId.length; i++) hash = (hash + subjectId.charCodeAt(i) * (i + 1)) % SUBJECT_COLORS.length
  return SUBJECT_COLORS[hash]
}

export function attendanceStats(rows: { status: string; date: string }[]) {
  const present = rows.filter((r) => r.status === 'present').length
  const late = rows.filter((r) => r.status === 'late').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const total = rows.length
  const percentage = total === 0 ? 0 : Math.round(((present + late * 0.5) / total) * 100)
  const byMonth = new Map<string, { present: number; late: number; absent: number; total: number }>()
  for (const r of rows) {
    const key = r.date.slice(0, 7)
    const bucket = byMonth.get(key) ?? { present: 0, late: 0, absent: 0, total: 0 }
    bucket.total += 1
    if (r.status === 'present') bucket.present += 1
    else if (r.status === 'late') bucket.late += 1
    else bucket.absent += 1
    byMonth.set(key, bucket)
  }
  return { present, late, absent, total, percentage, byMonth }
}

export function formatClock(date = new Date()) {
  return date.toLocaleString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
