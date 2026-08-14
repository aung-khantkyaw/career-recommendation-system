import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params;

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params;

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, llmModelName, embeddingModelName, apiKey, limit, expiresAt, active } = body

    const updateData: any = {}
    if (provider) updateData.provider = provider.toUpperCase()
    if (llmModelName !== undefined) updateData.llmModelName = llmModelName
    if (embeddingModelName !== undefined) updateData.embeddingModelName = embeddingModelName
    if (apiKey) updateData.apiKey = apiKey
    if (limit !== undefined) updateData.limit = limit
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (active !== undefined) updateData.active = active

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ apiKey: updatedApiKey })
  } catch (error) {
    console.error('Failed to update API key:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params;

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
