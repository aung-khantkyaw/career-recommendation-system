import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock career data - In production, this would come from a database
const careerPaths = [
  { id: 1, title: 'Software Engineer', category: 'Engineering', jobs: 1250, avgSalary: '$120,000', growth: '+15%', active: true },
  { id: 2, title: 'Data Scientist', category: 'Data', jobs: 850, avgSalary: '$135,000', growth: '+22%', active: true },
  { id: 3, title: 'Product Manager', category: 'Product', jobs: 620, avgSalary: '$145,000', growth: '+18%', active: true },
  { id: 4, title: 'DevOps Engineer', category: 'Engineering', jobs: 480, avgSalary: '$130,000', growth: '+20%', active: true },
  { id: 5, title: 'UX Designer', category: 'Design', jobs: 390, avgSalary: '$95,000', growth: '+12%', active: true },
  { id: 6, title: 'Machine Learning Engineer', category: 'AI', jobs: 320, avgSalary: '$150,000', growth: '+25%', active: true },
]

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
    const search = searchParams.get('search') || ''

    const filteredCareers = careerPaths.filter(career =>
      career.title.toLowerCase().includes(search.toLowerCase()) ||
      career.category.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
      total: careerPaths.length,
      active: careerPaths.filter(c => c.active).length,
      totalJobs: careerPaths.reduce((acc, c) => acc + c.jobs, 0),
      avgGrowth: '+18%',
    }

    return NextResponse.json({ careers: filteredCareers, stats })
  } catch (error) {
    console.error('Careers fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, category, jobs, avgSalary, growth, active } = body

    const newCareer = {
      id: careerPaths.length + 1,
      title,
      category,
      jobs,
      avgSalary,
      growth,
      active: active ?? true,
    }

    careerPaths.push(newCareer)

    return NextResponse.json(
      { message: 'Career path created successfully', career: newCareer },
      { status: 201 }
    )
  } catch (error) {
    console.error('Career creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
