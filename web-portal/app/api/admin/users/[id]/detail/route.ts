import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: userId } = await params

    // Fetch user with avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { resumes: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch top career recommendation for the user
    const topRecommendation = await prisma.careerRecommendation.findFirst({
      where: {
        resume: {
          userId: userId
        }
      },
      orderBy: {
        matchScore: 'desc'
      },
      select: {
        careerPath: true,
        category: true,
        matchScore: true,
        skillsMatched: true
      }
    })

    return NextResponse.json({
      user: {
        ...user,
        topRecommendation: topRecommendation || null
      }
    })
  } catch (error) {
    console.error('User detail fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
