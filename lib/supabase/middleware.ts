import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Basic security headers
  supabaseResponse.headers.set('x-content-type-options', 'nosniff')
  supabaseResponse.headers.set('x-frame-options', 'DENY')
  supabaseResponse.headers.set('x-xss-protection', '1; mode=block')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: You *must* run the getUser/getSession to trigger the token refresh
  // if needed.
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;
  const protectedRoutes = ['/vault', '/rankings', '/compare'];

  // Redirect if not logged in and trying to access protected route
  if (!user && protectedRoutes.some(route => path.startsWith(route))) {
     const url = request.nextUrl.clone();
     url.pathname = '/settings/account';
     url.searchParams.set('next', path); // Allow return after login
     return NextResponse.redirect(url);
  }

  // TODO: Server-side Allowlist Check?
  // We can do it here, but it might be heavy. For now, we rely on RLS not returning data if strict.
  // But strictly blocking UI is better.
  // Let's keep it simple for now as requested: Auth Guard first.
  // If we want strict allowlist here:
  /*
  if (user && path !== '/settings/account' && path !== '/access-denied') {
     // Check allowlist table? Or hardcode for speed?
     // Database check is better source of truth.
     // const allowed = await supabase.rpc('is_authorized'); 
     // This needs the migration applied.
  }
  */

  return supabaseResponse
}
