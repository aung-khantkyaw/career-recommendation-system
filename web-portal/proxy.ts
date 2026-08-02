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
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        const isPublicAuthPage =
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/auth/error')

        return isPublicAuthPage || !!token
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
