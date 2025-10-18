"use server"

import { createClient } from "@/lib/supabase"

export async function getTenantId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()

    if (error) throw error

    return data?.tenant_id || null
  } catch (error) {
    console.error("Error getting tenant ID:", error)
    return null
  }
}
