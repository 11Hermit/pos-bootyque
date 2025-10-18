"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, isMockMode } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          if (!isMockMode) {
            router.push("/login")
            return
          }
        }

        if (!session) {
          router.push("/login")
          return
        }

        setUser(session.user)
        setLoading(false)
      } catch (err) {
        console.error("Session error:", err)
        router.push("/login")
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email)

      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        router.push("/login")
      } else if (event === "SIGNED_IN" && session) {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {isMockMode && <p className="text-xs text-gray-500 mt-2">Demo Mode Active</p>}
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
