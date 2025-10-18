"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, CheckCircle, AlertCircle, Loader2, Lightbulb } from "lucide-react"
import { createWorker } from "tesseract.js"

// OfflineOCRReader class (as provided by user)
class OfflineOCRReader {
  worker: any
  isInitialized: boolean

  constructor() {
    this.worker = null
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return

    console.log("Initializing offline OCR...")

    // This downloads models once, then cached for offline use
    this.worker = await createWorker("eng", 1, {
      // Cache models locally for offline use
      // Note: In a Next.js project, cachePath might need adjustment for deployment
      // For local development, this path works if tesseract.js is in node_modules
      cachePath: "./node_modules/tesseract.js/src/worker-script",
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    // Configure for digits only (offline configuration)
    await this.worker.setParameters({
      tessedit_char_whitelist: "0123456789 ",
      tessedit_pageseg_mode: "7", // Single text line
      preserve_interword_spaces: "1",
    })

    this.isInitialized = true
    console.log("Offline OCR ready!")
  }

  async readBarcodeNumber(canvas: HTMLCanvasElement): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Process image completely offline
      const {
        data: { text, confidence },
      } = await this.worker.recognize(canvas)

      console.log(`OCR detected: "${text}" (confidence: ${confidence}%)`)

      // Clean extracted text (remove spaces, non-digits)
      const cleanedText = text.replace(/\s/g, "").replace(/[^0-9]/g, "")

      // Validate barcode format (13 digits for EAN-13)
      if (cleanedText.length >= 12 && cleanedText.length <= 14 && /^\d+$/.test(cleanedText)) {
        // Ensure exactly 13 digits
        return cleanedText.padStart(13, "2") // Pad with '2' if less than 13, assuming EAN-13 starts with 2
      }

      return null
    } catch (error) {
      console.error("Offline OCR reading failed:", error)
      return null
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.isInitialized = false
    }
  }
}

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void
  onClose: () => void
}

