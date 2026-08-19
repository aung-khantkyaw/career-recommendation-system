import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addJobToQueue } from '@/lib/redis'

export async function POST(
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
      where: { id: { startsWith: partialResumeId } }
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Reset resume to pending status for reprocessing
    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        processingStatus: 'PENDING',
        processedAt: null,
        skills: [],
        experience: [],
        education: []
      }
    })

    // Delete existing recommendations for this resume
    await prisma.careerRecommendation.deleteMany({
      where: { resumeId: resume.id }
    })

    // Add job to Redis queue for AI processing
    await addJobToQueue(resume.id, resume.minioPath, resume.userId)

    return NextResponse.json({ message: 'Job restarted successfully' })
  } catch (error) {
    console.error('Job retry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
