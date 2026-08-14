import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import redis, { ensureRedisConnection } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const active = searchParams.get('active')

    const where: any = {}
    if (provider) where.provider = provider.toUpperCase()
    if (active === 'true') where.active = true
    if (active === 'false') where.active = false

    const apiKeys = await prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Failed to fetch API keys:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, llmModelName, embeddingModelName, apiKey, limit, expiresAt } = body

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!llmModelName && !embeddingModelName) {
      return NextResponse.json({ error: 'At least one model name (LLM or Embedding) is required' }, { status: 400 })
    }

    const newApiKey = await prisma.apiKey.create({
      data: {
        provider: provider.toUpperCase(),
        llmModelName,
        embeddingModelName,
        apiKey,
        limit: limit || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ apiKey: newApiKey }, { status: 201 })
  } catch (error) {
    console.error('Failed to create API key:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { llmModelName, embeddingModelName, apiKey, limit, expiresAt, active } = body

    const updateData: any = {}
    if (llmModelName !== undefined) updateData.llmModelName = llmModelName
    if (embeddingModelName !== undefined) updateData.embeddingModelName = embeddingModelName
    if (apiKey !== undefined) updateData.apiKey = apiKey
    if (limit !== undefined) updateData.limit = limit
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (active !== undefined) updateData.active = active

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    })

    // Notify AI processor if active status changed
    if (active !== undefined) {
      await ensureRedisConnection()
      await redis.publish('api_key_changes', JSON.stringify({
        type: 'active_changed',
        apiKeyId: updatedApiKey.id,
        active: updatedApiKey.active,
        provider: updatedApiKey.provider,
        llmModelName: updatedApiKey.llmModelName,
        embeddingModelName: updatedApiKey.embeddingModelName,
      }))
    }

    return NextResponse.json({ apiKey: updatedApiKey })
  } catch (error) {
    console.error('Failed to update API key:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    await prisma.apiKey.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'API key deleted successfully' })
  } catch (error) {
    console.error('Failed to delete API key:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
