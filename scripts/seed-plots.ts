import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run with: node --env-file=.env.local --experimental-strip-types scripts/seed-plots.ts')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedPath = path.join(__dirname, '../data/projects/august-township/plots-seed.json')

const plots: Record<string, unknown>[] = JSON.parse(readFileSync(seedPath, 'utf-8'))

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const records = plots.map((p) => ({
  ...p,
  project_slug: 'august-township',
}))

const { data, error } = await supabase
  .from('plots')
  .upsert(records, { onConflict: 'project_slug,plot_number' })
  .select('id')

if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}

console.log(`Seeded ${(data as unknown[]).length} plots for august-township`)
