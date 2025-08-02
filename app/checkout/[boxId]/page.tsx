"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Package, CreditCard, Truck, MapPin, Bitcoin } from "lucide-react"
import { COUNTRIES, CRYPTOCURRENCIES } from "@/lib/countries"
import type { MysteryBox, Address } from "@/lib/types"
import Image from "next/image"

interface Props {
  params: { boxId: string }
}

export default function CheckoutPage({ params }: Props) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [box, setBox] = useState<MysteryBox | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "cod">("cod")
  const [selectedCrypto, setSelectedCrypto] = useState("")
  const [cryptoAddress, setCryptoAddress] = useState("")
  const [processing, setProcessing] = useState(false)

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "PK",
    phoneNumber: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      fetchBoxData()
    }
  }, [user, authLoading, router, params.boxId])

  const fetchBoxData = async () => {
    try {
      setLoading(true)
      const boxData = await FirebaseService.getBox(params.boxId)
      
      if (!boxData) {
        toast({
          title: "Error",
          description: "Mystery box not found",
          variant: "destructive",
        })
        router.push("/boxes")
        return
      }

      if (boxData.status !== "active") {
        toast({
          title: "Error",
          description: "This mystery box is no longer available",
          variant: "destructive",
        })
        router.push("/boxes")
        return
      }

      if (boxData.sellerId === user?.uid) {
        toast({
          title: "Error",
          description: "You cannot purchase your own mystery box",
          variant: "destructive",
        })
        router.push("/boxes")
        return
      }

      setBox(boxData)
    } catch (error) {
      console.error("Failed to fetch box data:", error)
      toast({
        title: "Error",
        description: "Failed to load mystery box details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !box) return

    if (quantity > box.quantity) {
      toast({
        title: "Error",
        description: "Not enough items in stock",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "crypto" && (!selectedCrypto || !cryptoAddress)) {
      toast({
        title: "Error",
        description: "Please select cryptocurrency and enter your wallet address",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Create order
      const orderData = {
        boxId: box.id,
        buyerId: user.uid,
        sellerId: box.sellerId,
        quantity,
        status: "pending" as const,
        paymentMethod,
        paymentDetails: {
          amount: box.price * quantity,
          currency: "USD",
          ...(paymentMethod === "crypto" && {
            cryptoDetails: {
              cryptocurrency: selectedCrypto,
              walletAddress: box.seller?.cryptoAddresses?.[selectedCrypto] || "",
              buyerAddress: cryptoAddress,
            }
          }),
          ...(paymentMethod === "cod" && {
            codDetails: {
              buyerPhone: shippingAddress.phoneNumber,
              estimatedDelivery: "3-7 business days",
            }
          })
        },
        shippingAddress: {
          ...shippingAddress,
          id: "",
          userId: user.uid,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const orderId = await FirebaseService.createOrder(orderData)

      // Send message to seller with order details
      const messageContent = `🛒 New Order Received!

Order ID: ${orderId}
Product: ${box.title}
Quantity: ${quantity}
Total Amount: $${(box.price * quantity).toFixed(2)}
Payment Method: ${paymentMethod.toUpperCase()}

${paymentMethod === "crypto" ? 
  `Cryptocurrency: ${selectedCrypto}
Buyer's Wallet: ${cryptoAddress}
Your Wallet: ${box.seller?.cryptoAddresses?.[selectedCrypto] || "Not set"}` 
  : 
  `Cash on Delivery
Estimated Delivery: 3-7 business days`
}

Shipping Address:
${shippingAddress.fullName}
${shippingAddress.addressLine1}
${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + "\n" : ""}${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}
${COUNTRIES.find(c => c.code === shippingAddress.country)?.name}
Phone: ${shippingAddress.phoneNumber}

Please process this order and update the status accordingly.`

      await FirebaseService.sendOrderMessage(user.uid, box.sellerId, messageContent, orderId)

      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been sent to the seller. You'll receive updates via messages.",
      })

      router.push(`/order/${orderId}`)
    } catch (error) {
      console.error("Failed to create order:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || !box) {
    return null
  }

  const total = box.price * quantity

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={box.images[0] || "/placeholder.svg"}
                    alt={box.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{box.title}</h3>
                  <p className="text-sm text-muted-foreground">{box.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{box.rarity}</Badge>
                    <span className="text-sm">Stock: {box.quantity}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Price per item:</span>
                  <span>${box.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="quantity">Quantity:</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={box.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(box.quantity, parseInt(e.target.value) || 1)))}
                    className="w-20"
                  />
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Checkout Details</CardTitle>
              <CardDescription>Enter your shipping and payment information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shipping Address */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <h3 className="font-semibold">Shipping Address</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress(prev => ({...prev, fullName: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={shippingAddress.phoneNumber}
                        onChange={(e) => setShippingAddress(prev => ({...prev, phoneNumber: e.target.value}))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress(prev => ({...prev, addressLine1: e.target.value}))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress(prev => ({...prev, addressLine2: e.target.value}))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({...prev, city: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province *</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress(prev => ({...prev, state: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({...prev, postalCode: e.target.value}))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={shippingAddress.country} onValueChange={(value) => setShippingAddress(prev => ({...prev, country: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="font-semibold">Payment Method</h3>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={(value: "crypto" | "cod") => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Cash on Delivery (COD)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="crypto" id="crypto" />
                      <Label htmlFor="crypto" className="flex items-center gap-2">
                        <Bitcoin className="h-4 w-4" />
                        Cryptocurrency
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "crypto" && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="cryptocurrency">Select Cryptocurrency *</Label>
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose cryptocurrency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CRYPTOCURRENCIES.map((crypto) => (
                              <SelectItem key={crypto.symbol} value={crypto.symbol}>
                                {crypto.symbol} - {crypto.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cryptoAddress">Your Wallet Address *</Label>
                        <Input
                          id="cryptoAddress"
                          value={cryptoAddress}
                          onChange={(e) => setCryptoAddress(e.target.value)}
                          placeholder="Enter your wallet address"
                          required={paymentMethod === "crypto"}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This is where you'll send the payment from
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        You'll pay ${total.toFixed(2)} in cash when the package is delivered to your address.
                        Estimated delivery: 3-7 business days.
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full mystery-gradient text-white" 
                  disabled={processing}
                >
                  {processing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
