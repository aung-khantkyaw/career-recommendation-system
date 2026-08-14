import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
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
    const includeJobs = searchParams.get('includeJobs') === 'true'

    const where: any = {}

    if (search) {
      where.OR = [
        { careerPath: { contains: search, mode: 'insensitive' as const } },
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
          careerPath: true,
          category: true,
          matchScore: true,
          skillsMatched: true,
          jobs: true,
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

    // If includeJobs is true, fetch job details for all jobIds
    let recommendationsWithJobs = recommendations
    if (includeJobs) {
      const jobIds = new Set<string>()
      recommendations.forEach(rec => {
        const jobs = rec.jobs as any[] || []
        jobs.forEach(job => {
          if (job.job_id) {
            jobIds.add(job.job_id)
          }
        })
      })

      if (jobIds.size > 0) {
        const jobs = await prisma.job.findMany({
          where: { id: { in: Array.from(jobIds) } },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            description: true,
            requirements: true,
            type: true,
            salary: true,
            salaryRange: true,
          }
        })

        const jobMap = new Map(jobs.map(job => [job.id, job]))

        recommendationsWithJobs = recommendations.map(rec => {
          const jobs = rec.jobs as any[] || []
          const enrichedJobs = jobs.map(job => {
            if (job.job_id) {
              const jobDetails = jobMap.get(job.job_id)
              if (!jobDetails) {
                return job
              }

              return {
                ...job,
                title: jobDetails.title,
                company: jobDetails.company,
                location: jobDetails.location,
                description: jobDetails.description,
                requirements: jobDetails.requirements,
                type: jobDetails.type,
                salary: jobDetails.salary,
                salaryRange: jobDetails.salaryRange,
              }
            }
            return job
          })
          return { ...rec, jobs: enrichedJobs }
        })
      }
    }

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
      recommendations: recommendationsWithJobs,
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
