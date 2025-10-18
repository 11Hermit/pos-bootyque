"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, Filter, RefreshCw } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import AuthGuard from "@/components/auth-guard"
import { createClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase-types"
import { ImageUpload } from "@/components/image-upload"
import { ImageCarousel } from "@/components/image-carousel"
import BulkLabelPrinter from "@/components/bulk-label-printer"

import { generateCategoryBarcode, generateRealisticBarcodeImage } from "@/lib/offline-barcode-utils"
import BarcodeLabelPrinter from "@/components/barcode-label-printer"
import { useUserRole } from "@/hooks/use-user-role"

type Product = Database["public"]["Tables"]["products"]["Row"]

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    buying_price: "",
    selling_price: "",
    stock_quantity: "",
    min_stock_level: "5",
    barcode: "",
    barcode_image_url: "",
    image_urls: [] as string[],
  })

  const categories = ["Dresses", "Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Bags", "Jewelry"]

  const { isAdmin, loading: roleLoading } = useUserRole()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, stockFilter])

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

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
          product.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    if (stockFilter !== "all") {
      filtered = filtered.filter((product) => {
        if (stockFilter === "in-stock") return product.stock_quantity > product.min_stock_level
        if (stockFilter === "low-stock")
          return product.stock_quantity <= product.min_stock_level && product.stock_quantity > 0
        if (stockFilter === "out-of-stock") return product.stock_quantity === 0
        return true
      })
    }

    setFilteredProducts(filtered)
  }

  // Generate professional barcode based on category
  const generateNewBarcode = () => {
    if (!newProduct.category) {
      alert("Please select a category first")
      return
    }

    const barcode = generateCategoryBarcode(newProduct.category)
    const imageUrl = generateRealisticBarcodeImage(barcode)

    setNewProduct((prev) => ({
      ...prev,
      barcode,
      barcode_image_url: imageUrl,
    }))
  }

  // Auto-generate barcode when category changes
  useEffect(() => {
    if (newProduct.category && isAddDialogOpen) {
      const barcode = generateCategoryBarcode(newProduct.category)
      const imageUrl = generateRealisticBarcodeImage(barcode)

      setNewProduct((prev) => ({
        ...prev,
        barcode,
        barcode_image_url: imageUrl,
      }))
    }
  }, [newProduct.category, isAddDialogOpen])

  const handleAddProduct = async () => {
    try {
      const supabase = createClient()

      // Generate a serial number for backward compatibility
      const serialNumber = `${newProduct.category.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}`

      const { error } = await supabase.from("products").insert([
        {
          serial_number: serialNumber,
          barcode: newProduct.barcode,
          barcode_image_url: newProduct.barcode_image_url,
          name: newProduct.name,
          description: newProduct.description,
          category: newProduct.category,
          buying_price: Number.parseFloat(newProduct.buying_price),
          selling_price: Number.parseFloat(newProduct.selling_price),
          stock_quantity: Number.parseInt(newProduct.stock_quantity),
          min_stock_level: Number.parseInt(newProduct.min_stock_level),
          image_urls: newProduct.image_urls,
        },
      ])

      if (error) throw error

      setIsAddDialogOpen(false)
      setNewProduct({
        name: "",
        description: "",
        category: "",
        buying_price: "",
        selling_price: "",
        stock_quantity: "",
        min_stock_level: "5",
        barcode: "",
        barcode_image_url: "",
        image_urls: [],
      })
      fetchProducts()
    } catch (error) {
      console.error("Error adding product:", error)
      alert(`Error adding product: ${error.message}`)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    setUpdateSuccess(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          category: editingProduct.category,
          buying_price: Number(editingProduct.buying_price),
          selling_price: Number(editingProduct.selling_price),
          stock_quantity: Number(editingProduct.stock_quantity),
          min_stock_level: Number(editingProduct.min_stock_level),
          image_urls: editingProduct.image_urls || [],
        })
        .eq("id", editingProduct.id)

      if (error) throw error

      setShowUpdateSuccess(true)

      setTimeout(() => {
        setEditingProduct(null)
        setUpdateSuccess(false)
        setShowUpdateSuccess(false)
        fetchProducts()
      }, 1000)
    } catch (error) {
      console.error("Error updating product:", error)
      alert("Error updating product. Please try again.")
      setUpdateSuccess(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { status: "Out of Stock", color: "destructive" as const }
    if (product.stock_quantity <= product.min_stock_level) return { status: "Low Stock", color: "secondary" as const }
    return { status: "In Stock", color: "default" as const }
  }

  if (loading || roleLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage your thrift store inventory</p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <BulkLabelPrinter products={filteredProducts} />
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-900 hover:bg-blue-800">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>Enter the details for the new product</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="e.g., Vintage Denim Jacket"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newProduct.category}
                          onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label className="text-base font-semibold">Product Images</Label>
                        <p className="text-sm text-muted-foreground">
                          Add up to 3 photos showing different views of the product
                        </p>
                        <ImageUpload
                          images={newProduct.image_urls}
                          onImagesChange={(images) => setNewProduct({ ...newProduct, image_urls: images })}
                          maxImages={3}
                        />
                      </div>

                      {/* Professional Barcode Section - Enhanced */}
                      <div className="col-span-2 space-y-4">
                        <Label className="text-base font-semibold">Professional Barcode</Label>
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                          {newProduct.barcode ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-mono text-xl font-bold text-gray-900">{newProduct.barcode}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    EAN-13 • Kenya • {newProduct.category} Category
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={generateNewBarcode}
                                  className="flex items-center gap-2 bg-white hover:bg-gray-50"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Regenerate
                                </Button>
                              </div>

                              {/* Realistic Barcode Preview */}
                              {newProduct.barcode_image_url && (
                                <div className="flex justify-center">
                                  <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                                    <img
                                      src={newProduct.barcode_image_url || "/placeholder.svg"}
                                      alt="Professional Barcode Preview"
                                      className="max-w-full h-auto"
                                      style={{ imageRendering: "crisp-edges" }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 text-center">✓ Ready for scanning and printing</div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <div className="font-medium">Select a category to generate professional barcode</div>
                              <div className="text-sm mt-1">
                                Barcode will be automatically created with Kenya country code
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          placeholder="Product description"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock_quantity}
                          onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min">Min Stock Level</Label>
                        <Input
                          id="min"
                          type="number"
                          value={newProduct.min_stock_level}
                          onChange={(e) => setNewProduct({ ...newProduct, min_stock_level: e.target.value })}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="buying">Buying Price (KSh)</Label>
                        <Input
                          id="buying"
                          type="number"
                          step="0.01"
                          value={newProduct.buying_price}
                          onChange={(e) => setNewProduct({ ...newProduct, buying_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="selling">Selling Price (KSh)</Label>
                        <Input
                          id="selling"
                          type="number"
                          step="0.01"
                          value={newProduct.selling_price}
                          onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddProduct}
                        disabled={!newProduct.barcode || !newProduct.name || !newProduct.category}
                        className="bg-blue-900 hover:bg-blue-800"
                      >
                        Add Product
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
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
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-600 flex items-center">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product)
              const profit = product.selling_price - product.buying_price

              return (
                <Card key={product.id} className="relative overflow-hidden">
                  <div className="relative h-48 bg-gray-100">
                    <ImageCarousel images={product.image_urls || []} alt={product.name} className="w-full h-full" />
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>
                          {product.barcode ? `Barcode: ${product.barcode}` : `Serial: ${product.serial_number}`}
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>Update product details</DialogDescription>
                              </DialogHeader>
                              {editingProduct && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2 space-y-2">
                                    <Label className="text-base font-semibold">Product Images</Label>
                                    <ImageUpload
                                      images={editingProduct.image_urls || []}
                                      onImagesChange={(images) =>
                                        setEditingProduct({ ...editingProduct, image_urls: images })
                                      }
                                      maxImages={3}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Barcode</Label>
                                    <Input value={editingProduct.barcode || editingProduct.serial_number} disabled />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input
                                      value={editingProduct.name}
                                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                  </div>
                                  <div className="col-span-2 space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                      value={editingProduct.description || ""}
                                      onChange={(e) =>
                                        setEditingProduct({ ...editingProduct, description: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                      value={editingProduct.category}
                                      onValueChange={(value) =>
                                        setEditingProduct({ ...editingProduct, category: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Stock Quantity</Label>
                                    <Input
                                      type="number"
                                      value={editingProduct.stock_quantity}
                                      onChange={(e) =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          stock_quantity: Number.parseInt(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Buying Price (KSh)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingProduct.buying_price}
                                      onChange={(e) =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          buying_price: Number.parseFloat(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Selling Price (KSh)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingProduct.selling_price}
                                      onChange={(e) =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          selling_price: Number.parseFloat(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Min Stock Level</Label>
                                    <Input
                                      type="number"
                                      value={editingProduct.min_stock_level}
                                      onChange={(e) =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          min_stock_level: Number.parseInt(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleEditProduct} disabled={updateSuccess}>
                                  {updateSuccess ? "Updated!" : "Update Product"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <BarcodeLabelPrinter product={product} />
                        </div>
                      )}
                      {!isAdmin && (
                        <div className="flex gap-1">
                          <BarcodeLabelPrinter product={product} />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{product.barcode ? "Barcode:" : "Serial:"}</span>
                        <span className="font-mono text-sm">{product.barcode || product.serial_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Stock:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.stock_quantity}</span>
                          <Badge variant={stockStatus.color}>{stockStatus.status}</Badge>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Buy:</span>
                          <span className="font-medium">KSh {product.buying_price.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sell:</span>
                        <span className="font-medium">KSh {product.selling_price.toLocaleString()}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Profit:</span>
                          <span className="font-medium text-green-600">KSh {profit.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  {product.stock_quantity <= product.min_stock_level && (
                    <div className="absolute top-2 right-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                {isAdmin && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        {showUpdateSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span className="font-medium">Product updated successfully!</span>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
