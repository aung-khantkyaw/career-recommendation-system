import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import redis from '@/lib/redis'

type CareerPayload = {
  title?: string
  category?: string
  description?: string
  requiredSkills?: string[] | string
  softSkills?: string[] | string
  roadmap?: unknown
  averageSalary?: string
  jobOpenings?: number | string
  growthRate?: number | string
  active?: boolean
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return Boolean(session?.user && session.user.role === 'admin')
}

function toStringArray(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function toNumber(value: number | string | undefined, fallback = 0) {
  if (value === undefined || value === '') return fallback

  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function validateCareerPayload(body: CareerPayload) {
  const title = body.title?.trim()
  const category = body.category?.trim()
  const description = body.description?.trim()
  const averageSalary = body.averageSalary?.trim()
  const requiredSkills = toStringArray(body.requiredSkills)
  const softSkills = toStringArray(body.softSkills)

  if (!title || !category || !description || !averageSalary) {
    return {
      error: 'Title, category, description, and average salary are required',
    }
  }

  if (!requiredSkills.length) {
    return { error: 'At least one required skill is required' }
  }

  return {
    data: {
      title,
      category,
      description,
      requiredSkills,
      softSkills,
      roadmap: body.roadmap as any,
      averageSalary,
      jobOpenings: Math.max(0, Math.round(toNumber(body.jobOpenings))),
      growthRate: toNumber(body.growthRate),
      active: body.active ?? true,
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status') || 'all'

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { category: { contains: search, mode: 'insensitive' as const } },
              {
                description: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(status === 'active'
        ? { active: true }
        : status === 'inactive'
          ? { active: false }
          : {}),
    }

    const [careers, total, active, inactive, aggregate] = await Promise.all([
      prisma.careerPath.findMany({
        where,
        orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
      }),
      prisma.careerPath.count(),
      prisma.careerPath.count({ where: { active: true } }),
      prisma.careerPath.count({ where: { active: false } }),
      prisma.careerPath.aggregate({
        _sum: { jobOpenings: true },
        _avg: { growthRate: true },
      }),
    ])

    return NextResponse.json({
      careers,
      stats: {
        total,
        active,
        inactive,
        totalJobs: aggregate._sum.jobOpenings || 0,
        avgGrowth: `${Math.round(aggregate._avg.growthRate || 0)}%`,
      },
    })
  } catch (error) {
    console.error('Careers fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as CareerPayload
    const result = validateCareerPayload(body)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const career = await prisma.careerPath.create({
      data: result.data,
    })

    // Queue embedding generation job
    await redis.lPush('ai_jobs_queue', JSON.stringify({
      job_id: `career_${career.id}`,
      job_type: 'career_embedding',
      career_path_id: career.id,
    }))

    return NextResponse.json(
      { message: 'Career path created successfully', career },
      { status: 201 }
    )
  } catch (error) {
    console.error('Career creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Career path ID is required' }, { status: 400 })
    }

    const body = (await req.json()) as CareerPayload
    const result = validateCareerPayload(body)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const career = await prisma.careerPath.update({
      where: { id },
      data: result.data,
    })

    // Queue embedding regeneration job
    await redis.lPush('ai_jobs_queue', JSON.stringify({
      job_id: `career_${career.id}`,
      job_type: 'career_embedding',
      career_path_id: career.id,
    }))

    return NextResponse.json(
      { message: 'Career path updated successfully', career },
      { status: 200 }
    )
  } catch (error) {
    console.error('Career update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Career path ID is required' }, { status: 400 })
    }

    await prisma.careerPath.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Career path deleted successfully' })
  } catch (error) {
    console.error('Career deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
