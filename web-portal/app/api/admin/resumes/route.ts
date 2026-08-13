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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const userId = searchParams.get('userId') || ''

    const where: any = {}
    
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (status) {
      where.processingStatus = status
    }
    
    if (userId) {
      where.userId = userId
    }

    const resumes = await prisma.resume.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: { recommendations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ resumes })
  } catch (error) {
    console.error('Resumes fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
