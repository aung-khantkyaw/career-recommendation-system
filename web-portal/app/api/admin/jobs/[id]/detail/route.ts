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

    const { id: jobId } = await params

    // Extract partial resume ID from job ID (JOB-{first 8 chars of resume id})
    const partialResumeId = jobId.replace('JOB-', '')

    const resume = await prisma.resume.findFirst({
      where: { id: { startsWith: partialResumeId } },
      include: {
        recommendations: {
          orderBy: { matchScore: 'desc' },
          take: 5
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      job: {
        id: jobId,
        resumeId: resume.id,
        user: resume.user,
        fileName: resume.originalName,
        processingStatus: resume.processingStatus,
        skills: resume.skills,
        experience: resume.experience,
        education: resume.education,
        recommendations: resume.recommendations,
        createdAt: resume.createdAt,
        processedAt: resume.processedAt
      }
    })
  } catch (error) {
    console.error('Job detail fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
