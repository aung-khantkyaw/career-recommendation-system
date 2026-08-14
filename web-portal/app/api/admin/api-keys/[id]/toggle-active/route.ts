import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import redis, { ensureRedisConnection } from '@/lib/redis'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // If activating this key, deactivate all others first
    if (!apiKey.active) {
      await prisma.apiKey.updateMany({
        where: {
          id: { not: id },
          active: true,
        },
        data: {
          active: false,
        },
      })
    }

    // Toggle the active status
    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        active: !apiKey.active,
      },
    })

    // Notify AI processor about the active status change
    await ensureRedisConnection()
    await redis.publish('api_key_changes', JSON.stringify({
      type: 'active_changed',
      apiKeyId: updatedApiKey.id,
      active: updatedApiKey.active,
      provider: updatedApiKey.provider,
      llmModelName: updatedApiKey.llmModelName,
      embeddingModelName: updatedApiKey.embeddingModelName,
    }))

    return NextResponse.json({ apiKey: updatedApiKey })
  } catch (error) {
    console.error('Failed to toggle API key active status:', error)
    return NextResponse.json({ error: 'Failed to toggle API key active status' }, { status: 500 })
  }
}
