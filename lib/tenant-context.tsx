"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface TenantContextType {
  tenantId: string | null
  tenantName: string | null
  loading: boolean
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  loading: true,
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTenantInfo()
  }, [])

  const fetchTenantInfo = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get user's tenant info
      const { data: userData, error } = await supabase
        .from("users")
        .select(
          `
          tenant_id,
          tenants (
            name
          )
        `,
        )
        .eq("id", user.id)
        .single()

      if (error) throw error

      if (userData) {
        setTenantId(userData.tenant_id)
        setTenantName((userData.tenants as any)?.name || null)
      }
    } catch (error) {
      console.error("Error fetching tenant info:", error)
    } finally {
      setLoading(false)
    }
  }

  return <TenantContext.Provider value={{ tenantId, tenantName, loading }}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}
