"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Home, Package, ShoppingCart, BarChart3, Settings, Menu, LogOut, User, Users } from "lucide-react"
import { createClient, isMockMode } from "@/lib/supabase"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>("Bootyque")
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          router.push("/login")
        } else {
          setUser(session.user)
          supabase
            .from("users")
            .select("role, tenant_id")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                setUserRole(data.role)
                supabase
                  .from("tenants")
                  .select("name")
                  .eq("id", data.tenant_id)
                  .single()
                  .then(({ data: tenantData, error: tenantError }) => {
                    if (tenantData && !tenantError) {
                      setBusinessName(tenantData.name)
                    }
                  })
              }
            })
        }
      })
      .catch((err) => {
        console.error("Session error:", err)
        if (!isMockMode) {
          router.push("/login")
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else {
        setUser(session.user)
        supabase
          .from("users")
          .select("role, tenant_id")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setUserRole(data.role)
              supabase
                .from("tenants")
                .select("name")
                .eq("id", data.tenant_id)
                .single()
                .then(({ data: tenantData, error: tenantError }) => {
                  if (tenantData && !tenantError) {
                    setBusinessName(tenantData.name)
                  }
                })
            }
          })
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  const filteredNavigation =
    userRole === "employee"
      ? navigation.filter((item) => !["Reports", "Staff", "Settings"].includes(item.name))
      : navigation

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7D9B7F]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-4 pb-4 shadow-sm border-r border-[#E5DCC8]">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Bootyque" width={48} height={48} className="rounded-full" />
              <div>
                <h1 className="text-lg font-bold text-[#5A4A3A]">{businessName}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#8B7355]">POS System</p>
                  {isMockMode && (
                    <Badge variant="secondary" className="text-xs">
                      Demo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-[#5A4A3A] hover:text-[#7D9B7F] hover:bg-[#7D9B7F]/10"
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-[#5A4A3A]">
                  <div className="h-8 w-8 rounded-full bg-[#7D9B7F] flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true" className="truncate">
                    {user.email}
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-[#5A4A3A] hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-white px-4 py-3 shadow-sm sm:px-6 lg:hidden border-b border-[#E5DCC8]">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-3 p-6 border-b">
                <Image src="/logo.png" alt="Bootyque" width={48} height={48} className="rounded-full" />
                <div>
                  <h1 className="text-lg font-bold text-[#5A4A3A]">{businessName}</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#8B7355]">POS System</p>
                    {isMockMode && (
                      <Badge variant="secondary" className="text-xs">
                        Demo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSheetOpen(false)}
                    className="group flex gap-x-3 rounded-lg p-3 text-base leading-6 font-semibold text-[#5A4A3A] hover:text-[#7D9B7F] hover:bg-[#7D9B7F]/10 active:bg-[#7D9B7F]/20 transition-colors"
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t">
                <div className="flex items-center gap-x-3 px-3 py-2 mb-2 text-sm font-medium text-[#5A4A3A]">
                  <div className="h-8 w-8 rounded-full bg-[#7D9B7F] flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <Button
                  onClick={() => {
                    setIsSheetOpen(false)
                    handleLogout()
                  }}
                  variant="ghost"
                  className="w-full justify-start text-[#5A4A3A] hover:text-red-600 hover:bg-red-50 h-11"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-base font-semibold leading-6 text-[#5A4A3A] truncate">
          {businessName}
          {isMockMode && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Demo
            </Badge>
          )}
        </div>
        <div className="h-9 w-9 rounded-full bg-[#7D9B7F] flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="px-3 py-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
