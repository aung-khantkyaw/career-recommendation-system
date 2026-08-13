import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import redis from '@/lib/redis'

async function requireAdmin() {
  const session = await auth()
  return Boolean(session?.user && session.user.role === 'admin')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
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

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      title,
      company,
      location,
      type,
      status,
      description,
      requirements,
      salary,
      salaryRange,
      experienceLevel,
      phoneNumbers,
      emails,
      careerPathId,
      expiresAt,
    } = body

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(company && { company }),
        ...(location && { location }),
        ...(type && { type: type.toUpperCase() as any }),
        ...(status && { status: status.toUpperCase() as any }),
        ...(description && { description }),
        ...(requirements && { requirements: Array.isArray(requirements) ? requirements : [requirements] }),
        ...(salary !== undefined && { salary }),
        ...(salaryRange !== undefined && { salaryRange }),
        ...(experienceLevel !== undefined && { experienceLevel }),
        ...(phoneNumbers !== undefined && { phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [] }),
        ...(emails !== undefined && { emails: Array.isArray(emails) ? emails : [] }),
        ...(careerPathId !== undefined && { careerPathId }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      include: {
        embedding: true,
        careerPath: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    // Check if embedding regeneration is needed
    let shouldRegenerate = false

    if (description || requirements) {
      // Content changed, check if model matches
      if (job.embedding) {
        const activeApiKey = await prisma.apiKey.findFirst({
          where: { active: true },
        })

        if (!activeApiKey || activeApiKey.embeddingModelName !== job.embedding.model) {
          shouldRegenerate = true
        }
      } else {
        // No existing embedding, need to generate
        shouldRegenerate = true
      }
    }

    // Queue embedding regeneration job only if needed
    if (shouldRegenerate) {
      await redis.lPush('ai_jobs_queue', JSON.stringify({
        job_id: `job_${job.id}`,
        job_type: 'job_embedding',
        job_id_field: job.id,
      }))
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.job.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('Job deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
