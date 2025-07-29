"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  Star,
  Camera,
  MapPin,
  User,
  CreditCard,
  ArrowLeft,
} from "lucide-react"
import type { Order, MysteryBox } from "@/lib/types"

const orderStatuses = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-500" },
  { value: "processing", label: "Processing", icon: Package, color: "bg-purple-500" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-orange-500" },
  { value: "delivered", label: "Delivered", icon: CheckCircle, color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", icon: AlertCircle, color: "bg-red-500" },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [box, setBox] = useState<MysteryBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [statusNote, setStatusNote] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user && params.id) {
      fetchOrderDetails()
    }
  }, [user, authLoading, params.id, router])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const orderId = params.id as string
      const orderData = await FirebaseService.getOrder(orderId)

      if (!orderData) {
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      // Check if user has access to this order
      if (orderData.buyerId !== user?.uid && orderData.sellerId !== user?.uid) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this order",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setOrder(orderData)
      setNewStatus(orderData.status)
      setTrackingNumber(orderData.trackingNumber || "")

      // Fetch box details
      if (orderData.items?.[0]?.boxId) {
        const boxData = await FirebaseService.getBox(orderData.items[0].boxId)
        setBox(boxData)
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || !user) return

    setUpdating(true)
    try {
      const updateData: any = {}

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber
      }

      if (statusNote) {
        updateData.statusNote = statusNote
        updateData.statusUpdatedBy = user.uid
        updateData.statusUpdatedAt = new Date().toISOString()
      }

      await FirebaseService.updateOrderStatus(order.id, newStatus as Order["status"], updateData)

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })

      // Refresh order data
      await fetchOrderDetails()
      setStatusNote("")
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return orderStatuses.find((s) => s.value === status) || orderStatuses[0]
  }

  const isSeller = user?.uid === order?.sellerId
  const isBuyer = user?.uid === order?.buyerId

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || !order) {
    return null
  }

  const statusInfo = getStatusInfo(order.status)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Order #{order.id.slice(-8)}</h1>
              <p className="text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge className={`${statusInfo.color} text-white`}>
            <statusInfo.icon className="h-4 w-4 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={box?.images?.[0] || "/placeholder.svg?height=80&width=80"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      <p className="text-sm text-muted-foreground">Category: {box?.category || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = orderStatuses.findIndex((s) => s.value === order.status) >= index
                    const isCurrent = status.value === order.status

                    return (
                      <div key={status.value} className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${
                            isCompleted ? status.color : "bg-gray-200"
                          } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                        >
                          <status.icon className={`h-4 w-4 ${isCompleted ? "text-white" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                            {status.label}
                          </p>
                          {isCurrent && order.statusNote && (
                            <p className="text-sm text-muted-foreground mt-1">{order.statusNote}</p>
                          )}
                          {isCurrent && order.statusUpdatedAt && (
                            <p className="text-xs text-muted-foreground">
                              Updated: {new Date(order.statusUpdatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Seller Actions */}
            {isSeller && order.status !== "delivered" && order.status !== "cancelled" && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Order Status</CardTitle>
                  <CardDescription>Update the order status and provide tracking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Order Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses
                          .filter((status) => status.value !== "cancelled")
                          .map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(newStatus === "shipped" || order.status === "shipped") && (
                    <div className="space-y-2">
                      <Label>Tracking Number</Label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Status Note (Optional)</Label>
                    <Textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add a note about this status update..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updating || newStatus === order.status}
                    className="mystery-gradient text-white"
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Order Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No messages yet</p>
                  <Button variant="outline">Start Conversation</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.paymentDetails.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${order.shippingCost?.toFixed(2) || "0.00"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${(order.paymentDetails.amount + (order.shippingCost || 0)).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Shipping Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Method</span>
                    <span className="capitalize">{order.paymentDetails.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span className="text-sm font-mono">{order.paymentDetails.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge variant={order.paymentDetails.status === "completed" ? "default" : "secondary"}>
                      {order.paymentDetails.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono text-sm">{order.trackingNumber}</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Track Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{isBuyer ? "Seller" : "Buyer"} Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{isBuyer ? order.seller?.displayName : order.buyer?.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{isBuyer ? order.seller?.username : order.buyer?.username}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {isBuyer ? order.seller?.rating?.toFixed(1) : order.buyer?.rating?.toFixed(1)} rating
                    </span>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {isBuyer && order.status === "delivered" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Star className="h-4 w-4 mr-2" />
                    Rate Seller
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Camera className="h-4 w-4 mr-2" />
                    Share Unboxing
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Report Issue
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
