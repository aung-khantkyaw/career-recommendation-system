import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth(function proxy(req) {
    const user = req.auth?.user
    const isAuth = !!user
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isUserPage = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/upload') || req.nextUrl.pathname.startsWith('/profile')

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      if (user?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protect admin routes
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (user?.role !== 'admin') {
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
  })

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
