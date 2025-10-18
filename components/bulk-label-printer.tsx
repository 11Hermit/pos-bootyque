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
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, Download, Plus, Trash2 } from "lucide-react"
import type { Database } from "@/lib/supabase-types"
import { generateRealisticBarcodeImage } from "@/lib/offline-barcode-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface BulkLabelPrinterProps {
  products: Product[]
}

interface SelectedProduct {
  product: Product
  quantity: number
}

export default function BulkLabelPrinter({ products }: BulkLabelPrinterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [labelSize, setLabelSize] = useState("40x20")
  const [isGenerating, setIsGenerating] = useState(false)

  const addProduct = (product: Product) => {
    const exists = selectedProducts.find((sp) => sp.product.id === product.id)
    if (!exists) {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((sp) => sp.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map((sp) => (sp.product.id === productId ? { ...sp, quantity: Math.max(1, quantity) } : sp)),
    )
  }

  const generatePrintHtml = (barcode: string, productName: string, sellingPrice: number, size: string) => {
    const [width, height] = size.split("x").map(Number)
    const barcodeSvg = generateRealisticBarcodeImage(barcode)

    const fontSizeMultiplier = width / 40
    const productFontSize = Math.max(6, 6 * fontSizeMultiplier)
    const barcodeFontSize = Math.max(5, 5 * fontSizeMultiplier)

    return `
      <div class="label" style="
        width: ${width}mm; 
        height: ${height}mm; 
        border: 1px solid #333; 
        padding: 1mm;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        box-sizing: border-box;
        background: white;
        flex-shrink: 0;
        gap: 0.5mm;
      ">
        <div style="
          font-size: ${productFontSize}px; 
          font-weight: bold; 
          text-align: center; 
          color: #000;
          line-height: 1.1;
          white-space: nowrap;
          width: 100%;
          flex-shrink: 0;
          padding: 0.3mm 0;
          background: white;
          z-index: 10;
          position: relative;
        ">
          ${productName} - KSh ${sellingPrice.toLocaleString()}
        </div>
        <div style="
          text-align: center; 
          flex-grow: 1; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          width: 100%;
          min-height: 0;
          background: white;
          overflow: hidden;
        ">
          <img src="${barcodeSvg}" style="
            max-width: 95%; 
            max-height: 95%; 
            object-fit: contain;
            image-rendering: crisp-edges;
          " alt="Barcode"/>
        </div>
        <div style="
          font-size: ${barcodeFontSize}px; 
          text-align: center; 
          color: #333;
          font-family: monospace;
          letter-spacing: 0.3px;
          width: 100%;
          white-space: nowrap;
          flex-shrink: 0;
          line-height: 1;
          background: white;
          z-index: 10;
          position: relative;
          padding: 0.2mm 0;
        ">
          ${barcode}
        </div>
      </div>
    `
  }

  const generatePDF = async (download = false) => {
    setIsGenerating(true)
    try {
      // Dynamically import jsPDF and html2canvas
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas")).default

      const [labelWidth, labelHeight] = labelSize.split("x").map(Number)

      // Calculate grid layout for A4 page (210mm x 297mm)
      const pageWidth = 210
      const pageHeight = 297
      const marginMm = 5
      const gapMm = 2

      const availableWidth = pageWidth - marginMm * 2
      const availableHeight = pageHeight - marginMm * 2

      const labelsPerRow = Math.floor((availableWidth + gapMm) / (labelWidth + gapMm))
      const labelsPerColumn = Math.floor((availableHeight + gapMm) / (labelHeight + gapMm))
      const labelsPerPage = labelsPerRow * labelsPerColumn

      // Create temporary container for rendering
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.width = `${pageWidth}mm`
      container.style.padding = `${marginMm}mm`
      container.style.boxSizing = "border-box"
      container.style.display = "flex"
      container.style.flexWrap = "wrap"
      container.style.gap = `${gapMm}mm`
      container.style.backgroundColor = "white"

      // Generate all labels
      let labelCount = 0
      selectedProducts.forEach(({ product, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          const labelDiv = document.createElement("div")
          labelDiv.innerHTML = generatePrintHtml(product.barcode, product.name, product.selling_price, labelSize)
          container.appendChild(labelDiv.firstElementChild as HTMLElement)
          labelCount++
        }
      })

      document.body.appendChild(container)

      // Convert to canvas and create PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      document.body.removeChild(container)

      // Calculate PDF dimensions based on canvas
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      let yPosition = 0
      let pageCount = 1
      const imgData = canvas.toDataURL("image/png")

      // Add images to PDF, creating new pages as needed
      while (yPosition < imgHeight) {
        if (yPosition > 0) {
          pdf.addPage()
          pageCount++
        }
        pdf.addImage(imgData, "PNG", 0, -yPosition, imgWidth, imgHeight)
        yPosition += pageHeight
      }

      // Download or print
      const filename = `bulk-barcode-labels-${new Date().toISOString().slice(0, 10)}.pdf`
      if (download) {
        pdf.save(filename)
      } else {
        const pdfUrl = pdf.output("bloburi")
        const printWindow = window.open(pdfUrl as string)
        if (printWindow) {
          printWindow.print()
        }
      }

      setIsOpen(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => generatePDF(false)
  const handleDownload = () => generatePDF(true)

  const totalLabels = selectedProducts.reduce((sum, sp) => sum + sp.quantity, 0)

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Print Labels
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bulk print barcode labels</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Print Barcode Labels</DialogTitle>
            <DialogDescription>Select products and quantities to print labels in one document</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Products</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {products.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-2">No products available</p>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition"
                      onClick={() => addProduct(product)}
                    >
                      <Checkbox
                        checked={selectedProducts.some((sp) => sp.product.id === product.id)}
                        onCheckedChange={() => addProduct(product)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.name}</div>
                        <div className="text-xs text-gray-500 truncate">{product.barcode}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Products with Quantities */}
            {selectedProducts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Selected Products & Quantities</Label>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {selectedProducts.map(({ product, quantity }) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">KSh {product.selling_price.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={quantity}
                            onChange={(e) => updateQuantity(product.id, Number.parseInt(e.target.value))}
                            className="w-16 text-center"
                          />
                          <span className="text-sm text-gray-600 w-12">labels</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Label Settings */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Label Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="labelSize">Label Size</Label>
                  <Select value={labelSize} onValueChange={setLabelSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="40x20">40mm x 20mm (10-15 per page)</SelectItem>
                      <SelectItem value="50x25">50mm x 25mm (8-12 per page)</SelectItem>
                      <SelectItem value="60x30">60mm x 30mm (6-10 per page)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Labels</Label>
                  <div className="flex items-center justify-center h-10 bg-blue-50 rounded-md border border-blue-200">
                    <span className="font-semibold text-blue-900">{totalLabels}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {selectedProducts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Preview (First Label)</Label>
                <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                  <div
                    className="border border-gray-300 bg-white flex flex-col items-center justify-between p-2"
                    style={{ width: "120px", height: "60px" }}
                  >
                    <div className="text-xs font-bold text-center truncate w-full">
                      {selectedProducts[0].product.name} - KSh{" "}
                      {selectedProducts[0].product.selling_price.toLocaleString()}
                    </div>
                    <div className="flex-grow flex items-center justify-center">
                      <img
                        src={generateRealisticBarcodeImage(selectedProducts[0].product.barcode) || "/placeholder.svg"}
                        alt="Barcode Preview"
                        className="max-w-full max-h-full object-contain"
                        style={{ imageRendering: "crisp-edges" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handlePrint}
                disabled={selectedProducts.length === 0 || isGenerating}
                className="flex-1 bg-blue-900 hover:bg-blue-800"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Print All Labels"}
              </Button>
              <Button
                onClick={handleDownload}
                disabled={selectedProducts.length === 0 || isGenerating}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
