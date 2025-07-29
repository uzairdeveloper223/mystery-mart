"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CartPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, loading } = useCart()
  const router = useRouter()
  const [promoCode, setPromoCode] = useState("")

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const shippingCost = items.reduce((sum, item) => {
    return sum + (item.box.shipping.freeShipping ? 0 : item.box.shipping.shippingCost * item.quantity)
  }, 0)

  const subtotal = totalPrice
  const total = subtotal + shippingCost

  const getRarityClass = (rarity: string) => {
    return `rarity-${rarity}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems > 1 ? "s" : ""} in your cart`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Discover amazing mystery boxes and add them to your cart</p>
            <Button onClick={() => router.push("/boxes")} className="mystery-gradient text-white">
              Browse Mystery Boxes
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.box.id}>
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.box.images[0] || "/placeholder.svg"}
                          alt={item.box.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Badge className={cn("absolute -top-2 -right-2 text-xs", getRarityClass(item.box.rarity))}>
                          {item.box.rarity}
                        </Badge>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/boxes/${item.box.id}`} className="font-semibold hover:underline line-clamp-2">
                              {item.box.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">{item.box.category}</p>
                            <p className="text-sm text-muted-foreground">by @{item.box.seller.username}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.box.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-transparent"
                              onClick={() => updateQuantity(item.box.id, item.quantity - 1)}
                              disabled={loading || item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = Number.parseInt(e.target.value) || 1
                                updateQuantity(item.box.id, Math.max(1, Math.min(10, qty)))
                              }}
                              className="w-16 text-center"
                              disabled={loading}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-transparent"
                              onClick={() => updateQuantity(item.box.id, item.quantity + 1)}
                              disabled={loading || item.quantity >= 10}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">${(item.box.price * item.quantity).toFixed(2)}</p>
                            {!item.box.shipping.freeShipping && (
                              <p className="text-xs text-muted-foreground">
                                +${(item.box.shipping.shippingCost * item.quantity).toFixed(2)} shipping
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <Button className="w-full mystery-gradient text-white" size="lg">
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>

              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Promo Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button variant="outline">Apply</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">Your payment information is encrypted and secure</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
