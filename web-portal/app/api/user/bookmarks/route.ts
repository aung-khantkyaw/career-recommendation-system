import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookmarks = await prisma.jobBookmark.findMany({
      where: { userId: session.user.id },
      include: {
        job: {
          include: {
            careerPath: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error('Bookmarks fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.jobBookmark.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId
        }
      }
    })

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Job already bookmarked' },
        { status: 400 }
      )
    }

    const bookmark = await prisma.jobBookmark.create({
      data: {
        userId: session.user.id,
        jobId
      },
      include: {
        job: true
      }
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error) {
    console.error('Bookmark create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
