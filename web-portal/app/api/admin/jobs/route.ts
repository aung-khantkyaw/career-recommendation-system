import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'

    const where = status !== 'all' ? { processingStatus: status.toUpperCase() as any } : undefined

    const resumes = await prisma.resume.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Fetch users separately to avoid type issues
    const userIds = resumes.map(r => r.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const jobs = resumes.map(resume => {
      const user = userMap.get(resume.userId)
      return {
        id: `JOB-${resume.id.slice(0, 8)}`,
        resumeId: resume.id,
        user: user?.name || user?.email || 'Unknown',
        userId: resume.userId,
        type: 'Resume Analysis',
        status: resume.processingStatus.toLowerCase(),
        progress: resume.processingStatus === 'COMPLETED' ? 100 : 
                 resume.processingStatus === 'PROCESSING' ? 65 : 
                 resume.processingStatus === 'FAILED' ? 45 : 0,
        createdAt: resume.createdAt,
        completedAt: resume.processedAt,
        duration: resume.processedAt ? 
          `${Math.floor((resume.processedAt.getTime() - resume.createdAt.getTime()) / 60000)}m` : 
          null
      }
    })

    const stats = {
      total: resumes.length,
      pending: resumes.filter(r => r.processingStatus === 'PENDING').length,
      processing: resumes.filter(r => r.processingStatus === 'PROCESSING').length,
      completed: resumes.filter(r => r.processingStatus === 'COMPLETED').length,
      failed: resumes.filter(r => r.processingStatus === 'FAILED').length,
    }

    return NextResponse.json({ jobs, stats })
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
