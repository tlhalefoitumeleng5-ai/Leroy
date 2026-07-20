#!/usr/bin/env node
/**
 * Apply SQL migrations to a live Supabase project.
 *
 * Required env (in school-portal/.env or process env):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DB_PASSWORD   (database password)
 * Optional:
 *   SUPABASE_ACCESS_TOKEN  (Management API — preferred for SQL)
 *   SUPABASE_DB_HOST       (override pooler host)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

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

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dbPassword = process.env.SUPABASE_DB_PASSWORD
const accessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!url) {
  console.error('❌ Missing VITE_SUPABASE_URL')
  process.exit(1)
}

const projectRef = new URL(url).hostname.split('.')[0]
const migrationsDir = resolve(root, 'supabase/migrations')
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

async function runViaManagementApi(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Management API ${res.status}: ${text}`)
  }
  return res.json()
}

async function runViaPostgres(sql) {
  if (!dbPassword) throw new Error('SUPABASE_DB_PASSWORD required for direct Postgres')
  const host =
    process.env.SUPABASE_DB_HOST ||
    `db.${projectRef}.supabase.co`
  const client = new pg.Client({
    host,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    await client.query(sql)
  } finally {
    await client.end()
  }
}

async function main() {
  console.log(`📦 Project: ${projectRef}`)
  console.log(`📄 Migrations: ${files.join(', ')}`)

  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), 'utf8')
    console.log(`\n→ Applying ${file}…`)
    try {
      if (accessToken) {
        await runViaManagementApi(sql)
      } else {
        await runViaPostgres(sql)
      }
      console.log(`✓ ${file}`)
    } catch (err) {
      console.error(`✗ ${file}:`, err instanceof Error ? err.message : err)
      process.exit(1)
    }
  }

  if (serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    // Ensure storage buckets
    for (const bucket of ['admissions-docs', 'learning-materials', 'avatars', 'report-cards']) {
      const { data: existing } = await admin.storage.getBucket(bucket)
      if (!existing) {
        const { error } = await admin.storage.createBucket(bucket, {
          public: bucket === 'learning-materials' || bucket === 'avatars',
        })
        if (error && !error.message.includes('already')) {
          console.warn(`Bucket ${bucket}:`, error.message)
        } else {
          console.log(`✓ bucket ${bucket}`)
        }
      } else {
        console.log(`· bucket ${bucket} exists`)
      }
    }
  }

  console.log('\n✅ Migrations complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
