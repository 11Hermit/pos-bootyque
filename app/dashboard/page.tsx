"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Package, TrendingUp, Users, ShoppingCart, AlertTriangle, Plus, Eye } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"
import AuthGuard from "@/components/auth-guard"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { useUserRole } from "@/hooks/use-user-role"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0,
    productsSold: 0,
    revenue: 0,
    profit: 0,
  })
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [salesTrendData, setSalesTrendData] = useState<any[]>([])
  const [categoryDistributionData, setCategoryDistributionData] = useState<any[]>([])

  const { isAdmin, loading: roleLoading } = useUserRole()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date()

      // 1. Fetch Sales Data for Today
      const startOfToday = startOfDay(now).toISOString()
      const endOfToday = endOfDay(now).toISOString()

      const { data: todaySalesData, error: todaySalesError } = await supabase
        .from("sales")
        .select(`
          total_amount,
          sale_items (
            quantity,
            products (
              category
            )
          )
        `)
        .gte("created_at", startOfToday)
        .lte("created_at", endOfToday)
        .eq("status", "completed")

      if (todaySalesError) throw todaySalesError

      const todaySales = todaySalesData.reduce((sum, sale) => sum + sale.total_amount, 0)
      const productsSoldToday = todaySalesData.reduce(
        (sum, sale) => sum + (sale.sale_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
        0,
      )

      // 2. Fetch Sales Data for Last 7 Days (for Revenue, Profit, Sales Trend, Category Distribution)
      const sevenDaysAgo = subDays(now, 6).toISOString() // Start of 7 days ago
      const { data: last7DaysSales, error: last7DaysSalesError } = await supabase
        .from("sales")
        .select(`
          created_at,
          total_amount,
          total_profit,
          sale_items (
            quantity,
            products (
              category
            )
          )
        `)
        .gte("created_at", sevenDaysAgo)
        .lte("created_at", now.toISOString())
        .eq("status", "completed")

      if (last7DaysSalesError) throw last7DaysSalesError

      const totalRevenue = last7DaysSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const totalProfit = last7DaysSales.reduce((sum, sale) => sum + sale.total_profit, 0)

      // Aggregate sales trend data (daily for last 7 days)
      const dailySalesMap: { [key: string]: { name: string; sales: number; profit: number } } = {}
      for (let i = 0; i < 7; i++) {
        const date = subDays(now, 6 - i)
        dailySalesMap[format(date, "EEE")] = { name: format(date, "EEE"), sales: 0, profit: 0 }
      }

      last7DaysSales.forEach((sale) => {
        const day = format(new Date(sale.created_at), "EEE")
        if (dailySalesMap[day]) {
          dailySalesMap[day].sales += sale.total_amount
          dailySalesMap[day].profit += sale.total_profit
        }
      })
      setSalesTrendData(Object.values(dailySalesMap))

      // Aggregate category distribution data
      const categoryStats: { [key: string]: { name: string; value: number; color: string } } = {}
      const colors = ["#1E40AF", "#F97316", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]
      let colorIndex = 0

      last7DaysSales.forEach((sale) => {
        sale.sale_items?.forEach((item: any) => {
          const category = item.products?.category || "Unknown"
          if (!categoryStats[category]) {
            categoryStats[category] = { name: category, value: 0, color: colors[colorIndex % colors.length] }
            colorIndex++
          }
          categoryStats[category].value += item.quantity // Using quantity for distribution, could be total_price
        })
      })
      setCategoryDistributionData(Object.values(categoryStats))

      // 3. Fetch Low Stock Products (fetch all, then filter client-side)
      const { data: allProducts, error: allProductsError } = await supabase
        .from("products")
        .select("name, stock_quantity, min_stock_level")

      if (allProductsError) throw allProductsError

      const filteredLowStockProducts = allProducts.filter(
        (product) => product.stock_quantity <= product.min_stock_level,
      )
      setLowStockProducts(filteredLowStockProducts || [])

      // 4. Fetch Recent Transactions (e.g., last 5)
      const { data: recentSales, error: recentSalesError } = await supabase
        .from("sales")
        .select(`
          id,
          total_amount,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(5)
        .eq("status", "completed")

      if (recentSalesError) throw recentSalesError

      const transactionsWithCustomerNames = recentSales.map((sale) => ({
        id: sale.id,
        customer: "Walk-in Customer",
        amount: sale.total_amount,
        time: format(new Date(sale.created_at), "h:mm a"),
      }))
      setRecentTransactions(transactionsWithCustomerNames || [])

      setStats({
        todaySales: todaySales,
        productsSold: productsSoldToday,
        revenue: totalRevenue,
        profit: totalProfit,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Optionally show a toast notification
    } finally {
      setLoading(false)
    }
  }

  if (loading || roleLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D9B7F]"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#5A4A3A]">Dashboard</h1>
              <p className="text-[#8B7355]">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/pos">
                <Button className="bg-[#7D9B7F] hover:bg-[#6B8A6D]">
                  <Plus className="w-4 h-4 mr-2" />
                  New Sale
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-[#E5DCC8]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {stats.todaySales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-[#7D9B7F]">+12.5%</span> from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#E5DCC8]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.productsSold}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-[#7D9B7F]">+8.2%</span> from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#E5DCC8]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue (Last 7 Days)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {stats.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-[#7D9B7F]">+15.3%</span> from last week
                </p>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="border-[#E5DCC8]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit (Last 7 Days)</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KSh {stats.profit.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-[#7D9B7F]">+22.1%</span> from last week
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <Card className="border-[#E5DCC8]">
              <CardHeader>
                <CardTitle>Weekly Sales Trend</CardTitle>
                <CardDescription>Sales and profit over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    sales: {
                      label: "Sales",
                      color: "#7D9B7F",
                    },
                    profit: {
                      label: "Profit",
                      color: "#C89B9B",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrendData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="sales" stroke="#7D9B7F" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#C89B9B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border-[#E5DCC8]">
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribution of sales across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Percentage",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {categoryDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <Card className="border-[#E5DCC8]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Low Stock Alerts.
                </CardTitle>
                <CardDescription>Items that need restocking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">
                            Stock: {product.stock_quantity} / Min: {product.min_stock_level}
                          </p>
                        </div>
                        <Badge variant="destructive">Low Stock</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No low stock products.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-[#E5DCC8]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#7D9B7F]" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Latest sales transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Transaction #{transaction.id.substring(0, 8)}</p>
                          <p className="text-xs text-gray-600">{transaction.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">KSh {transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{transaction.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No recent transactions.</p>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                  <Link href="/reports">
                    <Eye className="w-4 h-4 mr-2" />
                    View All Transactions
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
