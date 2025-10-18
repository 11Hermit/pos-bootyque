"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export type UserRole = "admin" | "employee"

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: userData, error } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (error) throw error

      setRole(userData?.role as UserRole)
    } catch (error) {
      console.error("Error fetching user role:", error)
    } finally {
      setLoading(false)
    }
  }

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isEmployee: role === "employee",
  }
}
