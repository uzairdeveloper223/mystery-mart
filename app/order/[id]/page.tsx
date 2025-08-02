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
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  Star,
  Bitcoin,
  Flag,
  DollarSign
} from "lucide-react"
import { COUNTRIES } from "@/lib/countries"
import type { Order, MysteryBox } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"

interface Props {
  params: { id: string }
}

export default function OrderPage({ params }: Props) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [box, setBox] = useState<MysteryBox | null>(null)
  const [processing, setProcessing] = useState(false)

  const isSellerView = user && order && user.uid === order.sellerId
  const isBuyerView = user && order && user.uid === order.buyerId

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      fetchOrderData()
    }
  }, [user, authLoading, router, params.id])

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      const orderData = await FirebaseService.getOrder(params.id)
      
      if (!orderData) {
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      // Check if user has permission to view this order
      if (user && user.uid !== orderData.buyerId && user.uid !== orderData.sellerId && user.email !== "uzairxdev223@gmail.com") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this order",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setOrder(orderData)

      // Fetch box details
      const boxData = await FirebaseService.getBox(orderData.boxId)
      if (boxData) {
        setBox(boxData)
      }
    } catch (error) {
      console.error("Failed to fetch order data:", error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    if (!order || !user) return

    setProcessing(true)
    try {
      await FirebaseService.updateOrderStatus(order.id, newStatus)
      
      // If order is shipped, decrease inventory
      if (newStatus === "shipped" && box) {
        await FirebaseService.updateBoxQuantity(box.id, order.quantity)
      }

      await fetchOrderData() // Refresh order data
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReportIssue = async () => {
    if (!order || !user) return

    const issueType = prompt("What type of issue are you reporting?\n1. Payment not received\n2. Item damaged/wrong/empty\n3. Shipping delay\n4. Other\n\nEnter 1-4:")
    
    if (!issueType || !["1", "2", "3", "4"].includes(issueType)) return

    const description = prompt("Please describe the issue in detail:")
    if (!description) return

    try {
      const issueTypes = {
        "1": "Payment Issue",
        "2": "Item Quality Issue", 
        "3": "Shipping Issue",
        "4": "Other Issue"
      }

      await FirebaseService.createReport({
        reporterId: user.uid,
        reportedId: order.id,
        reportedType: "order" as any,
        category: "other",
        description: `${issueTypes[issueType as keyof typeof issueTypes]}: ${description}`,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Report Submitted",
        description: "Your issue has been reported to admin. You'll receive a response soon.",
      })
    } catch (error) {
      console.error("Failed to report issue:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleContactUser = async () => {
    if (!order || !user) return

    const otherUserId = isSellerView ? order.buyerId : order.sellerId
    
    try {
      // Get or create conversation between users
      const conversationId = await FirebaseService.getOrCreateConversation(user.uid, otherUserId)
      
      // Redirect to messages with the specific conversation
      router.push(`/messages?conversation=${conversationId}`)
    } catch (error) {
      console.error("Failed to create conversation:", error)
      toast({
        title: "Error", 
        description: "Failed to open conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePaymentConfirmation = async (received: boolean) => {
    if (!order || !user || !isSellerView) return

    try {
      const message = received 
        ? `Payment RECEIVED for Order #${order.id.slice(-8)}: $${order.paymentDetails.amount} via ${order.paymentMethod.toUpperCase()}`
        : `Payment NOT RECEIVED for Order #${order.id.slice(-8)}: $${order.paymentDetails.amount} via ${order.paymentMethod.toUpperCase()}`

      // Send message to admin
      await FirebaseService.sendMessageToAdmin(
        user.uid,
        `Payment ${received ? 'Confirmation' : 'Issue'} - Order #${order.id.slice(-8)}`,
        message,
        received ? "low" : "high"
      )

      // If payment not received, also create a report
      if (!received) {
        await FirebaseService.createReport({
          reporterId: user.uid,
          reportedId: order.id,
          reportedType: "order" as any,
          category: "other",
          description: `Payment Issue: Payment not received for Order #${order.id.slice(-8)}. Amount: $${order.paymentDetails.amount} via ${order.paymentMethod.toUpperCase()}. Seller is reporting non-payment.`,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      toast({
        title: received ? "Payment Confirmed" : "Payment Issue Reported",
        description: received 
          ? "Admin has been notified that payment was received."
          : "Admin has been notified and a report has been created for payment not received.",
      })
    } catch (error) {
      console.error("Failed to process payment confirmation:", error)
      toast({
        title: "Error",
        description: "Failed to process payment confirmation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "disputed":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "paid":
        return <CreditCard className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      case "disputed":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || !order || !box) {
    return null
  }

  const country = COUNTRIES.find(c => c.code === order.shippingAddress.country)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Order #{order.id.slice(-8)}</h1>
              <p className="text-muted-foreground">
                {isSellerView ? "Sale" : "Purchase"} placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <Badge className={getStatusColor(order.status)}>
                {order.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Alert for buyer if payment is crypto */}
          {isBuyerView && order.paymentMethod === "crypto" && order.status === "pending" && (
            <Alert>
              <Bitcoin className="h-4 w-4" />
              <AlertDescription>
                Please send the payment to the seller's wallet address and notify them once done.
                Payment Amount: ${order.paymentDetails.amount} in {order.paymentDetails.cryptoDetails?.cryptocurrency}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
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
                      <span className="text-sm">Qty: {order.quantity}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Price per item:</span>
                    <span>${(order.paymentDetails.amount / order.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{order.quantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${order.paymentDetails.amount.toFixed(2)}</span>
                  </div>
                </div>

                {order.trackingNumber && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Tracking Number</Label>
                      <p className="font-mono text-sm">{order.trackingNumber}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment & Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment & Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method */}
                <div>
                  <h4 className="font-medium mb-2">Payment Method</h4>
                  <div className="flex items-center gap-2">
                    {order.paymentMethod === "crypto" ? <Bitcoin className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    <span className="capitalize">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Cryptocurrency"}</span>
                  </div>
                  
                  {order.paymentMethod === "crypto" && order.paymentDetails.cryptoDetails && (
                    <div className="mt-2 p-3 bg-muted rounded-lg text-sm space-y-1">
                      <div>Currency: {order.paymentDetails.cryptoDetails.cryptocurrency}</div>
                      <div>Seller Wallet: {order.paymentDetails.cryptoDetails.walletAddress}</div>
                      <div>Buyer Wallet: {order.paymentDetails.cryptoDetails.buyerAddress}</div>
                      {order.paymentDetails.cryptoDetails.transactionHash && (
                        <div>Transaction: {order.paymentDetails.cryptoDetails.transactionHash}</div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{order.shippingAddress.fullName}</div>
                    <div>{order.shippingAddress.addressLine1}</div>
                    {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</div>
                    <div>{country?.name}</div>
                    <div>Phone: {order.shippingAddress.phoneNumber}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seller Actions */}
          {isSellerView && (
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Update order status and manage shipping</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {order.status === "pending" && (
                    <>
                      <Button 
                        onClick={() => handleStatusUpdate("processing")}
                        disabled={processing}
                        className="w-full"
                      >
                        Mark as Processing
                      </Button>
                      <Button 
                        onClick={() => handleStatusUpdate("cancelled")}
                        disabled={processing}
                        variant="destructive"
                        className="w-full"
                      >
                        Cancel Order
                      </Button>
                    </>
                  )}
                  
                  {(order.status === "pending" || order.status === "processing") && order.paymentMethod === "crypto" && (
                    <Button 
                      onClick={() => handleStatusUpdate("paid")}
                      disabled={processing}
                      variant="outline"
                      className="w-full"
                    >
                      Confirm Payment
                    </Button>
                  )}

                  {(order.status === "processing" || order.status === "paid") && (
                    <Button 
                      onClick={() => handleStatusUpdate("shipped")}
                      disabled={processing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Mark as Shipped
                    </Button>
                  )}

                  {order.status === "shipped" && (
                    <Button 
                      onClick={() => handleStatusUpdate("delivered")}
                      disabled={processing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Mark as Delivered
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleContactUser}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Buyer
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleReportIssue}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </div>

                {/* Payment Confirmation Section for Sellers */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Confirmation (Admin Notification)
                  </h4>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handlePaymentConfirmation(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={processing}
                    >
                      Payment Received
                    </Button>
                    <Button
                      onClick={() => handlePaymentConfirmation(false)}
                      variant="destructive"
                      className="flex-1"
                      disabled={processing}
                    >
                      Payment Not Received
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will notify admin about the payment status for this order.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Buyer Actions */}
          {isBuyerView && (
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
                <CardDescription>Track your order and take actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {order.status === "delivered" && (
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Star className="h-4 w-4 mr-2" />
                      Leave Review
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContactUser}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleReportIssue}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
