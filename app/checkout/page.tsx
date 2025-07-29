"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Wallet, Bitcoin, Shield, ArrowLeft } from "lucide-react"
import type { Address } from "@/lib/types"
import Image from "next/image"

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "crypto">("card")
  const [cryptoCurrency, setCryptoCurrency] = useState("bitcoin")
  const [saveAddress, setSaveAddress] = useState(false)
  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping")

  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    phoneNumber: "",
  })

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      fetchAddresses()
      // Pre-fill form with user data
      setShippingForm((prev) => ({
        ...prev,
        fullName: user.fullName,
      }))
      setPaymentForm((prev) => ({
        ...prev,
        cardholderName: user.fullName,
      }))
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (items.length === 0 && !authLoading) {
      router.push("/cart")
    }
  }, [items, authLoading, router])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const userAddresses = await FirebaseService.getUserAddresses(user.uid)
      setAddresses(userAddresses)

      // Select default address if available
      const defaultAddress = userAddresses.find((addr) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id)
        setShippingForm({
          fullName: defaultAddress.fullName,
          addressLine1: defaultAddress.addressLine1,
          addressLine2: defaultAddress.addressLine2 || "",
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postalCode,
          country: defaultAddress.country,
          phoneNumber: defaultAddress.phoneNumber,
        })
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error)
    }
  }

  const handleShippingSubmit = async () => {
    // Validate shipping form
    const requiredFields = ["fullName", "addressLine1", "city", "state", "postalCode", "phoneNumber"]
    const missingFields = requiredFields.filter((field) => !shippingForm[field as keyof typeof shippingForm])

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping fields",
        variant: "destructive",
      })
      return
    }

    // Save address if requested
    if (saveAddress && user) {
      try {
        await FirebaseService.createAddress({
          userId: user.uid,
          ...shippingForm,
          isDefault: addresses.length === 0, // Make first address default
        })
      } catch (error) {
        console.error("Failed to save address:", error)
      }
    }

    setStep("payment")
  }

  const handlePaymentSubmit = () => {
    if (paymentMethod === "card") {
      const requiredFields = ["cardNumber", "expiryDate", "cvv", "cardholderName"]
      const missingFields = requiredFields.filter((field) => !paymentForm[field as keyof typeof paymentForm])

      if (missingFields.length > 0) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required payment fields",
          variant: "destructive",
        })
        return
      }
    }

    setStep("review")
  }

  const handlePlaceOrder = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Create orders for each item
      for (const item of items) {
        const orderData = {
          boxId: item.box.id,
          buyerId: user.uid,
          sellerId: item.box.sellerId,
          status: "pending" as const,
          paymentMethod,
          paymentDetails: {
            amount: item.box.price * item.quantity,
            currency: "USD",
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...(paymentMethod === "crypto" && {
              cryptoDetails: {
                cryptocurrency: cryptoCurrency,
                walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Mock address
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              },
            }),
          },
          shippingAddress: {
            id: selectedAddress || `addr_${Date.now()}`,
            userId: user.uid,
            ...shippingForm,
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }

        await FirebaseService.createOrder(orderData)

        // Update box status to sold
        await FirebaseService.updateBox(item.box.id, { status: "sold" })

        // Create notification for seller
        await FirebaseService.createNotification({
          userId: item.box.sellerId,
          type: "order",
          title: "New Order Received",
          message: `You have a new order for "${item.box.title}"`,
          actionUrl: `/dashboard`,
        })
      }

      // Clear cart
      await clearCart()

      toast({
        title: "Order Placed Successfully!",
        description: "You will receive email confirmation shortly",
      })

      router.push("/dashboard?tab=purchases")
    } catch (error) {
      console.error("Failed to place order:", error)
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const shippingCost = items.reduce((sum, item) => {
    return sum + (item.box.shipping.freeShipping ? 0 : item.box.shipping.shippingCost * item.quantity)
  }, 0)

  const subtotal = totalPrice
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shippingCost + tax

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mb-8">
              {["shipping", "payment", "review"].map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === stepName
                        ? "bg-primary text-primary-foreground"
                        : index < ["shipping", "payment", "review"].indexOf(step)
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium capitalize">{stepName}</span>
                  {index < 2 && <div className="w-8 h-px bg-muted mx-4" />}
                </div>
              ))}
            </div>

            {/* Shipping Information */}
            {step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-2">
                      <Label>Saved Addresses</Label>
                      <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a saved address" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {address.fullName} - {address.addressLine1}, {address.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={shippingForm.fullName}
                        onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={shippingForm.phoneNumber}
                        onChange={(e) => setShippingForm({ ...shippingForm, phoneNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={shippingForm.addressLine1}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={shippingForm.addressLine2}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={shippingForm.postalCode}
                        onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={shippingForm.country}
                      onValueChange={(value) => setShippingForm({ ...shippingForm, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="saveAddress" checked={saveAddress} onCheckedChange={setSaveAddress} />
                    <Label htmlFor="saveAddress">Save this address for future orders</Label>
                  </div>

                  <Button onClick={handleShippingSubmit} className="w-full mystery-gradient text-white">
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Credit/Debit Card</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>PayPal</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="crypto" id="crypto" />
                      <Label htmlFor="crypto" className="flex items-center space-x-2">
                        <Bitcoin className="h-4 w-4" />
                        <span>Cryptocurrency</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardholderName">Cardholder Name *</Label>
                        <Input
                          id="cardholderName"
                          value={paymentForm.cardholderName}
                          onChange={(e) => setPaymentForm({ ...paymentForm, cardholderName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentForm.cardNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date *</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={paymentForm.expiryDate}
                            onChange={(e) => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={paymentForm.cvv}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "crypto" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Cryptocurrency</Label>
                        <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                            <SelectItem value="litecoin">Litecoin (LTC)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "paypal" && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You will be redirected to PayPal to complete your payment</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setStep("shipping")} className="flex-1">
                      Back to Shipping
                    </Button>
                    <Button onClick={handlePaymentSubmit} className="flex-1 mystery-gradient text-white">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Review */}
            {step === "review" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="text-sm text-muted-foreground">
                      <p>{shippingForm.fullName}</p>
                      <p>{shippingForm.addressLine1}</p>
                      {shippingForm.addressLine2 && <p>{shippingForm.addressLine2}</p>}
                      <p>
                        {shippingForm.city}, {shippingForm.state} {shippingForm.postalCode}
                      </p>
                      <p>{shippingForm.country}</p>
                      <p>{shippingForm.phoneNumber}</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <div className="text-sm text-muted-foreground">
                      {paymentMethod === "card" && <p>Credit Card ending in {paymentForm.cardNumber.slice(-4)}</p>}
                      {paymentMethod === "paypal" && <p>PayPal</p>}
                      {paymentMethod === "crypto" && <p>{cryptoCurrency.toUpperCase()}</p>}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.box.id} className="flex items-center space-x-3 p-2 border rounded">
                          <div className="relative w-12 h-12">
                            <Image
                              src={item.box.images[0] || "/placeholder.svg"}
                              alt={item.box.title}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.box.title}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${((item.box.price || 0) * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setStep("payment")} className="flex-1">
                      Back to Payment
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 mystery-gradient text-white"
                    >
                      {loading ? "Processing..." : "Place Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.box.id} className="flex justify-between text-sm">
                      <span>
                        {item.box.title} × {item.quantity}
                      </span>
                      <span>${((item.box.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
