import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_ROLES = ['admin', 'hr']
const AUTH_COOKIE_NAME = 'complete_tasks_auth'
const ROLE_COOKIE_NAME = 'complete_tasks_role'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value

  if (!authCookie || authCookie !== '1') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(roleCookie ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*']
}
