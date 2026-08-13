import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resumeId = params.id

    // Verify the resume belongs to the user
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        recommendations: {
          orderBy: { matchScore: 'desc' }
        }
      }
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Extract skills from the resume if available
    const skills = resume.skills ? JSON.parse(resume.skills as string) : { all: [], technical: [], soft: [] }

    return NextResponse.json({
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        originalName: resume.originalName,
        processingStatus: resume.processingStatus,
        skills,
      },
      recommendations: resume.recommendations
    })
  } catch (error) {
    console.error('Recommendations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
