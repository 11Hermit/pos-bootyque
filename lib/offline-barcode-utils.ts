// Pure JavaScript barcode generation (no external services)

// This class encapsulates the core barcode generation logic.
class OfflineBarcodeGeneratorInternal {
  static generateEAN13BaseCode(): string {
    // Generate 12-digit code (13th is check digit)
    const prefix = "254" // Kenya country code
    // Use a combination of timestamp and random for uniqueness
    const timestampPart = Date.now().toString().slice(-7) // Last 7 digits of timestamp
    const randomPart = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0") // 3 random digits

    // Combine to get 10 digits for the product code part (13 - 3 for prefix)
    const productCode = (timestampPart + randomPart).slice(-10)

    return prefix + productCode
  }

  static calculateEAN13CheckDigit(code12: string): string {
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = Number.parseInt(code12[i])
      sum += i % 2 === 0 ? digit : digit * 3
    }
    return ((10 - (sum % 10)) % 10).toString()
  }

  static generateBarcodeImage(barcodeNumber: string): string {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Set canvas size
    canvas.width = 350
    canvas.height = 100 // Adjusted height after removing the "Manual" line

    if (!ctx) {
      throw new Error("Canvas context is not available.")
    }

    // White background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw simplified barcode lines
    ctx.fillStyle = "black"
    const barWidth = 1.5 // Adjusted for better visual

    // Ensure barcodeNumber is 13 digits for consistent formatting
    let paddedBarcodeNumber = barcodeNumber
    if (paddedBarcodeNumber.length < 13) {
      // Pad with leading zeros if it's shorter than expected
      paddedBarcodeNumber = paddedBarcodeNumber.padStart(13, "0")
    } else if (paddedBarcodeNumber.length > 13) {
      // If it's longer, truncate it for display purposes
      paddedBarcodeNumber = paddedBarcodeNumber.substring(0, 13)
    }

    // Calculate total width of the bars for centering
    let estimatedBarcodeContentWidth = 0
    const barGap = 0.5 // Gap between bars within a digit
    const digitGap = 2 // Gap between digits

    // Start guard (3 bars + 2 gaps)
    estimatedBarcodeContentWidth += barWidth * 3 + barGap * 2

    // Digits (12 digits, each 4 bars + 3 barGaps + 1 digitGap)
    for (let i = 0; i < paddedBarcodeNumber.length; i++) {
      estimatedBarcodeContentWidth += barWidth * 4 + barGap * 3 + digitGap
      if (i === 5) {
        // Middle guard (5 bars + 4 gaps)
        estimatedBarcodeContentWidth += barWidth * 5 + barGap * 4
      }
    }

    // End guard (3 bars + 2 gaps)
    estimatedBarcodeContentWidth += barWidth * 3 + barGap * 2

    // Calculate starting x position for centering
    const startX = (canvas.width - estimatedBarcodeContentWidth) / 2
    let x = startX

    // Start guard pattern (101)
    ctx.fillRect(x, 10, barWidth, 55)
    x += barWidth + barGap
    ctx.fillRect(x, 10, barWidth, 55)
    x += barWidth + barGap
    ctx.fillRect(x, 10, barWidth, 55)
    x += barWidth + digitGap // Adjusted for initial digit gap

    // Draw bars for each digit (simplified pattern)
    for (let i = 0; i < paddedBarcodeNumber.length; i++) {
      const digit = Number.parseInt(paddedBarcodeNumber[i])

      // Simple bar pattern based on digit
      for (let j = 0; j < 4; j++) {
        if ((digit + j + i) % 3 !== 0) {
          ctx.fillRect(x, 10, barWidth, 50) // Normal bar height
        } else {
          // Simulate white space
          ctx.fillRect(x, 10, barWidth, 50)
          ctx.fillStyle = "white" // Draw white bar
          ctx.fillRect(x, 10, barWidth, 50)
          ctx.fillStyle = "black" // Reset color
        }
        x += barWidth + barGap // Small gap between bars
      }
      x += digitGap // Space between digits

      // Middle guard pattern (01010) after 6th digit
      if (i === 5) {
        ctx.fillRect(x, 10, barWidth, 55)
        x += barWidth + barGap
        ctx.fillRect(x, 10, barWidth, 55)
        x += barWidth + barGap
        ctx.fillRect(x, 10, barWidth, 55)
        x += barWidth + barGap
        ctx.fillRect(x, 10, barWidth, 55)
        x += barWidth + barGap
        ctx.fillRect(x, 10, barWidth, 55)
        x += barWidth + digitGap // Adjusted for next digit gap
      }
    }

    // End guard pattern (101)
    ctx.fillRect(x, 10, barWidth, 55)
    x += barWidth + barGap
    ctx.fillRect(x, 10, barWidth, 55)
    x += barWidth + barGap
    ctx.fillRect(x, 10, barWidth, 55)
    x += barWidth

    // Draw the numbers below (MOST IMPORTANT for OCR)
    ctx.fillStyle = "black"
    ctx.font = "bold 16px monospace" // Slightly larger font for OCR
    ctx.textAlign = "center"

    // Format with spaces for better OCR recognition
    const formattedNumber =
      paddedBarcodeNumber.substring(0, 1) +
      " " +
      paddedBarcodeNumber.substring(1, 7) +
      " " +
      paddedBarcodeNumber.substring(7, 13)

    ctx.fillText(formattedNumber, canvas.width / 2, 80) // Adjusted Y position to be below bars

    return canvas.toDataURL("image/png")
  }
}

// Exported functions to match previous interface and provide new ones
export function generateEAN13Barcode(): string {
  const baseCode = OfflineBarcodeGeneratorInternal.generateEAN13BaseCode()
  const checkDigit = OfflineBarcodeGeneratorInternal.calculateEAN13CheckDigit(baseCode)
  return baseCode + checkDigit
}

export function calculateEAN13CheckDigit(code: string): string {
  return OfflineBarcodeGeneratorInternal.calculateEAN13CheckDigit(code)
}

export function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false
  const checkDigit = barcode.slice(-1)
  const calculatedCheckDigit = OfflineBarcodeGeneratorInternal.calculateEAN13CheckDigit(barcode.slice(0, 12))
  return checkDigit === calculatedCheckDigit
}

export function generateRealisticBarcodeImage(barcodeNumber: string): string {
  return OfflineBarcodeGeneratorInternal.generateBarcodeImage(barcodeNumber)
}

export function generateCategoryBarcode(category: string): string {
  const categoryPrefixes: { [key: string]: string } = {
    Brakes: "2541",
    Engine: "2542",
    Maintenance: "2543",
    Transmission: "2544",
    Controls: "2545",
    Electrical: "2546",
    Accessories: "2547",
    Suspension: "2548",
    Tires: "2549",
    Wheels: "2540", // Default or fallback
  }

  const prefix = categoryPrefixes[category] || "2540"
  // Ensure product code is 9 digits to make total 12 before check digit (3 prefix + 9 product code)
  const timestampPart = Date.now().toString().slice(-6) // Last 6 digits of timestamp
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0") // 3 random digits
  const productCode = (timestampPart + randomPart).slice(-9) // Ensure 9 digits

  const baseCode = prefix + productCode
  const checkDigit = OfflineBarcodeGeneratorInternal.calculateEAN13CheckDigit(baseCode)

  return baseCode + checkDigit
}
