import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { headers } from 'next/headers'

async function createAuditLog(adminId: string, action: string, entityType?: string, entityId?: string, metadata?: any) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

type CareerPayload = {
  title?: string
  category?: string
  description?: string
  requiredSkills?: string[] | string
  softSkills?: string[] | string
  roadmap?: Prisma.InputJsonValue
  averageSalary?: string
  active?: boolean
}

async function requireAdmin() {
  const session = await auth()
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
      roadmap: body.roadmap,
      averageSalary,
      active: body.active ?? true,
    },
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const career = await prisma.careerPath.findUnique({
      where: { id },
    })

    if (!career) {
      return NextResponse.json({ error: 'Career path not found' }, { status: 404 })
    }

    return NextResponse.json({ career })
  } catch (error) {
    console.error('Career fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await req.json()) as CareerPayload
    const result = validateCareerPayload(body)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const career = await prisma.careerPath.update({
      where: { id },
      data: result.data,
    })

    // Create UPDATE_CAREER_PATH audit log
    await createAuditLog(session.user.id, 'UPDATE_CAREER_PATH', 'CAREER_PATH', id, {
      title: career.title,
      category: career.category,
      updatedFields: Object.keys(body),
    })

    return NextResponse.json({
      message: 'Career path updated successfully',
      career,
    })
  } catch (error) {
    console.error('Career update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.careerPath.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Career path deleted successfully',
    })
  } catch (error) {
    console.error('Career deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
