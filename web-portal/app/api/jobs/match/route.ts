import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const careerPathId = searchParams.get('careerPathId')
    const skills = searchParams.get('skills')?.split(',').map(s => s.trim().toLowerCase()) || []

    if (!careerPathId && skills.length === 0) {
      return NextResponse.json({ error: 'careerPathId or skills parameter required' }, { status: 400 })
    }

    let careerPath = null
    let targetSkills: string[] = []

    if (careerPathId) {
      careerPath = await prisma.careerPath.findUnique({
        where: { id: careerPathId },
        select: { requiredSkills: true, softSkills: true },
      })
      if (careerPath) {
        targetSkills = [...careerPath.requiredSkills, ...careerPath.softSkills].map(s => s.toLowerCase())
      }
    } else {
      targetSkills = skills
    }

    const jobs = await prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: {
        careerPath: {
          select: {
            id: true,
            title: true,
            category: true,
            requiredSkills: true,
          },
        },
      },
    })

    const matchedJobs = jobs.map(job => {
      const jobRequirements = job.requirements.map(r => r.toLowerCase())
      const jobSkills = job.careerPath?.requiredSkills.map(s => s.toLowerCase()) || []
      const allJobSkills = [...jobRequirements, ...jobSkills]

      let matchScore = 0
      let matchedSkills: string[] = []

      if (targetSkills.length > 0) {
        targetSkills.forEach(skill => {
          if (allJobSkills.some(jobSkill => 
            jobSkill.includes(skill) || skill.includes(jobSkill)
          )) {
            matchScore += 1
            matchedSkills.push(skill)
          }
        })

        matchScore = Math.round((matchScore / targetSkills.length) * 100)
      }

      return {
        ...job,
        matchScore,
        matchedSkills,
      }
    }).filter(job => job.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({ jobs: matchedJobs })
  } catch (error) {
    console.error('Job matching error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
