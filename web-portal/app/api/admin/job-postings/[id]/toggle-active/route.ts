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

    const job = await prisma.job.findUnique({
      where: { id },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 })
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE',
      },
    })

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error('Failed to toggle job posting status:', error)
    return NextResponse.json({ error: 'Failed to toggle job posting status' }, { status: 500 })
  }
}
