import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

export const metadata: Metadata = {
  title: "Bootyque - Boutique POS System",
  description: "Curated Style, Sustainable Choices - Modern POS system for thrift boutiques",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bootyque POS",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Bootyque",
    title: "Bootyque - Boutique POS System",
    description: "Curated Style, Sustainable Choices - Modern POS system for thrift boutiques",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#7D9B7F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bootyque POS" />
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.jpg" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.jpg" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Suspense fallback={null}>{children}</Suspense>
        <PWAInstallPrompt />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SW] Registration successful:', registration.scope);
                    },
                    function(err) {
                      console.log('[SW] Registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
