"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer, Download } from "lucide-react"
import type { Database } from "@/lib/supabase-types"
import { generateRealisticBarcodeImage } from "@/lib/offline-barcode-utils" // Import the updated utility
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components

type Product = Database["public"]["Tables"]["products"]["Row"]

interface BarcodeLabelPrinterProps {
  product: Product
}

export default function BarcodeLabelPrinter({ product }: BarcodeLabelPrinterProps) {
  const [labelSize, setLabelSize] = useState("40x20")
  const [quantity, setQuantity] = useState("1")
  const [isOpen, setIsOpen] = useState(false)

  const generateLabelHtml = (barcode: string, productName: string, sellingPrice: number, size: string) => {
    const [width, height] = size.split("x").map(Number) // e.g., 40, 20
    const barcodeSvg = generateRealisticBarcodeImage(barcode)

    return `
      <div style="
        width: ${width}mm; 
        height: ${height}mm; 
        border: 1px solid #ccc; 
        padding: 2mm;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        page-break-after: always;
        box-sizing: border-box;
        background: white;
      ">
        <div style="font-size: ${width > 40 ? "9px" : "7px"}; font-weight: bold; text-align: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%;">
          ${productName} - KSh ${sellingPrice.toLocaleString()}
        </div>
        <div style="text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center;">
          <img src="${barcodeSvg}" style="max-width: 90%; max-height: 80%; object-fit: contain;" alt="Barcode"/>
        </div>
      </div>
    `
  }

  const handlePrint = () => {
    const qty = Number.parseInt(quantity)
    let labelsHtml = ""

    for (let i = 0; i < qty; i++) {
      labelsHtml += generateLabelHtml(product.barcode, product.name, product.selling_price, labelSize)
    }

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode Labels - ${product.name}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 5mm; }
              }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                display: flex;
                flex-wrap: wrap;
                gap: 2mm; /* Gap between labels */
              }
            </style>
          </head>
          <body>
            ${labelsHtml}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    setIsOpen(false)
  }

  const handleDownload = () => {
    const labelHtml = generateLabelHtml(product.barcode, product.name, product.selling_price, labelSize)
    const blob = new Blob(
      [
        `
      <html>
        <head>
          <title>Barcode Label - ${product.name}</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>${labelHtml}</body>
      </html>
    `,
      ],
      { type: "text/html" },
    )

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `barcode-label-${product.barcode}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const currentBarcodeImage = product.barcode
    ? generateRealisticBarcodeImage(product.barcode)
    : "/placeholder.svg?height=80&width=200"

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {" "}
                {/* Changed to ghost and sm for consistency with other icons */}
                <Printer className="w-4 h-4" /> {/* Removed mr-2 as it's icon-only */}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Print Label</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Barcode Label</DialogTitle>
            <DialogDescription>Generate printable barcode labels for {product.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Label Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Label Preview</h4>
              <div
                className="border border-gray-300 bg-white mx-auto flex flex-col items-center justify-between p-2"
                style={{ width: "120px", height: "60px" }}
              >
                <div className="text-xs font-bold text-center truncate w-full">
                  {product.name} - KSh {product.selling_price.toLocaleString()}
                </div>
                <div className="flex-grow flex items-center justify-center">
                  <img
                    src={currentBarcodeImage || "/placeholder.svg"}
                    alt="Barcode Preview"
                    className="max-w-full max-h-full object-contain"
                    style={{ imageRendering: "crisp-edges" }}
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labelSize">Label Size</Label>
                <Select value={labelSize} onValueChange={setLabelSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="40x20">40mm x 20mm</SelectItem>
                    <SelectItem value="50x25">50mm x 25mm</SelectItem>
                    <SelectItem value="60x30">60mm x 30mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Labels
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
