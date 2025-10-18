import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for server-side operations with cookie access.
 * Always create a new client within each function - don't use global variables.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Creates an admin Supabase client with service role key (bypasses RLS).
 * Use only for admin operations that require elevated privileges.
 * Added this helper function to simplify admin client creation
 */
export function createAdminClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}
