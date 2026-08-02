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
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category') || 'all'
    const matchScore = searchParams.get('matchScore') || 'all'

    const where: any = {}

    if (search) {
      where.OR = [
        { jobTitle: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
        { resume: { user: { email: { contains: search, mode: 'insensitive' as const } } } },
      ]
    }

    if (category !== 'all') {
      where.category = { contains: category, mode: 'insensitive' as const }
    }

    if (matchScore === 'high') {
      where.matchScore = { gte: 80 }
    } else if (matchScore === 'medium') {
      where.matchScore = { gte: 60, lt: 80 }
    } else if (matchScore === 'low') {
      where.matchScore = { lt: 60 }
    }

    const [recommendations, total, avgMatchScore] = await Promise.all([
      prisma.careerRecommendation.findMany({
        where,
        orderBy: { matchScore: 'desc' },
        take: 100,
        select: {
          id: true,
          jobTitle: true,
          category: true,
          matchScore: true,
          createdAt: true,
          resume: {
            select: {
              id: true,
              originalName: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.careerRecommendation.count({ where }),
      prisma.careerRecommendation.aggregate({
        _avg: { matchScore: true },
      }),
    ])

    const highMatch = await prisma.careerRecommendation.count({
      where: { ...where, matchScore: { gte: 80 } },
    })
    const mediumMatch = await prisma.careerRecommendation.count({
      where: { ...where, matchScore: { gte: 60, lt: 80 } },
    })
    const lowMatch = await prisma.careerRecommendation.count({
      where: { ...where, matchScore: { lt: 60 } },
    })

    const stats = {
      total,
      highMatch,
      mediumMatch,
      lowMatch,
      avgMatchScore: Math.round(avgMatchScore._avg.matchScore || 0),
    }

    return NextResponse.json({
      recommendations,
      stats,
    })
  } catch (error) {
    console.error('Recommendations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
