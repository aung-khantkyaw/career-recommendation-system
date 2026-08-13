import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

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
        recommendations: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get the most recent completed resume with recommendations
    const latestCompletedResume = resumes.find(r => r.processingStatus === 'COMPLETED')

    let skills: { all: string[]; technical: string[]; soft: string[] } = { all: [], technical: [], soft: [] }
    let recommendations = []

    if (latestCompletedResume && latestCompletedResume.skills) {
      // Prisma Json type might already be parsed or might be a string
      skills = typeof latestCompletedResume.skills === 'string' 
        ? JSON.parse(latestCompletedResume.skills as string)
        : latestCompletedResume.skills as any
      
      // Remove case-insensitive duplicates
      if (skills.all) {
        skills.all = Array.from(new Set(skills.all.map((s: string) => s.toLowerCase())))
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .sort((a: string, b: string) => a.localeCompare(b))
      }
      if (skills.technical) {
        skills.technical = Array.from(new Set(skills.technical.map((s: string) => s.toLowerCase())))
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .sort((a: string, b: string) => a.localeCompare(b))
      }
      if (skills.soft) {
        skills.soft = Array.from(new Set(skills.soft.map((s: string) => s.toLowerCase())))
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .sort((a: string, b: string) => a.localeCompare(b))
      }
      
      // Transform grouped recommendations into individual job objects
      if (latestCompletedResume.recommendations && latestCompletedResume.recommendations.length > 0) {
        recommendations = []
        
        // Collect all jobIds
        const jobIds = new Set<string>()
        for (const rec of latestCompletedResume.recommendations) {
          const jobs = rec.jobs as any[] || []
          jobs.forEach(job => {
            if (job.job_id) {
              jobIds.add(job.job_id)
            }
          })
        }

        // Fetch job details
        let jobMap = new Map()
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
          jobMap = new Map(jobs.map(job => [job.id, job]))
        }

        for (const rec of latestCompletedResume.recommendations) {
          const jobs = rec.jobs as any[] || []
          
          for (const job of jobs) {
            let jobDetails = null
            if (job.job_id && jobMap.has(job.job_id)) {
              jobDetails = jobMap.get(job.job_id)
            }

            recommendations.push({
              id: `${rec.id}-${job.job_id || 'career'}`,
              jobTitle: jobDetails?.title || rec.careerPath || 'N/A',
              company: jobDetails?.company || null,
              location: jobDetails?.location || null,
              type: jobDetails?.type || null,
              salary: jobDetails?.salary || null,
              salaryRange: jobDetails?.salaryRange || null,
              matchScore: job.matchScore || rec.matchScore,
              skillsMatched: job.skillsMatched || rec.skillsMatched || [],
              description: jobDetails?.description || null,
              requirements: jobDetails?.requirements || [],
              careerPath: rec.careerPath || null,
              category: rec.category || null
            })
          }
        }
        
        // Sort by match score
        recommendations.sort((a, b) => b.matchScore - a.matchScore)
      }
    }

    // Calculate stats - totalSkills across all completed resumes
    let totalSkills = 0
    const completedResumes = resumes.filter(r => r.processingStatus === 'COMPLETED')
    
    completedResumes.forEach(resume => {
      if (resume.skills) {
        try {
          // Prisma Json type might already be parsed or might be a string
          const resumeSkills = typeof resume.skills === 'string'
            ? JSON.parse(resume.skills as string)
            : resume.skills as any
          totalSkills += resumeSkills.all?.length || 0
        } catch (e) {
          console.error('Error parsing skills:', e)
        }
      }
    })

    const stats = {
      totalResumes: resumes.length,
      completedResumes: completedResumes.length,
      processingResumes: resumes.filter(r => r.processingStatus === 'PROCESSING').length,
      totalSkills: totalSkills,
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
