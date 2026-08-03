import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isUserPage = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/upload') || req.nextUrl.pathname.startsWith('/profile')

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protect admin routes
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Protect user routes
    if (isUserPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
      error: '/auth/error',
    },
    callbacks: {
      authorized: async ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        const isPublicAuthPage =
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/auth/error')

        if (isPublicAuthPage) return true
        if (!token) return false

        // Check if user is still active in database
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/check-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: token.id }),
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          return data.isActive
        } catch (error) {
          console.error('Error checking user status:', error)
          return true // Allow access if check fails to avoid breaking the app
        }
      },
    },
  }
)

export const config = {
  matcher: [
    '/login',
    '/register',
    '/auth/error',
    '/dashboard/:path*',
    '/upload/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
}
