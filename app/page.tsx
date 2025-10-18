import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Heart, ShoppingBag, TrendingUp } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-2 tabular-nums">
          <div className="p-6 rounded-2xl bg-[#F5F1E8]">
            <Image
              src="/bootyque-logo.png"
              alt="Bootyque"
              width={200}
              height={200}
              className="object-contain drop-shadow-sm font-normal mx-0 rounded-full"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#7D9B7F]">Bootyque</h1>
            <p className="text-[#8B7355] text-sm italic">Effortless Style. Perfected Sales</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-[#5A4A3A] mb-6 text-balance">Point of Sale</h2>
          <p className="text-xl text-[#8B7355] mb-8 max-w-2xl mx-auto leading-relaxed italic">
            {
              "Manage your boutique or fashion business with elegance. Track stock, process sales, calculate your daily profits, and grow your sustainable fashion business with our beautiful point-of-sale system."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-[#7D9B7F] hover:bg-[#6B8A6D] text-white px-8 py-3 rounded-full">
                Access System
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-[#C89B9B] text-[#C89B9B] hover:bg-[#C89B9B] hover:text-white px-8 py-3 rounded-full bg-transparent"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/80 backdrop-blur-sm border-[#E5DCC8] hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-[#C89B9B] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#5A4A3A] mb-2">Effortless Inventory</h3>
              <p className="text-[#8B7355]">Organize your unique pieces with style and ease</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-[#E5DCC8] hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 text-[#C89B9B] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#5A4A3A] mb-2">Customer Delight</h3>
              <p className="text-[#8B7355]">Build relationships with your fashion-forward clientele</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-[#E5DCC8] hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-[#C89B9B] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#5A4A3A] mb-2">Perfected Analytics</h3>
              <p className="text-[#8B7355]">Track profits and grow your boutique business</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-[#E5DCC8] hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <ShoppingBag className="w-12 h-12 text-[#C89B9B] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#5A4A3A] mb-2">Smooth Checkout</h3>
              <p className="text-[#8B7355]">Seamless shopping experience for your customers</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-2xl mx-auto border border-[#E5DCC8]">
            <h3 className="text-3xl font-bold text-[#5A4A3A] mb-4">Ready to Elevate Your Business?</h3>
            <p className="text-[#8B7355] mb-6 leading-relaxed italic">
              Join the sustainable fashion movement with a POS system designed for modern thrift boutiques.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-[#7D9B7F] hover:bg-[#6B8A6D] text-white px-12 py-3 rounded-full">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-[#E5DCC8]">
        <div className="text-center text-[#8B7355]">
          <p>&copy; 2025 Bootyque. All rights reserved.</p>
          <p className="mt-2 text-sm italic">Effortless Style. Perfected Sales</p>
        </div>
      </footer>
    </div>
  )
}
