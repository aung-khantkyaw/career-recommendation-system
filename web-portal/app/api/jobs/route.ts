import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'
    const type = searchParams.get('type') || 'all'
    const search = searchParams.get('search')?.trim() || ''
    const careerPathId = searchParams.get('careerPathId')

    const where: any = {}

    if (status !== 'all') {
      where.status = status.toUpperCase() as any
    }

    if (type !== 'all') {
      where.type = type.toUpperCase() as any
    }

    if (careerPathId) {
      where.careerPathId = careerPathId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
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
            requiredSkills: true,
          },
        },
      },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
