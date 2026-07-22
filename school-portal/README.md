# School Portal

Production-ready Progressive Web App for South African High Schools (Grades 8–12).

## Stack

- **Frontend:** React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn-style UI
- **Backend:** Supabase (Auth · PostgreSQL · Storage · Realtime) with full SQL migrations + RLS
- **PWA:** Offline caching, installable on Android, push notification hooks
- **Demo mode:** Fully functional without Supabase credentials (`VITE_DEMO_MODE=true`)

## Quick start

```bash
cd school-portal
npm install
npm run dev
```

Open http://localhost:5173

### Demo accounts (password: `Password123!`)

| Role | Email |
|------|-------|
| Super Admin | super@schoolportal.za |
| School Admin | admin@horizonhigh.edu.za |
| Teacher | sipho.nkosi@horizonhigh.edu.za |
| Parent | lindiwe.molefe@email.com |
| Student | kagiso.molefe@student.horizonhigh.edu.za |

## Connect Supabase

1. Create a Supabase project.
2. Run migrations in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
3. Create storage buckets: `admissions-docs`, `learning-materials`, `avatars`, `report-cards`.
4. Copy `.env.example` → `.env` and set:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_DEMO_MODE=false
VITE_SCHOOL_NAME=Your School Name
```

## Features

- Role dashboards: Super Admin, School Admin, Teacher, Parent, Student
- Auth: login, forgot password, email verification, remember me, change password, profile
- Admissions with document uploads and status workflow
- Marks with simulated RLS (students/parents/teachers/admins scoped correctly)
- Attendance with instant parent notifications
- Timetable filters (class / grade / teacher / subject)
- Parent community forum (post, comment, like, search, report)
- Announcements, calendar, audit logs, report card download
- Dark / light mode, mobile-first UI, PWA install

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run preview  # preview production build
```

## Security notes

- PostgreSQL RLS policies enforce mark/attendance visibility in production Supabase.
- Demo API mirrors the same authorization rules in the browser for local development.
- POPIA principles: minimize PII display, audit logging, encrypted ID column reserved in schema.
