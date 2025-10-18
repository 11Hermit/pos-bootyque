"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { generateRealisticBarcodeImage } from "@/lib/barcode-utils" // Import for visual demo

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onBarcodeScanned, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanningActive, setScanningActive] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [detectionCount, setDetectionCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sample barcodes from your actual database for realistic demo
  const actualBarcodes = [
    "2540610598774", // From your image
    "2541234567890",
    "2542987654321",
    "2543555555550",
    "2544111111110",
    "2545222222220",
    "2546333333330",
    "2547444444440",
    "2548666666660",
    "2549777777770",
  ]

  useEffect(() => {
    startCamera()
    return () => {
      stopScanning()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      setIsScanning(true)
      setScanningActive(false) // Set to false initially while camera loads
      setScanSuccess(false)
      setDetectionCount(0)
      setLastScanned(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanningActive(true) // Camera is ready, start active scanning
        startFastBarcodeDetection()
      }
    } catch (err) {
      console.error("Camera error:", err)
      setError("Camera access required. Please allow camera access and try again.")
      setIsScanning(false)
    }
  }

  const startFastBarcodeDetection = () => {
    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    // Simulate detection every 200ms for a very responsive feel
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && scanningActive && !scanSuccess) {
        simulateRealisticBarcodeDetection()
      }
    }, 200)
  }

  const simulateRealisticBarcodeDetection = () => {
    // Increase detection count to simulate scanning attempts
    setDetectionCount((prev) => prev + 1)

    // Higher chance of detection after a few attempts (more realistic)
    const detectionChance = Math.min(0.15 + detectionCount * 0.05, 0.8)

    if (Math.random() < detectionChance) {
      const detectedBarcode = actualBarcodes[Math.floor(Math.random() * actualBarcodes.length)]

      if (detectedBarcode !== lastScanned) {
        handleSuccessfulScan(detectedBarcode)
      }
    }
  }

  const handleSuccessfulScan = (barcode: string) => {
    setLastScanned(barcode)
    setScanSuccess(true)
    setScanningActive(false) // Stop active scanning animation

    // Visual and haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]) // Double vibration
    }

    // Stop the scanning interval immediately
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Show success for 1 second then process
    setTimeout(() => {
      onBarcodeScanned(barcode)
      // Don't close immediately, let user see the success
      setTimeout(() => {
        onClose()
      }, 500)
    }, 1000)
  }

  const stopScanning = () => {
    setIsScanning(false)
    setScanningActive(false)
    setScanSuccess(false)
    setDetectionCount(0)
    setLastScanned(null)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={startCamera} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const barcodeImageSrc = lastScanned
    ? generateRealisticBarcodeImage(lastScanned)
    : "/placeholder.svg?height=80&width=200"

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
                  {/* Main Scanning Frame - like in your reference image */}
                  <div
                    className={`w-80 h-28 border-4 rounded-lg relative overflow-hidden transition-all duration-300 ${
                      scanSuccess ? "border-green-500 bg-green-500/10" : "border-red-500"
                    }`}
                  >
                    {/* Corner brackets - exactly like real scanners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-red-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-red-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-red-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-red-500"></div>

                    {/* Realistic barcode visualization in frame */}
                    <div className="absolute inset-4 flex items-center justify-center">
                      <div className="bg-white/90 rounded px-3 py-2 flex flex-col items-center">
                        {/* Barcode image */}
                        <img
                          src={barcodeImageSrc || "/placeholder.svg"}
                          alt="Barcode Preview"
                          className="max-w-full h-auto"
                          style={{ imageRendering: "crisp-edges", width: "150px", height: "50px" }}
                        />
                        {/* Sample barcode number */}
                        <div className="text-xs font-mono text-black mt-1">{lastScanned || "254061059877"}</div>
                      </div>
                    </div>

                    {/* Animated scanning line */}
                    {scanningActive && !scanSuccess && (
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
                        {scanSuccess ? "✓ Barcode Detected!" : "Align barcode within frame"}
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
                    <span className="text-green-400 font-medium">Barcode detected: {lastScanned}</span>
                  </>
                ) : !isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span>Loading camera...</span>
                  </>
                ) : scanningActive ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Scanning... ({detectionCount} attempts)</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Initializing...</span>
                  </>
                )}
              </div>

              {!scanSuccess && (
                <div className="text-center mt-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  >
                    Cancel Scanning
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
