"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Store, Bell, Shield, Database, Printer } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import AuthGuard from "@/components/auth-guard"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Company Settings
    companyName: "Alfire Spares & Accessories",
    tagline: "Bei Nafuu, Vipimo Vinapatikana",
    address: "Nairobi, Kenya",
    phone: "+254 700 000 000",
    email: "info@alfirespares.com",

    // System Settings
    currency: "KSH",
    taxRate: 18,
    lowStockThreshold: 5,
    autoBackup: true,

    // Notification Settings
    lowStockAlerts: true,
    dailyReports: true,
    emailNotifications: true,

    // Receipt Settings
    receiptFooter: "Thank you for your business!",
    showProfit: false,
    autoPrint: false,
  })

  const handleSave = () => {
    // This would save settings to the database
    console.log("Settings saved:", settings)
  }

  const handleReset = () => {
    // Reset to default settings
    console.log("Settings reset to defaults")
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your POS system preferences</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Navigation */}
            <div className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settings Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Store className="w-4 h-4 mr-2" />
                    Company Info
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    System Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Printer className="w-4 h-4 mr-2" />
                    Receipt Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Data Management
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Update your business details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={settings.tagline}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    System Settings
                  </CardTitle>
                  <CardDescription>Configure system-wide preferences and defaults</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) => setSettings({ ...settings, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KSH">KSH - Kenyan Shilling</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => setSettings({ ...settings, taxRate: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lowStock">Low Stock Threshold</Label>
                      <Input
                        id="lowStock"
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) =>
                          setSettings({ ...settings, lowStockThreshold: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-gray-600">Automatically backup data daily</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Manage alerts and notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified when products are running low</p>
                    </div>
                    <Switch
                      checked={settings.lowStockAlerts}
                      onCheckedChange={(checked) => setSettings({ ...settings, lowStockAlerts: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Reports</Label>
                      <p className="text-sm text-gray-600">Receive daily sales summary reports</p>
                    </div>
                    <Switch
                      checked={settings.dailyReports}
                      onCheckedChange={(checked) => setSettings({ ...settings, dailyReports: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Send notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Receipt Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    Receipt Settings
                  </CardTitle>
                  <CardDescription>Customize receipt appearance and behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                    <Textarea
                      id="receiptFooter"
                      value={settings.receiptFooter}
                      onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                      placeholder="Thank you message for customers"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Profit on Receipt</Label>
                      <p className="text-sm text-gray-600">Display profit information on receipts</p>
                    </div>
                    <Switch
                      checked={settings.showProfit}
                      onCheckedChange={(checked) => setSettings({ ...settings, showProfit: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Print Receipt</Label>
                      <p className="text-sm text-gray-600">Automatically print receipt after sale</p>
                    </div>
                    <Switch
                      checked={settings.autoPrint}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoPrint: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage security and access control</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Current User</Label>
                      <p className="text-sm text-gray-600">admin@alfirespares.com</p>
                    </div>
                    <Badge>Admin</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full bg-transparent">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      Two-Factor Authentication
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>Backup, export, and manage your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">Export Products</Button>
                    <Button variant="outline">Export Sales Data</Button>
                    <Button variant="outline">Backup Database</Button>
                    <Button variant="outline">Import Products</Button>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Last backup: Today at 3:00 AM</p>
                    <Button variant="outline" size="sm">
                      Create Manual Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