export default function OfflineOCRScanner({ onBarcodeScanned, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrReader] = useState(() => new OfflineOCRReader())
  const [lastDetection, setLastDetection] = useState("")
  const [flashlightOn, setFlashlightOn] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startScanning() // Start camera immediately when component mounts
    return () => {
      stopScanning()
      ocrReader.terminate()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)
      setLastDetection("")
      setScanSuccess(false)

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment", // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsScanning(true)

        // Initialize OCR (downloads models if needed, then offline)
        await ocrReader.initialize()

        // Start continuous capture and read
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current)
        }
        captureIntervalRef.current = setInterval(captureAndRead, 1000) // Capture every 1 second
      }
    } catch (error) {
      console.error("Camera access failed:", error)
      setError("Camera access denied. Please enable camera permissions and try again.")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }
    setIsScanning(false)
    setIsProcessing(false)
    setFlashlightOn(false)
  }

  const toggleFlashlight = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0]
      if (track && "torch" in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn }],
          } as MediaTrackConstraints) // Cast to MediaTrackConstraints
          setFlashlightOn(!flashlightOn)
        } catch (err) {
          console.error("Failed to toggle flashlight:", err)
          alert("Flashlight not supported or failed to toggle.")
        }
      } else {
        alert("Flashlight not supported on this device/browser.")
      }
    }
  }

  const captureAndRead = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    setIsProcessing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Could not get 2D context from canvas")
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Capture current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Enhance image for better OCR (all offline processing)
      enhanceImageForOCR(context, canvas)

      // Read barcode number using offline OCR
      const barcodeNumber = await ocrReader.readBarcodeNumber(canvas)

      if (barcodeNumber && barcodeNumber !== lastDetection) {
        console.log(`Barcode detected: ${barcodeNumber}`)
        setLastDetection(barcodeNumber)
        onBarcodeScanned(barcodeNumber)

        // Success feedback
        playSuccessBeep()

        // Stop continuous scanning after successful detection
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current)
          captureIntervalRef.current = null
        }
        setScanSuccess(true) // Indicate success state
        setTimeout(() => {
          setScanSuccess(false)
          setLastDetection("")
          // Optionally restart scanning after a delay or close
          // startScanning(); // Uncomment to restart scanning automatically
        }, 3000) // Clear detection after 3 seconds
      } else if (!barcodeNumber) {
        console.log("No valid barcode detected in image")
        playErrorBeep()
      }
    } catch (error) {
      console.error("Capture and read failed:", error)
      playErrorBeep()
    } finally {
      setIsProcessing(false)
    }
  }

  // Offline image enhancement using native Canvas API (as provided by user)
  const enhanceImageForOCR = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert to high contrast grayscale for better OCR
    for (let i = 0; i < data.length; i += 4) {
      // Calculate grayscale value
      const grayscale = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

      // Apply high contrast: make text very dark, background very light
      const threshold = 140
      const enhanced = grayscale > threshold ? 255 : 0

      data[i] = enhanced // Red
      data[i + 1] = enhanced // Green
      data[i + 2] = enhanced // Blue
      // Alpha channel unchanged
    }

    // Apply sharpening filter
    const sharpenedData = applySharpenFilter(imageData)
    context.putImageData(sharpenedData, 0, 0)
  }

  // Offline sharpening filter (as provided by user)
  const applySharpenFilter = (imageData: ImageData): ImageData => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(data)

    // Simple sharpen kernel
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            const weight = kernel[kernelIdx]

            r += data[idx] * weight
            g += data[idx + 1] * weight
            b += data[idx + 2] * weight
          }
        }

        const outputIdx = (y * width + x) * 4
        output[outputIdx] = Math.max(0, Math.min(255, r))
        output[outputIdx + 1] = Math.max(0, Math.min(255, g))
        output[outputIdx + 2] = Math.max(0, Math.min(255, b))
      }
    }

    return new ImageData(output, width, height)
  }

  // Offline audio feedback (as provided by user)
  const playSuccessBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // High pitch for success
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  const playErrorBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 300 // Low pitch for error
    oscillator.type = "sawtooth"
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const [scanSuccess, setScanSuccess] = useState(false) // State for visual success feedback
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="relative w-full max-w-lg mx-4">
        <Card className="overflow-hidden border-2 border-white/20">
          <CardContent className="p-0">
            <div className="relative">
              <video ref={videoRef} className="w-full h-80 object-cover" autoPlay playsInline muted />

              {/* Professional Scanner Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Main Scanning Frame */}
                  <div
                    className={`w-80 h-28 border-4 rounded-lg relative overflow-hidden transition-all duration-300 ${
                      scanSuccess ? "border-green-500 bg-green-500/10" : "border-red-500"
                    }`}
                  >
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-red-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-red-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-red-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-red-500"></div>

                    {/* Animated scanning line */}
                    {!scanSuccess && isScanning && (
                      <div className="scan-line absolute top-0 left-0 w-full h-1 bg-red-500 opacity-80"></div>
                    )}

                    {/* Success indicator */}
                    {scanSuccess && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-green-500 rounded-full p-3">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-white text-center">
                    <div className="bg-black/70 px-4 py-2 rounded-lg">
                      <div className="font-medium">
                        {scanSuccess ? "✓ Barcode Detected!" : "Align barcode numbers within frame"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20 bg-black/50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Bar */}
            <div className="p-4 bg-gray-900 text-white">
              <div className="flex items-center justify-center gap-3 text-sm">
                {scanSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Barcode detected: {lastDetection}</span>
                  </>
                ) : error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">{error}</span>
                  </>
                ) : !isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span>Loading camera...</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span>Processing frame...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Scanning for barcodes...</span>
                  </>
                )}
              </div>

              <div className="text-center mt-3 flex justify-center gap-2">
                <Button
                  onClick={toggleFlashlight}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {flashlightOn ? "Flash Off" : "Flash On"}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancel Scanning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style jsx>{`
        .scan-line {
          animation: scan 1.5s linear infinite;
        }

        @keyframes scan {
          0% {
            top: 0;
            opacity: 1;
            box-shadow: 0 0 10px #ef4444;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            top: calc(100% - 4px);
            opacity: 1;
            box-shadow: 0 0 10px #ef4444;
          }
        }
      `}</style>
    </div>
  )
}
