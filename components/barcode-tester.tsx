"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"
import { createClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase-types"

type Product = Database["public"]["Tables"]["products"]["Row"]

export default function BarcodeTester() {
  const [testBarcode, setTestBarcode] = useState("2000591790326")
  const [searchResult, setSearchResult] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allBarcodes, setAllBarcodes] = useState<Array<{ barcode: string; name: string }>>([])

  const testBarcodeSearch = async () => {
    setLoading(true)
    setError(null)
    setSearchResult(null)

    try {
      const supabase = createClient()

      // First get all barcodes for reference
      const { data: barcodes } = await supabase
        .from("products")
        .select("barcode, name")
        .order("created_at", { ascending: false })
        .limit(10)

      setAllBarcodes(barcodes || [])

      // Search for the specific barcode
      const { data: product, error: searchError } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", testBarcode.trim())
        .single()

      if (searchError) {
        setError(`Database error: ${searchError.message}`)
        console.error("Search error:", searchError)
      } else if (product) {
        setSearchResult(product)
      } else {
        setError("No product found with this barcode")
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      console.error("Test error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Barcode Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter barcode to test"
            value={testBarcode}
            onChange={(e) => setTestBarcode(e.target.value)}
            className="font-mono"
          />
          <Button onClick={testBarcodeSearch} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Searching..." : "Test"}
          </Button>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}

        {searchResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">✅ Product Found!</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Name:</strong> {searchResult.name}
              </div>
              <div>
                <strong>Barcode:</strong> <code>{searchResult.barcode}</code>
              </div>
              <div>
                <strong>Stock:</strong> {searchResult.stock_quantity}
              </div>
              <div>
                <strong>Price:</strong> KSh {searchResult.selling_price.toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <Badge variant={searchResult.status === "active" ? "default" : "secondary"}>
                  {searchResult.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Recent Barcodes in Database:</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {allBarcodes.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="font-mono">{item.barcode}</span>
                <span className="text-gray-600 truncate ml-2">{item.name}</span>
                <Button size="sm" variant="ghost" onClick={() => setTestBarcode(item.barcode)} className="ml-2">
                  Test
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
