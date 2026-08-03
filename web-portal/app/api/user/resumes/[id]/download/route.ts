import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const resume = await prisma.resume.findUnique({
      where: { id }
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fileUrl = getFileUrl(resume.minioPath)

    return NextResponse.json({ 
      downloadUrl: fileUrl,
      fileName: resume.originalName,
      mimeType: resume.mimeType
    })
  } catch (error) {
    console.error('Resume download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
