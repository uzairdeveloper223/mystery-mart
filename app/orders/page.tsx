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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react"
import type { Order, MysteryBox } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"

interface OrderWithBox extends Order {
  box?: MysteryBox
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [buyerOrders, setBuyerOrders] = useState<OrderWithBox[]>([])
  const [sellerOrders, setSellerOrders] = useState<OrderWithBox[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      fetchOrders()
    }
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const [buyerOrdersData, sellerOrdersData] = await Promise.all([
        FirebaseService.getUserOrders(user.uid, "buyer"),
        (user.userType === "seller" || user.userType === "both") 
          ? FirebaseService.getUserOrders(user.uid, "seller")
          : Promise.resolve([])
      ])

      // Fetch box details for each order
      const enhanceBuyerOrders = await Promise.all(
        buyerOrdersData.map(async (order) => {
          const box = await FirebaseService.getBox(order.boxId)
          return { ...order, box }
        })
      )

      const enhanceSellerOrders = await Promise.all(
        sellerOrdersData.map(async (order) => {
          const box = await FirebaseService.getBox(order.boxId)
          return { ...order, box }
        })
      )

      setBuyerOrders(enhanceBuyerOrders)
      setSellerOrders(enhanceSellerOrders)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const OrderCard = ({ order, type }: { order: OrderWithBox; type: "buyer" | "seller" }) => (
    <Card key={order.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src={order.box?.images[0] || "/placeholder.svg"}
              alt={order.box?.title || "Mystery Box"}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{order.box?.title || "Unknown Box"}</h3>
                <p className="text-xs text-muted-foreground">
                  Order #{order.id.slice(-8)} • {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {order.quantity} • ${order.paymentDetails.amount.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <Badge className={getStatusColor(order.status)} variant="secondary">
                  {order.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/order/${order.id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </Link>
              
              <Link href="/messages">
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Message
                </Button>
              </Link>
              
              {type === "buyer" && order.status === "delivered" && (
                <Button size="sm" variant="outline">
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  const defaultTab = user.userType === "buyer" ? "purchases" : "sales"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">
              Track and manage your {user.userType === "buyer" ? "purchases" : user.userType === "seller" ? "sales" : "orders"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                    <p className="text-2xl font-bold">{buyerOrders.length}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {(user.userType === "seller" || user.userType === "both") && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">{sellerOrders.length}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                    <p className="text-2xl font-bold">
                      {[...buyerOrders, ...sellerOrders].filter(order => 
                        order.status === "pending" || order.status === "processing"
                      ).length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Tabs */}
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className={`grid w-full ${user.userType === "buyer" ? "grid-cols-1" : user.userType === "both" ? "grid-cols-2" : "grid-cols-1"}`}>
              {(user.userType === "buyer" || user.userType === "both") && (
                <TabsTrigger value="purchases">
                  My Purchases ({buyerOrders.length})
                </TabsTrigger>
              )}
              {(user.userType === "seller" || user.userType === "both") && (
                <TabsTrigger value="sales">
                  My Sales ({sellerOrders.length})
                </TabsTrigger>
              )}
            </TabsList>

            {(user.userType === "buyer" || user.userType === "both") && (
              <TabsContent value="purchases">
                <Card>
                  <CardHeader>
                    <CardTitle>My Purchases</CardTitle>
                    <CardDescription>Track your mystery box orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {buyerOrders.length > 0 ? (
                      <div className="space-y-4">
                        {buyerOrders
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((order) => (
                            <OrderCard key={order.id} order={order} type="buyer" />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start exploring mystery boxes to make your first purchase
                        </p>
                        <Link href="/boxes">
                          <Button className="mystery-gradient text-white">
                            Browse Mystery Boxes
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {(user.userType === "seller" || user.userType === "both") && (
              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>My Sales</CardTitle>
                    <CardDescription>Manage orders from your mystery boxes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellerOrders.length > 0 ? (
                      <div className="space-y-4">
                        {sellerOrders
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((order) => (
                            <OrderCard key={order.id} order={order} type="seller" />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create mystery boxes to start making sales
                        </p>
                        <Link href="/sell">
                          <Button className="mystery-gradient text-white">
                            Create Mystery Box
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}
