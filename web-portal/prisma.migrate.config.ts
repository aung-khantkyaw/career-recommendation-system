import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Supabase session-mode pooler: use this config only for Prisma migrations.
config({ path: '.env.local' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DIRECT_URL') },
})
