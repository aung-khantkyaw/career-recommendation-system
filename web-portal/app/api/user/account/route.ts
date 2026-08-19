import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// DELETE - Delete account
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { confirmationText, password } = body

    if (!confirmationText || !password) {
      return NextResponse.json(
        { error: 'Confirmation text and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, password: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const expectedConfirmation = `delete my account ${user.name}`

    if (confirmationText.toLowerCase() !== expectedConfirmation.toLowerCase()) {
      return NextResponse.json(
        { error: 'Confirmation text does not match. Please type exactly: "delete my account <username>"' },
        { status: 400 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      )
    }

    // Delete user's related data (resumes, bookmarks, etc.)
    await prisma.$transaction([
      // Delete bookmarks
      prisma.jobBookmark.deleteMany({
        where: { userId: session.user.id }
      }),
      // Delete resumes
      prisma.resume.deleteMany({
        where: { userId: session.user.id }
      }),
      // Delete user
      prisma.user.delete({
        where: { id: session.user.id }
      })
    ])

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
