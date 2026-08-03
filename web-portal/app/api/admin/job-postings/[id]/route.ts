import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return Boolean(session?.user && session.user.role === 'admin')
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      where: { id: params.id },
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
        careerPath: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.job.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('Job deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
