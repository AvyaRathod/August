import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = req.nextUrl.pathname.startsWith('/admin/login')

  if (isAdminRoute && !isLoginPage) {
    // TODO: Phase 6 — replace with real Supabase session check
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*']
}
