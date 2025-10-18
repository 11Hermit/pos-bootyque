"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Info, Mail } from "lucide-react"
import { createClient, isMockMode } from "@/lib/supabase"
import Image from "next/image"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    // Validate business name
    if (!businessName.trim()) {
      setError("Business name is required")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/login`,
          data: {
            email: email,
            role: "admin",
            business_name: businessName.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        setSuccess(true)
        // Redirect to login after 5 seconds
        setTimeout(() => {
          router.push("/login")
        }, 5000)
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Success state - show email confirmation message
  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-[#E5DCC8]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#7D9B7F] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#5A4A3A] mb-2">Check Your Email</h2>
            <p className="text-[#8B7355] mb-4 leading-relaxed">
              We've sent a confirmation email to <strong>{email}</strong>
            </p>
            <p className="text-[#8B7355] mb-6 leading-relaxed">
              Please click the link in the email to verify your account. Once verified, you can log in to access the
              system.
            </p>
            <div className="bg-[#7D9B7F]/10 border border-[#7D9B7F] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#5A4A3A]">
                <strong>Note:</strong> If you don't see the email, check your spam folder.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full bg-[#7D9B7F] hover:bg-[#6B8A6D] text-white">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image src="/logo.png" alt="Bootyque" width={80} height={80} className="rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-[#5A4A3A]">Bootyque</h1>
              <p className="text-[#8B7355] text-sm italic">Effortless Style, Perfected Sales!    </p>
            </div>
          </div>
        </div>

        {/* Demo Mode Alert */}
        {isMockMode && (
          <Alert className="mb-6 border-[#7D9B7F] bg-[#7D9B7F]/10">
            <Info className="h-4 w-4 text-[#7D9B7F]" />
            <AlertDescription className="text-[#5A4A3A]">
              <strong>Demo Mode:</strong> Running with sample data. Sign up will work for testing.
            </AlertDescription>
          </Alert>
        )}

        {/* Sign Up Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-[#E5DCC8]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-[#5A4A3A]">Create Account</CardTitle>
            <CardDescription className="text-center text-[#8B7355]">
              Sign up to start using the boutique POS system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Business Name input field */}
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  required
                  className="h-11"
                />
                <p className="text-xs text-[#8B7355]">This will be used as your store name in the system</p>
              </div>

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
                    minLength={8}
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
                <p className="text-xs text-[#8B7355]">Must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#7D9B7F] hover:bg-[#6B8A6D] text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#8B7355]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#7D9B7F] hover:text-[#6B8A6D] font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
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
