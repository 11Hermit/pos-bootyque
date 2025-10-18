"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Settings,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Wrench,
  ShoppingCart,
  Package,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Alfire Spares & Accessories</h1>
              <p className="text-orange-200 text-sm">Bei Nafuu, Vipimo Vinapatikana</p>
            </div>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Demo Status */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Demo Environment Status
              </CardTitle>
              <CardDescription>Current configuration and available features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supabase Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? "bg-green-500" : "bg-yellow-500"}`}
                  ></div>
                  <div>
                    <p className="font-medium">Database Connection</p>
                    <p className="text-sm text-gray-600">
                      {isSupabaseConfigured ? "Connected to Supabase" : "Using mock data (demo mode)"}
                    </p>
                  </div>
                </div>
                <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
                  {isSupabaseConfigured ? "Live" : "Demo"}
                </Badge>
              </div>

              {/* Authentication Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Authentication</p>
                    <p className="text-sm text-gray-600">
                      {isSupabaseConfigured ? "Supabase Auth enabled" : "Mock authentication active"}
                    </p>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              {/* Features Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Core Features</p>
                    <p className="text-sm text-gray-600">POS, Inventory, Reports, Barcode scanning</p>
                  </div>
                </div>
                <Badge variant="default">Available</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Alert */}
          {!isSupabaseConfigured && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Demo Mode:</strong> The system is running with mock data. To use with real data, configure your
                Supabase database connection in the integration settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Access */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Jump directly to different sections of the POS system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/login">
                  <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800">
                    <Settings className="w-6 h-6" />
                    <span>Login</span>
                  </Button>
                </Link>

                <Link href="/pos">
                  <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
                    <ShoppingCart className="w-6 h-6" />
                    <span>Point of Sale</span>
                  </Button>
                </Link>

                <Link href="/inventory">
                  <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700">
                    <Package className="w-6 h-6" />
                    <span>Inventory</span>
                  </Button>
                </Link>

                <Link href="/reports">
                  <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700">
                    <BarChart3 className="w-6 h-6" />
                    <span>Reports</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          {!isSupabaseConfigured && (
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Setup Instructions
                </CardTitle>
                <CardDescription>To connect your own database and enable full functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Add Supabase Integration</p>
                      <p className="text-gray-600">Click the "Add Integration" button and select Supabase</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Run Database Scripts</p>
                      <p className="text-gray-600">Execute the provided SQL scripts to set up tables and sample data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Create Admin User</p>
                      <p className="text-gray-600">Set up your admin account through Supabase Auth</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
