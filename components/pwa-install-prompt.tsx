"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // For iOS, show manual install instructions after a delay
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 2000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("User accepted the install prompt")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-[#7D9B7F] shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#7D9B7F] flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Install App Now</CardTitle>
                <CardDescription className="text-xs">Access faster without a browser</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 -mt-1 -mr-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isIOS ? (
            <div className="space-y-2 text-sm text-[#5A4A3A]">
              <p className="font-medium">To install on iOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>
                  Tap the <span className="font-semibold">Share</span> button
                </li>
                <li>
                  Scroll and tap <span className="font-semibold">"Add to Home Screen"</span>
                </li>
                <li>
                  Tap <span className="font-semibold">"Add"</span> to confirm
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[#5A4A3A]">
                Install Bootyque on your device for quick access and offline support.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstallClick} className="flex-1 bg-[#7D9B7F] hover:bg-[#6B8A6D]">
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </Button>
                <Button onClick={handleDismiss} variant="outline" className="flex-1 bg-transparent">
                  Maybe Later
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
