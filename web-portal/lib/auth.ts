import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const fallbackAuthUrl = 'http://localhost:3000'

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = fallbackAuthUrl
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'dev-secret-change-in-production'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email : undefined
        const password = typeof credentials?.password === 'string' ? credentials.password : undefined

        if (!email || !password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated. Please contact administrator.')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.toLowerCase() as 'user' | 'admin',
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'user' | 'admin'
        
        // Check if user is still active
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true }
        })
        
        if (!user || !user.isActive) {
          session.user = null as any
        }
      }
      return session
    }
  },
  secret: process.env.AUTH_SECRET,
})
