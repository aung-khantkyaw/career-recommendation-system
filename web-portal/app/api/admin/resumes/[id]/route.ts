import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl, deleteFile } from '@/lib/minio'
import { headers } from 'next/headers'

async function createAuditLog(adminId: string, action: string, entityType?: string, entityId?: string, metadata?: any) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const resume = await prisma.resume.findUnique({
      where: { id }
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Delete file from MinIO
    try {
      await deleteFile(resume.minioPath)
    } catch (error) {
      console.error('Error deleting file from MinIO:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete resume from database
    await prisma.resume.delete({
      where: { id }
    })

    // Create DELETE_RESUME audit log
    await createAuditLog(session.user.id, 'DELETE_RESUME', 'RESUME', id, {
      fileName: resume.fileName,
      originalName: resume.originalName,
      userId: resume.userId,
    })

    return NextResponse.json({ message: 'Resume deleted successfully' })
  } catch (error) {
    console.error('Resume deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
