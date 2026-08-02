import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return Boolean(session?.user && session.user.role === 'admin')
}

export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const search = searchParams.get('search')?.trim() || ''

    const where: any = {}

    if (status !== 'all') {
      where.status = status.toUpperCase() as any
    }

    if (type !== 'all') {
      where.type = type.toUpperCase() as any
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      include: {
        careerPath: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Job postings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      company,
      location,
      type = 'FULL_TIME',
      status = 'ACTIVE',
      description,
      requirements,
      salary,
      salaryRange,
      experienceLevel,
      careerPathId,
      expiresAt,
    } = body

    // Validate required fields
    if (!title || !company || !location || !description || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields: title, company, location, description, requirements' },
        { status: 400 }
      )
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        location,
        type: type.toUpperCase() as any,
        status: status.toUpperCase() as any,
        description,
        requirements: Array.isArray(requirements) ? requirements : [requirements],
        salary,
        salaryRange,
        experienceLevel,
        careerPathId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        careerPath: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Job posting creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
