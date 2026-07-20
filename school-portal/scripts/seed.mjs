#!/usr/bin/env node
/**
 * Seed live Supabase Auth users + school data using the service role key.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    const val = m[2].trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.SEED_PASSWORD || 'Password123!'

if (!url || !serviceKey) {
  console.error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  { email: 'super@schoolportal.za', role: 'super_admin', first: 'Thabo', last: 'Mokoena' },
  { email: 'admin@horizonhigh.edu.za', role: 'school_admin', first: 'Naledi', last: 'Dlamini' },
  { email: 'sipho.nkosi@horizonhigh.edu.za', role: 'teacher', first: 'Sipho', last: 'Nkosi' },
  { email: 'aisha.patel@horizonhigh.edu.za', role: 'teacher', first: 'Aisha', last: 'Patel' },
  { email: 'lindiwe.molefe@email.com', role: 'parent', first: 'Lindiwe', last: 'Molefe' },
  { email: 'johan.vanwyk@email.com', role: 'parent', first: 'Johan', last: 'van Wyk' },
  {
    email: 'kagiso.molefe@student.horizonhigh.edu.za',
    role: 'student',
    first: 'Kagiso',
    last: 'Molefe',
  },
  {
    email: 'emma.vanwyk@student.horizonhigh.edu.za',
    role: 'student',
    first: 'Emma',
    last: 'van Wyk',
  },
  {
    email: 'lebo.maseko@student.horizonhigh.edu.za',
    role: 'student',
    first: 'Lebo',
    last: 'Maseko',
  },
]

async function ensureUser(u) {
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = listed?.users?.find((x) => x.email === u.email)
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role: u.role, first_name: u.first, last_name: u.last },
    })
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password,
    email_confirm: true,
    user_metadata: { role: u.role, first_name: u.first, last_name: u.last },
  })
  if (error) throw error
  return data.user.id
}

async function main() {
  // School
  let schoolId
  const { data: schools } = await admin.from('schools').select('id').eq('name', 'Horizon High School').limit(1)
  if (schools?.[0]) {
    schoolId = schools[0].id
  } else {
    const { data, error } = await admin
      .from('schools')
      .insert({
        name: 'Horizon High School',
        emis_number: '700123456',
        address: '12 Freedom Drive, Johannesburg, Gauteng, 2001',
        phone: '0115550100',
        email: 'admin@horizonhigh.edu.za',
      })
      .select('id')
      .single()
    if (error) throw error
    schoolId = data.id
  }
  console.log('School:', schoolId)

  const ids = {}
  for (const u of USERS) {
    const id = await ensureUser(u)
    ids[u.email] = id
    await admin.from('profiles').upsert({
      id,
      school_id: schoolId,
      role: u.role,
      first_name: u.first,
      last_name: u.last,
      email: u.email,
      is_active: true,
      email_verified: true,
    })
    console.log('✓ user', u.email)
  }

  // Grades
  for (const n of [8, 9, 10, 11, 12]) {
    await admin.from('grades').upsert(
      { school_id: schoolId, grade_number: n, name: `Grade ${n}` },
      { onConflict: 'school_id,grade_number' },
    )
  }
  const { data: grades } = await admin.from('grades').select('*').eq('school_id', schoolId)
  const grade10 = grades.find((g) => g.grade_number === 10)
  const grade11 = grades.find((g) => g.grade_number === 11)

  // Classes
  async function ensureClass(name, gradeId, teacherEmail) {
    const { data: existing } = await admin.from('classes').select('*').eq('school_id', schoolId).eq('name', name)
    if (existing?.[0]) return existing[0]
    const { data, error } = await admin
      .from('classes')
      .insert({
        school_id: schoolId,
        grade_id: gradeId,
        name,
        room: name.startsWith('10') ? 'B12' : 'C01',
        class_teacher_id: ids[teacherEmail],
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  const class10a = await ensureClass('10A', grade10.id, 'sipho.nkosi@horizonhigh.edu.za')
  const class11a = await ensureClass('11A', grade11.id, 'sipho.nkosi@horizonhigh.edu.za')

  // Subjects
  const subjectDefs = [
    ['ENGHL', 'English Home Language'],
    ['MATH', 'Mathematics'],
    ['PHYS', 'Physical Sciences'],
    ['LO', 'Life Orientation'],
  ]
  const subjectIds = {}
  for (const [code, name] of subjectDefs) {
    const { data: ex } = await admin.from('subjects').select('*').eq('school_id', schoolId).eq('code', code)
    if (ex?.[0]) subjectIds[code] = ex[0].id
    else {
      const { data, error } = await admin
        .from('subjects')
        .insert({ school_id: schoolId, code, name })
        .select('*')
        .single()
      if (error) throw error
      subjectIds[code] = data.id
    }
  }

  // Teachers / students / parents rows
  async function ensureTeacher(email, emp, dept) {
    const profileId = ids[email]
    const { data: ex } = await admin.from('teachers').select('*').eq('profile_id', profileId)
    if (ex?.[0]) return ex[0]
    const { data, error } = await admin
      .from('teachers')
      .insert({ profile_id: profileId, school_id: schoolId, employee_number: emp, department: dept })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  await ensureTeacher('sipho.nkosi@horizonhigh.edu.za', 'T001', 'Sciences')
  await ensureTeacher('aisha.patel@horizonhigh.edu.za', 'T002', 'Languages')

  async function ensureStudent(email, number, classRow, gradeId) {
    const profileId = ids[email]
    const { data: ex } = await admin.from('students').select('*').eq('profile_id', profileId)
    if (ex?.[0]) return ex[0]
    const { data, error } = await admin
      .from('students')
      .insert({
        profile_id: profileId,
        school_id: schoolId,
        student_number: number,
        class_id: classRow.id,
        grade_id: gradeId,
        admission_date: '2024-01-15',
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  const stu1 = await ensureStudent(
    'kagiso.molefe@student.horizonhigh.edu.za',
    'HHS2024001',
    class10a,
    grade10.id,
  )
  const stu2 = await ensureStudent(
    'emma.vanwyk@student.horizonhigh.edu.za',
    'HHS2024002',
    class11a,
    grade11.id,
  )
  await ensureStudent('lebo.maseko@student.horizonhigh.edu.za', 'HHS2024003', class10a, grade10.id)

  async function ensureParent(email, studentId) {
    const profileId = ids[email]
    let parent
    const { data: ex } = await admin.from('parents').select('*').eq('profile_id', profileId)
    if (ex?.[0]) parent = ex[0]
    else {
      const { data, error } = await admin
        .from('parents')
        .insert({ profile_id: profileId, school_id: schoolId })
        .select('*')
        .single()
      if (error) throw error
      parent = data
    }
    await admin.from('parent_students').upsert(
      { parent_id: parent.id, student_id: studentId, is_primary: true },
      { onConflict: 'parent_id,student_id' },
    )
  }
  await ensureParent('lindiwe.molefe@email.com', stu1.id)
  await ensureParent('johan.vanwyk@email.com', stu2.id)

  // Class subjects
  const assignments = [
    [class10a.id, subjectIds.MATH, ids['sipho.nkosi@horizonhigh.edu.za']],
    [class10a.id, subjectIds.PHYS, ids['sipho.nkosi@horizonhigh.edu.za']],
    [class10a.id, subjectIds.ENGHL, ids['aisha.patel@horizonhigh.edu.za']],
    [class10a.id, subjectIds.LO, ids['aisha.patel@horizonhigh.edu.za']],
    [class11a.id, subjectIds.MATH, ids['sipho.nkosi@horizonhigh.edu.za']],
  ]
  for (const [classId, subjectId, teacherId] of assignments) {
    await admin.from('class_subjects').upsert(
      { class_id: classId, subject_id: subjectId, teacher_id: teacherId },
      { onConflict: 'class_id,subject_id' },
    )
  }

  // Announcement
  await admin.from('announcements').insert({
    school_id: schoolId,
    title: 'Welcome to Term 2',
    body: 'Learners must wear full winter uniform from Monday. Parent evenings will be announced soon.',
    audience: ['all'],
    pinned: true,
    created_by: ids['admin@horizonhigh.edu.za'],
  })

  console.log('\n✅ Seed complete. Default password for all users:', password)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
