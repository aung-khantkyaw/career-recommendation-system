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

    const configs = await prisma.emailConfig.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Email config fetch error:', error)
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
    const { provider, host, port, username, password, fromEmail, fromName, active } = body

    if (!provider || !host || !port) {
      return NextResponse.json(
        { error: 'Provider, host, and port are required' },
        { status: 400 }
      )
    }

    // Deactivate all other configs if this one is being set as active
    if (active) {
      await prisma.emailConfig.updateMany({
        where: { active: true },
        data: { active: false }
      })
    }

    const config = await prisma.emailConfig.create({
      data: {
        provider,
        host,
        port: parseInt(port),
        username,
        password,
        fromEmail,
        fromName,
        active: active ?? true,
      }
    })

    return NextResponse.json({ config }, { status: 201 })
  } catch (error) {
    console.error('Email config creation error:', error)
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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { provider, host, port, username, password, fromEmail, fromName, active } = body

    // Deactivate all other configs if this one is being set as active
    if (active) {
      await prisma.emailConfig.updateMany({
        where: { active: true, id: { not: id } },
        data: { active: false }
      })
    }

    const config = await prisma.emailConfig.update({
      where: { id },
      data: {
        ...(provider && { provider }),
        ...(host && { host }),
        ...(port && { port: parseInt(port) }),
        ...(username !== undefined && { username }),
        ...(password !== undefined && { password }),
        ...(fromEmail !== undefined && { fromEmail }),
        ...(fromName !== undefined && { fromName }),
        ...(active !== undefined && { active }),
      }
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Email config update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    await prisma.emailConfig.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Email configuration deleted successfully' })
  } catch (error) {
    console.error('Email config deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
