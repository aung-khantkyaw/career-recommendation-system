import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const career = await prisma.careerPath.findUnique({
      where: { id },
    })

    if (!career) {
      return NextResponse.json({ error: 'Career path not found' }, { status: 404 })
    }

    const updatedCareer = await prisma.careerPath.update({
      where: { id },
      data: {
        active: !career.active,
      },
    })

    return NextResponse.json({ career: updatedCareer })
  } catch (error) {
    console.error('Failed to toggle career active status:', error)
    return NextResponse.json({ error: 'Failed to toggle career active status' }, { status: 500 })
  }
}
