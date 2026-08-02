import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's resumes with recommendations
    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      include: {
        recommendations: {
          orderBy: { matchScore: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get the most recent completed resume with recommendations
    const latestCompletedResume = resumes.find(r => r.processingStatus === 'COMPLETED')

    let skills = { all: [], technical: [], soft: [] }
    let recommendations = []

    if (latestCompletedResume && latestCompletedResume.skills) {
      skills = JSON.parse(latestCompletedResume.skills as string)
      recommendations = latestCompletedResume.recommendations
    }

    // Calculate stats
    const stats = {
      totalResumes: resumes.length,
      completedResumes: resumes.filter(r => r.processingStatus === 'COMPLETED').length,
      processingResumes: resumes.filter(r => r.processingStatus === 'PROCESSING').length,
      totalSkills: skills.all?.length || 0,
    }

    return NextResponse.json({
      stats,
      skills,
      recommendations,
      recentResumes: resumes.slice(0, 5).map(r => ({
        id: r.id,
        fileName: r.originalName,
        processingStatus: r.processingStatus,
        createdAt: r.createdAt,
      }))
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
