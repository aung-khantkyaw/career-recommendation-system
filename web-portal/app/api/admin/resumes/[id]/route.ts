import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl, deleteFile } from '@/lib/minio'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

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

    return NextResponse.json({ message: 'Resume deleted successfully' })
  } catch (error) {
    console.error('Resume deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
