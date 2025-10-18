"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import DashboardLayout from "@/components/dashboard-layout"
import AuthGuard from "@/components/auth-guard"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { createClient } from "@/lib/supabase"
// import { sales } from "@/data/sales" // Declare the sales variable here

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [reportType, setReportType] = useState("daily")
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalTransactions: 0,
    avgOrderValue: 0,
  })

  const [salesDataFromAPI, setSalesDataFromAPI] = useState<any[]>([])

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchReportData()
    }
  }, [dateRange, reportType])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const fromDate = dateRange.from ? startOfDay(dateRange.from).toISOString() : null
      const toDate = dateRange.to ? endOfDay(dateRange.to).toISOString() : null

      if (!fromDate || !toDate) {
        setLoading(false)
        return
      }

      // Fetch sales data
      const { data: salesDataFromAPI, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            *,
            products (
              category,
              name,
              serial_number
            )
          )
        `)
        .gte("created_at", fromDate)
        .lte("created_at", toDate)
        .eq("status", "completed")

      if (salesError) throw salesError

      setSalesDataFromAPI(salesDataFromAPI || [])
      processSalesData(salesDataFromAPI || [])
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const processSalesData = (sales: any[]) => {
    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.total_profit, 0)
    const totalTransactions = sales.length
    const avgOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

    setSummary({
      totalSales,
      totalProfit,
      totalTransactions,
      avgOrderValue,
    })

    // Process sales data for trend chart based on report type
    const aggregatedSales: { [key: string]: { date: string; sales: number; profit: number; transactions: number } } = {}

    sales.forEach((sale) => {
      let key: string
      let displayDate: string

      const saleDate = new Date(sale.created_at)

      if (reportType === "daily") {
        key = format(saleDate, "yyyy-MM-dd")
        displayDate = format(saleDate, "MMM dd")
      } else if (reportType === "weekly") {
        key = format(saleDate, "yyyy-ww") // Year and week number
        displayDate = `Week ${format(saleDate, "ww")}`
      } else {
        // monthly
        key = format(saleDate, "yyyy-MM")
        displayDate = format(saleDate, "MMM yyyy")
      }

      if (!aggregatedSales[key]) {
        aggregatedSales[key] = { date: displayDate, sales: 0, profit: 0, transactions: 0 }
      }
      aggregatedSales[key].sales += sale.total_amount
      aggregatedSales[key].profit += sale.total_profit
      aggregatedSales[key].transactions += 1
    })

    // Sort the aggregated data by key (date, week, or month)
    const sortedSalesData = Object.keys(aggregatedSales)
      .sort()
      .map((key) => aggregatedSales[key])

    setSalesData(sortedSalesData)

    // Process category data
    const categoryStats: any = {}
    const colors = ["#1E40AF", "#F97316", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]
    let colorIndex = 0

    sales.forEach((sale) => {
      sale.sale_items?.forEach((item: any) => {
        const category = item.products?.category || "Unknown"
        if (!categoryStats[category]) {
          categoryStats[category] = { name: category, value: 0, sales: 0, color: colors[colorIndex % colors.length] }
          colorIndex++
        }
        categoryStats[category].value += item.total_price
        categoryStats[category].sales += item.quantity
      })
    })

    const categoryArray = Object.values(categoryStats)
    setCategoryData(categoryArray)

    // Process top products
    const productStats: any = {}
    sales.forEach((sale) => {
      sale.sale_items?.forEach((item: any) => {
        const productId = item.product_id
        if (!productStats[productId]) {
          productStats[productId] = {
            name: item.products?.name || "Unknown",
            serial: item.products?.serial_number || "",
            quantity: 0,
            revenue: 0,
            profit: 0,
          }
        }
        productStats[productId].quantity += item.quantity
        productStats[productId].revenue += item.total_price
        productStats[productId].profit += item.profit_per_item * item.quantity // Assuming profit_per_item exists
      })
    })

    const topProductsArray = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)

    setTopProducts(topProductsArray)
  }

  const exportReport = () => {
    // This would implement PDF/Excel export
    console.log("Export functionality would be implemented here")
    alert("Export functionality is not yet implemented.")
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                      : "Select Date Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={exportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {summary.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Placeholder for percentage change, needs actual comparison data */}
                  <span className="text-green-600">+12.5%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {summary.totalProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Placeholder for percentage change */}
                  <span className="text-green-600">+8.2%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Placeholder for percentage change */}
                  <span className="text-green-600">+15.3%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {summary.avgOrderValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Placeholder for percentage change */}
                  <span className="text-red-600">-2.1%</span> from last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Sales and profit over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    sales: { label: "Sales", color: "#1E40AF" },
                    profit: { label: "Profit", color: "#F97316" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="sales" stroke="#1E40AF" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#F97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Revenue" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: KSh ${value.toLocaleString()}`}
                      >
                        {categoryData.map((entry, index) => (
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

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Best selling products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.serial}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">KSh {product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{product.quantity} sold</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No top performing products found for this period.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales transactions in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesData.length > 0 ? (
                  salesDataFromAPI.slice(0, 10).map(
                    (
                      transaction,
                      index, // Use the raw sales data for recent transactions
                    ) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Transaction #{transaction.id.substring(0, 8)}</p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(transaction.created_at), "MMM dd, hh:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">KSh {transaction.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{transaction.sale_items?.length || 0} items</p>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-gray-600">No recent transactions found for this period.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
