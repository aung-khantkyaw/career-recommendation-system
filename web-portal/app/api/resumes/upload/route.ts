import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/minio'
import { addJobToQueue } from '@/lib/redis'
import { randomUUID } from 'crypto'
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

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, and TXT files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const minioPath = `resumes/${session.user.id}/${uniqueFileName}`

    // Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadFile(minioPath, buffer, file.type)

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: uniqueFileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        minioPath,
        processingStatus: 'PENDING',
      }
    })

    // Create UPLOAD_RESUME activity log
    await createActivityLog(session.user.id, 'UPLOAD_RESUME', 'RESUME', resume.id, {
      fileName: resume.fileName,
      originalName: resume.originalName,
      fileSize: resume.fileSize,
    })

    // Add job to Redis queue for AI processing
    await addJobToQueue(resume.id, minioPath, session.user.id)

    return NextResponse.json(
      {
        message: 'Resume uploaded successfully',
        resume: {
          id: resume.id,
          fileName: resume.fileName,
          originalName: resume.originalName,
          fileSize: resume.fileSize,
          processingStatus: resume.processingStatus,
          createdAt: resume.createdAt,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
