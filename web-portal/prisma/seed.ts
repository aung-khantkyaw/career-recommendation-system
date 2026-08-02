import { config } from 'dotenv'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@career-system.com' },
    update: {},
    create: {
      email: 'admin@career-system.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  })
  console.log(`✅ Created admin user: ${admin.email}`)

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@career-system.com' },
    update: {},
    create: {
      email: 'user@career-system.com',
      password: userPassword,
      name: 'John Doe',
      role: 'USER',
    },
  })
  console.log(`✅ Created regular user: ${user.email}`)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
