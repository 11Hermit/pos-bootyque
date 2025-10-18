"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Download, Share, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase-types"

type Sale = Database["public"]["Tables"]["sales"]["Row"]
type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"] & {
  products: Database["public"]["Tables"]["products"]["Row"]
}

interface ReceiptPageProps {
  params: {
    id: string
  }
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
  const [sale, setSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchReceiptData()
  }, [params.id])

  const fetchReceiptData = async () => {
    try {
      const supabase = createClient()

      // Fetch sale data
      const { data: saleData, error: saleError } = await supabase.from("sales").select("*").eq("id", params.id).single()

      if (saleError) throw saleError
      setSale(saleData)

      // Fetch sale items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("sale_items")
        .select(`
          *,
          products (*)
        `)
        .eq("sale_id", params.id)

      if (itemsError) throw itemsError
      setSaleItems(itemsData as SaleItem[])
    } catch (error) {
      console.error("Error fetching receipt data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // This would implement PDF generation
    console.log("Download PDF functionality would be implemented here")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt #${sale?.id.slice(-8).toUpperCase()}`,
        text: `Receipt from Alfire Spares & Accessories`,
        url: window.location.href,
      })
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Receipt Not Found</h1>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = sale.total_amount / 1.18 // Remove 18% tax
  const tax = sale.total_amount - subtotal
  const receiptNumber = `RCP-${new Date(sale.created_at).toISOString().slice(0, 10).replace(/-/g, "")}-${sale.id.slice(-3).toUpperCase()}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
      <div className="bg-white shadow-sm p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/pos">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to POS
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto p-4">
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-6 font-mono text-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-bold">Bootyque</h1>
              <p className="text-xs">Effortless Style, Perfect Sales!</p>
              <div className="border-b border-dashed my-4"></div>
            </div>

            {/* Receipt Info */}
            <div className="mb-4 space-y-1">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(sale.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Served by:</span>
                <span>Admin User</span>
              </div>
              <div className="border-b border-dashed my-4"></div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="flex justify-between font-bold mb-2">
                <span>ITEM</span>
                <span>QTY</span>
                <span>AMOUNT</span>
              </div>
              <div className="border-b border-dashed mb-2"></div>

              {saleItems.map((item) => (
                <div key={item.id} className="mb-2">
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

            {/* Totals */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>KSh {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%):</span>
                <span>KSh {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span>KSh {sale.total_amount.toLocaleString()}</span>
              </div>
              <div className="border-b border-dashed my-4"></div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{sale.payment_method}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs mt-6">
              <p>Thank you for your business!</p>
              <p className="mt-2">Visit us again soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
        }
      `}</style>
    </div>
  )
}
