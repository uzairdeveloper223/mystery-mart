"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Shield, Zap, HelpCircle } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Discover the
                <span className="mystery-gradient bg-clip-text text-transparent"> Mystery</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Unbox amazing surprises from verified sellers. Buy mystery boxes, reveal contents, or keep the mystery
                alive.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/boxes">
                <Button size="lg" className="mystery-gradient text-white hover:opacity-90">
                  Browse Mystery Boxes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline">
                  Start Selling
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="mystery-gradient rounded-full p-3 w-12 h-12 mx-auto mb-2">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">10,000+</p>
                <p className="text-xs text-muted-foreground">Mystery Boxes</p>
              </div>
              <div className="text-center">
                <div className="mystery-gradient rounded-full p-3 w-12 h-12 mx-auto mb-2">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-xs text-muted-foreground">Sellers</p>
              </div>
              <div className="text-center">
                <div className="mystery-gradient rounded-full p-3 w-12 h-12 mx-auto mb-2">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium">Instant</p>
                <p className="text-xs text-muted-foreground">Delivery</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="mystery-gradient rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Home & Garden Mystery Box</h3>
                  <span className="rarity-legendary px-2 py-1 rounded-full text-xs font-medium border">legendary</span>
                </div>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-24 w-24 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-semibold">$1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Est. Value:</span>
                    <span className="font-semibold text-green-600">$2-4</span>
                  </div>
                </div>
                <Button 
                  className="w-full mystery-gradient text-white"
                  onClick={() => window.open('https://mystery-mart-app.vercel.app/boxes/-OWd5F3tTt5dcHH-rRwt', '_blank')}
                >
                  Reveal Mystery
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
