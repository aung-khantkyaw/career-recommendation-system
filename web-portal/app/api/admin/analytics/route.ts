import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get user metrics
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: daysAgo } } }),
    ])

    // Get resume metrics
    const [totalResumes, processedResumes, pendingResumes, failedResumes] = await Promise.all([
      prisma.resume.count(),
      prisma.resume.count({ where: { processingStatus: 'COMPLETED' } }),
      prisma.resume.count({ where: { processingStatus: 'PENDING' } }),
      prisma.resume.count({ where: { processingStatus: 'FAILED' } }),
    ])

    // Get job metrics
    const [totalJobs, activeJobs, newJobs] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
      prisma.job.count({ where: { createdAt: { gte: daysAgo } } }),
    ])

    // Get career path metrics
    const [totalCareerPaths, activeCareerPaths] = await Promise.all([
      prisma.careerPath.count(),
      prisma.careerPath.count({ where: { active: true } }),
    ])

    // Get bookmark metrics
    const totalBookmarks = await prisma.jobBookmark.count()

    // Get recommendation metrics
    const totalRecommendations = await prisma.careerRecommendation.count()

    // Get activity metrics
    const totalActivityLogs = await prisma.activityLog.count({
      where: { createdAt: { gte: daysAgo } }
    })

    // Get job performance by career path
    const jobPerformanceByCareer = await prisma.job.groupBy({
      by: ['careerPathId'],
      _count: { id: true },
      where: { status: 'ACTIVE' },
    })

    const careerPathIds = jobPerformanceByCareer.map(j => j.careerPathId).filter(Boolean) as string[]

    const careerPaths = await prisma.careerPath.findMany({
      where: { id: { in: careerPathIds } },
      select: { id: true, title: true, category: true }
    })

    const jobPerformance = jobPerformanceByCareer.map(j => {
      const career = careerPaths.find(c => c.id === j.careerPathId)
      return {
        careerPath: career?.title || 'Uncategorized',
        category: career?.category || 'Other',
        jobCount: j._count.id,
      }
    }).sort((a, b) => b.jobCount - a.jobCount)

    // Get daily user registrations for the period
    const dailyRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: daysAgo } },
      orderBy: { createdAt: 'asc' },
    })

    // Get daily resume uploads for the period
    const dailyResumeUploads = await prisma.resume.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: daysAgo } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          inactive: totalUsers - activeUsers,
        },
        resumes: {
          total: totalResumes,
          processed: processedResumes,
          pending: pendingResumes,
          failed: failedResumes,
          processingRate: totalResumes > 0 ? ((processedResumes / totalResumes) * 100).toFixed(1) : '0',
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          new: newJobs,
          inactive: totalJobs - activeJobs,
        },
        careerPaths: {
          total: totalCareerPaths,
          active: activeCareerPaths,
          inactive: totalCareerPaths - activeCareerPaths,
        },
        engagement: {
          totalBookmarks,
          totalRecommendations,
          activityLogs: totalActivityLogs,
        },
      },
      jobPerformance,
      trends: {
        dailyRegistrations: dailyRegistrations.map(d => ({
          date: new Date(d.createdAt).toISOString().split('T')[0],
          count: d._count.id,
        })),
        dailyResumeUploads: dailyResumeUploads.map(d => ({
          date: new Date(d.createdAt).toISOString().split('T')[0],
          count: d._count.id,
        })),
      },
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
