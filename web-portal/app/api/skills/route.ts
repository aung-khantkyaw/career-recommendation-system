import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const active = searchParams.get('active')

    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (active === 'true') {
      where.active = true
    } else if (active === 'false') {
      where.active = false
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        difficulty: true,
        active: true,
      }
    })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Skills fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
