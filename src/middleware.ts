import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set<string>(['/healthcheck'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const referer = request.headers.get('referer')
  const isClientNavigation = referer && referer.includes('localhost:3000')

  if (isClientNavigation) {
    return NextResponse.next()
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '').split('.')[0]
  const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : undefined

  let hasSessionCookie = false
  if (supabaseCookieName) {
    const authCookie = request.cookies.get(supabaseCookieName)
    hasSessionCookie = Boolean(authCookie?.value)
  }

  if (!hasSessionCookie) {
    const allCookies = request.cookies.getAll()
    hasSessionCookie = allCookies.some(cookie =>
      cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')
    )
  }

  const hasTokenParams = request.nextUrl.searchParams.has('access_token') && request.nextUrl.searchParams.has('refresh_token')

  if (hasTokenParams) {
    return NextResponse.next()
  }

  if (!hasSessionCookie) {
    const redirectUrl = new URL('http://localhost:8000')
    redirectUrl.searchParams.set('redirect', request.nextUrl.href)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)|site.webmanifest).*)'],
}
