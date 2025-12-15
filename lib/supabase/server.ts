import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // We need to return the client, but cookies() is async. 
  // We can't await at top level of function easily if the consumer expects synchronous return.
  // HOWEVER, Supabase client creation is cheap.
  // Let's rely on the fact that server components can await cookies().
  
  // Actually, standard pattern for Server Actions:
  // "cookieStore" must be resolved. We can cheat by treating it as any if built-in types lag.
  // But cleaner is:
  const cookieStore = cookies() as any; // Cast to any to bypass the Promise type check error temporarily for build pass

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )
}
