"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  Smartphone,
  Printer,
  Download,
  Share,
  Camera,
  Package,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import AuthGuard from "@/components/auth-guard"
import { createClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase-types"
import { useRouter } from "next/navigation"
import OfflineOCRScanner from "@/components/offline-ocr-scanner"
import { ImageCarousel } from "@/components/image-carousel"
import { useUserRole } from "@/hooks/use-user-role"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface CartItem extends Product {
  quantity: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    sale: any
    saleItems: any[]
  } | null>(null)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanMode, setScanMode] = useState<"manual" | "scan">("manual")
  const [businessName, setBusinessName] = useState<string>("Bootyque")

  const categories = ["Dresses", "Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Bags", "Jewelry"]

  const { isAdmin, loading: roleLoading } = useUserRole()

  useEffect(() => {
    fetchProducts()
    ensureUserExists()
    fetchBusinessName()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter])

  const fetchBusinessName = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("tenant_id, tenants(name)")
          .eq("id", user.id)
          .single()

        if (userData?.tenants) {
          setBusinessName((userData.tenants as any).name || "Bootyque")
        }
      }
    } catch (error) {
      console.error("Error fetching business name:", error)
    }
  }

  const ensureUserExists = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) return

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (checkError && checkError.code === "PGRST116") {
        const { error: createUserError } = await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email!,
            role: "admin",
          },
        ])

        if (createUserError) {
          console.error("Error creating user:", createUserError)
        }
      }
    } catch (error) {
      console.error("Error ensuring user exists:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .gt("stock_quantity", 0)
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        if (existingItem.quantity < product.stock_quantity) {
          return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        }
        return prevCart
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: Math.min(newQuantity, item.stock_quantity) } : item,
      ),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.selling_price) * Number(item.quantity), 0)
    const tax = subtotal * 0.18 // 18% VAT
    const total = subtotal + tax
    const profit = cart.reduce(
      (sum, item) => sum + (Number(item.selling_price) - Number(item.buying_price)) * Number(item.quantity),
      0,
    )

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    }
  }

  const processPayment = async () => {
    if (cart.length === 0) return

    setProcessing(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("User not authenticated")
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      if (!existingUser) {
        const { error: createUserError } = await supabase.from("users").upsert(
          {
            id: user.id,
            email: user.email!,
            role: "admin",
          },
          {
            onConflict: "id",
          },
        )

        if (createUserError) {
          console.error("Error creating user:", createUserError)
          throw new Error("Failed to create user record. Please contact support.")
        }
      }

      const totals = calculateTotals()

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            user_id: user.id,
            total_amount: Number(totals.total.toFixed(2)),
            total_profit: Number(totals.profit.toFixed(2)),
            payment_method: paymentMethod,
            status: "completed",
          },
        ])
        .select()
        .single()

      if (saleError) throw saleError

      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: Number(item.quantity),
        unit_price: Number(item.selling_price.toFixed(2)),
        total_price: Number((item.selling_price * item.quantity).toFixed(2)),
        profit_per_item: Number((item.selling_price - item.buying_price).toFixed(2)),
        products: item,
      }))

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems.map(({ products, ...item }) => item))

      if (itemsError) throw itemsError

      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq("id", item.id)

        if (stockError) throw stockError
      }

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      setReceiptData({
        sale,
        saleItems,
      })

      clearCart()
      setIsCheckoutOpen(false)

      setShowReceiptDialog(true)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert(`Error processing payment: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const totals = calculateTotals()

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("receipt-content")
    if (printContent) {
      const printWindow = window.open("", "_blank")
      printWindow?.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .right { text-align: right; }
              .border-dashed { border-bottom: 1px dashed #000; margin: 10px 0; }
              .flex { display: flex; justify-content: space-between; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `)
      printWindow?.document.close()
      printWindow?.print()
    }
  }

  const handleDownloadReceipt = () => {
    console.log("Download PDF functionality would be implemented here")
    alert("Download feature will be implemented soon!")
  }

  const handleShareReceipt = () => {
    if (navigator.share && receiptData) {
      const receiptNumber = `RCP-${new Date(receiptData.sale.created_at).toISOString().slice(0, 10).replace(/-/g, "")}-${receiptData.sale.id.slice(-3).toUpperCase()}`
      navigator.share({
        title: `Receipt #${receiptNumber}`,
        text: `Receipt from ${businessName} - Total: KSh ${receiptData.sale.total_amount.toLocaleString()}`,
      })
    } else {
      if (receiptData) {
        const receiptText = `Receipt from ${businessName}\nTotal: KSh ${receiptData.sale.total_amount.toLocaleString()}\nDate: ${new Date(receiptData.sale.created_at).toLocaleString()}`
        navigator.clipboard.writeText(receiptText)
        alert("Receipt details copied to clipboard!")
      }
    }
  }

  const handleBarcodeScanned = async (barcode: string) => {
    console.log("Scanning barcode:", barcode)

    try {
      const supabase = createClient()

      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", barcode.trim())
        .eq("status", "active")
        .single()

      console.log("Query result:", { product, error })

      if (error) {
        console.error("Database error:", error)

        const { data: similarProducts } = await supabase
          .from("products")
          .select("barcode, name")
          .ilike("barcode", `%${barcode}%`)
          .limit(3)

        console.log("Similar barcodes found:", similarProducts)

        if (similarProducts && similarProducts.length > 0) {
          alert(
            `Product not found. Similar barcodes: ${similarProducts.map((p) => `${p.barcode} (${p.name})`).join(", ")}`,
          )
        } else {
          alert(`Product with barcode ${barcode} not found in database`)
        }
        return
      }

      if (!product) {
        alert("Product not found or out of stock")
        return
      }

      if (product.stock_quantity <= 0) {
        alert(`${product.name} is out of stock`)
        return
      }

      addToCart(product)

      const successDiv = document.createElement("div")
      successDiv.className = "fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
      successDiv.textContent = `${product.name} added to cart!`
      document.body.appendChild(successDiv)

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv)
        }
      }, 2000)
    } catch (error) {
      console.error("Error processing scanned barcode:", error)
      alert(`Error processing barcode: ${error.message}`)
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#5A4A3A]">Point of Sale</h1>
                <p className="text-[#8B7355]">Select items to add to cart</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={scanMode === "manual" ? "default" : "outline"}
                onClick={() => setScanMode("manual")}
                className="flex-1"
              >
                🔍 Manual Search
              </Button>
              <Button
                variant={scanMode === "scan" ? "default" : "outline"}
                onClick={() => {
                  setScanMode("scan")
                  setShowScanner(true)
                }}
                className="flex-1"
              >
                📷 Barcode Scanning
              </Button>
            </div>

            {scanMode === "manual" && (
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, barcode, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scanMode === "scan" && (
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#5A4A3A] mb-2">Offline Barcode Scanning Mode</h3>
                <p className="text-[#8B7355] mb-4">Use your camera to scan product barcodes (works without internet)</p>
                <Button onClick={() => setShowScanner(true)} size="lg" className="bg-[#7D9B7F] hover:bg-[#6B8A6D]">
                  <Camera className="w-5 h-5 mr-2" />
                  Start Offline Scanning
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-[#E5DCC8] overflow-hidden"
                >
                  <div className="relative h-40 bg-gray-100">
                    <ImageCarousel images={product.image_urls || []} alt={product.name} className="w-full h-full" />
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{product.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 font-mono">{product.barcode}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">KSh {product.selling_price.toLocaleString()}</span>
                        <span className="text-xs text-gray-600">Stock: {product.stock_quantity}</span>
                      </div>
                      <Button
                        onClick={() => addToCart(product)}
                        className="w-full bg-[#7D9B7F] hover:bg-[#6B8A6D]"
                        size="sm"
                        disabled={product.stock_quantity === 0}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="h-full flex flex-col border-[#E5DCC8]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart Items
                  <Badge variant="secondary">{cart.length}</Badge>
                </CardTitle>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    Clear Cart
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Your cart is empty</p>
                      <p className="text-sm text-gray-500">Add items to get started</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                            {item.image_urls && item.image_urls.length > 0 ? (
                              <img
                                src={item.image_urls[0] || "/placeholder.svg"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-600">{item.serial_number}</p>
                            <p className="text-sm font-medium">KSh {item.selling_price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock_quantity}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>KSh {totals.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (18%):</span>
                        <span>KSh {totals.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>KSh {totals.total.toLocaleString()}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex justify-between text-sm text-[#7D9B7F]">
                          <span>Profit:</span>
                          <span>KSh {totals.profit.toLocaleString()}</span>
                        </div>
                      )}
                      <Button
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full mt-4 bg-[#7D9B7F] hover:bg-[#6B8A6D]"
                        size="lg"
                      >
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>Review your order and select payment method</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Order Summary</h4>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>KSh {(item.selling_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>KSh {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>KSh {totals.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>KSh {totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Payment Method</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === "mpesa" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("mpesa")}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    M-Pesa
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={processing}
                  className="flex-1 bg-[#7D9B7F] hover:bg-[#6B8A6D]"
                >
                  {processing ? "Processing..." : "Complete Sale"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-[#7D9B7F] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-[#7D9B7F] rounded-full"></div>
            </div>
            <span className="font-medium">Sale completed successfully!</span>
          </div>
        )}

        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-lg">Receipt</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareReceipt}>
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {receiptData && (
                  <div id="receipt-content" className="font-mono text-sm space-y-4">
                    <div className="text-center space-y-1">
                      <h1 className="text-lg font-bold uppercase">{businessName}</h1>
                      <p className="text-xs italic">Effortless Style. Perfected Sales</p>
                      <div className="border-b border-dashed my-4"></div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Receipt #:</span>
                        <span>
                          RCP-{new Date(receiptData.sale.created_at).toISOString().slice(0, 10).replace(/-/g, "")}-
                          {receiptData.sale.id.slice(-3).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(receiptData.sale.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Served by:</span>
                        <span>Admin User</span>
                      </div>
                      <div className="border-b border-dashed my-4"></div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-2">
                        <span>ITEM</span>
                        <span>QTY</span>
                        <span>AMOUNT</span>
                      </div>
                      <div className="border-b border-dashed mb-2"></div>

                      {receiptData.saleItems.map((item, index) => (
                        <div key={index} className="mb-2">
                          <div className="flex justify-between">
                            <span className="flex-1 truncate pr-2">{item.products.name}</span>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <span className="w-16 text-right">KSh {item.total_price.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">({item.products.serial_number})</div>
                        </div>
                      ))}

                      <div className="border-b border-dashed my-4"></div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>KSh {(receiptData.sale.total_amount / 1.18).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (18%):</span>
                        <span>
                          KSh {(receiptData.sale.total_amount - receiptData.sale.total_amount / 1.18).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL:</span>
                        <span>KSh {receiptData.sale.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="border-b border-dashed my-4"></div>
                    </div>

                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="capitalize">{receiptData.sale.payment_method}</span>
                    </div>

                    <div className="text-center text-xs mt-6 space-y-2">
                      <p>Thank you for shopping with us!</p>
                      <p>Visit us again soon</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showScanner && (
          <OfflineOCRScanner onBarcodeScanned={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
