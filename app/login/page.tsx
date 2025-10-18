"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Info } from "lucide-react"
import { createClient, isMockMode } from "@/lib/supabase"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Successful login
        router.push("/dashboard")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image src="/logo.png" alt="Bootyque" width={80} height={80} className="rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-[#5A4A3A]">Bootyque </h1>
              <p className="text-[#8B7355] text-sm italic">Effortless Style, Perfected Sales!   </p>
            </div>
          </div>
        </div>

        {/* Demo Mode Alert */}
        {isMockMode && (
          <Alert className="mb-6 border-[#7D9B7F] bg-[#7D9B7F]/10">
            <Info className="h-4 w-4 text-[#7D9B7F]" />
            <AlertDescription className="text-[#5A4A3A]">
              <strong>Demo Mode:</strong> Running with sample data. Any credentials will work for testing.
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-[#E5DCC8]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-[#5A4A3A]">Access System</CardTitle>
            <CardDescription className="text-center text-[#8B7355]">
              Enter your credentials to access the boutique POS system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter strong password"
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-[#8B7355]">
                  Remember me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#7D9B7F] hover:bg-[#6B8A6D] text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-[#5A4A3A] hover:text-[#C89B9B] text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
