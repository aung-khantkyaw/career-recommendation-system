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

    const configs = await prisma.systemConfig.findMany({
      orderBy: { category: 'asc' }
    })

    // Group by category
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = []
      }
      acc[config.category].push(config)
      return acc
    }, {} as Record<string, typeof configs>)

    return NextResponse.json({ configs: grouped })
  } catch (error) {
    console.error('System config fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { key, value, description, category } = body

    if (!key || !value || !category) {
      return NextResponse.json(
        { error: 'Key, value, and category are required' },
        { status: 400 }
      )
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, description, category },
      create: { key, value, description, category }
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('System config creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { key, value, description } = body

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const config = await prisma.systemConfig.update({
      where: { key },
      data: { value, description }
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('System config update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
