import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, getFileUrl, deleteFile, getStorageKeyFromUrl } from '@/lib/minio'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Get current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true }
    })

    // Delete old avatar if exists
    if (user?.avatar) {
      const oldKey = getStorageKeyFromUrl(user.avatar)
      await deleteFile(oldKey)
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const minioPath = `avatars/${session.user.id}/${uniqueFileName}`

    // Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadFile(minioPath, buffer, file.type)

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Generate public URL
    const avatarUrl = getFileUrl(minioPath)

    // Update user avatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl }
    })

    return NextResponse.json(
      {
        message: 'Avatar uploaded successfully',
        avatarUrl
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
