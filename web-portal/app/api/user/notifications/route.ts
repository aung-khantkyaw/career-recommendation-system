import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Count unread
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ids, markAsRead } = body

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id
      },
      data: {
        isRead: markAsRead !== false
      }
    })

    return NextResponse.json({ message: 'Notifications updated successfully' })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
