// Professional barcode generation with realistic appearance

export function generateProfessionalBarcode(): string {
  // Generate EAN-13 barcode with proper country code and manufacturer code
  const countryCode = "254" // Kenya country code
  const manufacturerCode = generateManufacturerCode()
  const productCode = generateProductCode()
  const baseCode = countryCode + manufacturerCode + productCode
  const checkDigit = calculateEAN13CheckDigit(baseCode)
  return baseCode + checkDigit
}

function generateManufacturerCode(): string {
  // Generate a 4-digit manufacturer code for Alfire Spares
  const baseCode = 1000 + Math.floor(Math.random() * 9000)
  return baseCode.toString()
}

function generateProductCode(): string {
  // Generate a 5-digit product code
  const timestamp = Date.now().toString().slice(-5)
  return timestamp
}

export function calculateEAN13CheckDigit(code: string): string {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = Number.parseInt(code[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

export function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false
  const checkDigit = barcode.slice(-1)
  const calculatedCheckDigit = calculateEAN13CheckDigit(barcode.slice(0, 12))
  return checkDigit === calculatedCheckDigit
}

export function generateRealisticBarcodeImage(barcodeNumber: string): string {
  // Generate a realistic barcode that looks exactly like real barcodes
  const { bars, textPositions } = generateEAN13Bars(barcodeNumber)

  const svg = `
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg" style="background: white;">
      <!-- White background with slight border -->
      <rect x="0" y="0" width="200" height="80" fill="white" stroke="#e5e5e5" stroke-width="1"/>
      
      <!-- Barcode bars -->
      <g transform="translate(15, 10)">
        ${bars}
      </g>
      
      <!-- Human readable numbers -->
      <text x="${textPositions.firstDigitX}" y="70" text-anchor="middle" font-family="Arial, monospace" font-size="11" font-weight="normal" fill="black">
        ${barcodeNumber[0]}
      </text>
      <text x="${textPositions.leftBlockX}" y="70" text-anchor="middle" font-family="Arial, monospace" font-size="11" font-weight="normal" fill="black">
        ${barcodeNumber.substring(1, 7)}
      </text>
      <text x="${textPositions.rightBlockX}" y="70" text-anchor="middle" font-family="Arial, monospace" font-size="11" font-weight="normal" fill="black">
        ${barcodeNumber.substring(7, 12)}
      </text>
      <text x="${textPositions.checkDigitX}" y="70" text-anchor="middle" font-family="Arial, monospace" font-size="11" font-weight="normal" fill="black">
        ${barcodeNumber[12]}
      </text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function generateEAN13Bars(barcode: string): {
  bars: string
  textPositions: { firstDigitX: number; leftBlockX: number; rightBlockX: number; checkDigitX: number }
} {
  // EAN-13 encoding patterns - exactly like real barcodes
  const leftOddPattern = [
    "0001101",
    "0011001",
    "0010011",
    "0111101",
    "0100011",
    "0110001",
    "0101111",
    "0111011",
    "0110111",
    "0001011",
  ]
  const leftEvenPattern = [
    "0100111",
    "0110011",
    "0011011",
    "0100001",
    "0011101",
    "0111001",
    "0000101",
    "0010001",
    "0001001",
    "0010111",
  ]
  const rightPattern = [
    "1110010",
    "1100110",
    "1101100",
    "1000010",
    "1011100",
    "1001110",
    "1010000",
    "1000100",
    "1001000",
    "1110100",
  ]

  const firstDigitPatterns = [
    "LLLLLL",
    "LLGLGG",
    "LLGGLG",
    "LLGGGL",
    "LGLLGG",
    "LGGLLG",
    "LGGGLL",
    "LGLGLG",
    "LGLGGL",
    "LGGLGL",
  ]

  let bars = ""
  let x = 0
  const barWidth = 1.5 // Base bar width
  const shortBarHeight = 50 // Height for normal bars
  const longBarHeight = 55 // Height for guard bars

  // Quiet zone left
  x += 9 * barWidth // Approximately 9 modules for quiet zone

  // Start guard bars (longer)
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="black"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="white"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="black"/>`
  x += barWidth

  const firstDigit = Number.parseInt(barcode[0])
  const pattern = firstDigitPatterns[firstDigit]

  // Left side (6 digits)
  for (let i = 1; i <= 6; i++) {
    const digit = Number.parseInt(barcode[i])
    const encoding = pattern[i - 1] === "L" ? leftOddPattern[digit] : leftEvenPattern[digit]

    for (let j = 0; j < 7; j++) {
      if (encoding[j] === "1") {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${shortBarHeight}" fill="black"/>`
      } else {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${shortBarHeight}" fill="white"/>`
      }
      x += barWidth
    }
  }

  // Center guard bars (longer)
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="white"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="black"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="white"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="black"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="white"/>`
  x += barWidth

  // Right side (6 digits)
  for (let i = 7; i <= 12; i++) {
    const digit = Number.parseInt(barcode[i])
    const encoding = rightPattern[digit]

    for (let j = 0; j < 7; j++) {
      if (encoding[j] === "1") {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${shortBarHeight}" fill="black"/>`
      } else {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${shortBarHeight}" fill="white"/>`
      }
      x += barWidth
    }
  }

  // End guard bars (longer)
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="black"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="white"/>`
  x += barWidth
  bars += `<rect x="${x}" y="0" width="${barWidth}" height="${longBarHeight}" fill="black"/>`
  x += barWidth

  // Quiet zone right
  x += 9 * barWidth // Approximately 9 modules for quiet zone

  // Calculate text positions based on bar positions
  const firstDigitX = 15 + (9 * barWidth) / 2 // Center of first quiet zone
  const leftBlockX = 15 + 9 * barWidth + (6 * 7 * barWidth) / 2 // Center of left block
  const rightBlockX = 15 + 9 * barWidth + 6 * 7 * barWidth + 5 * barWidth + (6 * 7 * barWidth) / 2 // Center of right block
  const checkDigitX =
    15 + 9 * barWidth + 6 * 7 * barWidth + 5 * barWidth + 6 * 7 * barWidth + 3 * barWidth + (9 * barWidth) / 2 // Center of last quiet zone

  return {
    bars,
    textPositions: {
      firstDigitX,
      leftBlockX,
      rightBlockX,
      checkDigitX: 15 + x - (9 * barWidth) / 2, // Adjusted for end quiet zone
    },
  }
}

// Generate barcode for specific product categories
export function generateCategoryBarcode(category: string): string {
  const categoryPrefixes = {
    Brakes: "2541",
    Engine: "2542",
    Maintenance: "2543",
    Transmission: "2544",
    Controls: "2545",
    Electrical: "2546",
    Accessories: "2547",
    Suspension: "2548",
    Tires: "2549",
    Wheels: "2540",
  }

  const prefix = categoryPrefixes[category] || "2540"
  // Ensure product code is 8 digits to make total 12 before check digit
  const productCode = Date.now().toString().slice(-8)
  const baseCode = prefix + productCode
  const checkDigit = calculateEAN13CheckDigit(baseCode)

  return baseCode + checkDigit
}
