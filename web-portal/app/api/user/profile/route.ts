import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

async function createActivityLog(userId: string, action: string, entityType?: string, entityId?: string, metadata?: any) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create activity log:', error)
  }
}

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumbers: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        resumes: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            processingStatus: true,
            createdAt: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, phoneNumbers, avatar, bio, location, website } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phoneNumbers !== undefined && { phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [] }),
        ...(avatar !== undefined && { avatar }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumbers: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        isActive: true,
        lastLoginAt: true,
      }
    })

    // Create UPDATE_PROFILE activity log
    await createActivityLog(session.user.id, 'UPDATE_PROFILE', 'PROFILE', session.user.id, {
      updatedFields: Object.keys(body),
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
