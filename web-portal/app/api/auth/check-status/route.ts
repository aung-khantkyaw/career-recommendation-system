import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true }
    })

    if (!user) {
      return NextResponse.json(
        { isActive: false },
        { status: 200 }
      )
    }

    return NextResponse.json({ isActive: user.isActive })
  } catch (error) {
    console.error('Error checking user status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
