"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  DollarSign,
  Star,
  TrendingUp,
  Eye,
  Heart,
  ShoppingCart,
  MessageCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import type { MysteryBox, Order } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBoxes: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalViews: 0,
    totalLikes: 0,
  })
  const [myBoxes, setMyBoxes] = useState<MysteryBox[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [salesOrders, setSalesOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      fetchDashboardData()
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      const [boxes, buyerOrders, sellerOrders] = await Promise.all([
        FirebaseService.getBoxes({ sellerId: user.uid }),
        FirebaseService.getUserOrders(user.uid, "buyer"),
        FirebaseService.getUserOrders(user.uid, "seller"),
      ])

      setMyBoxes(boxes)
      setMyOrders(buyerOrders)
      setSalesOrders(sellerOrders)

      // Calculate stats
      const totalViews = boxes.reduce((sum, box) => sum + (box.views || 0), 0)
      const totalLikes = boxes.reduce((sum, box) => sum + (box.likes || 0), 0)
      const totalRevenue = sellerOrders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + order.paymentDetails.amount, 0)

      setStats({
        totalBoxes: boxes.length,
        totalSales: sellerOrders.filter((order) => order.status === "delivered").length,
        totalRevenue,
        averageRating: user.rating || 0,
        totalViews,
        totalLikes,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBox = async (boxId: string) => {
    if (!confirm("Are you sure you want to delete this mystery box?")) return

    try {
      await FirebaseService.updateBox(boxId, { status: "removed" })
      await fetchDashboardData()
      toast({
        title: "Success",
        description: "Mystery box has been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove mystery box",
        variant: "destructive",
      })
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "sold":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "removed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.fullName} />
              <AvatarFallback className="text-xl">{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user.fullName}!</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href="/sell">
              <Button className="mystery-gradient text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Box
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Boxes</p>
                  <p className="text-2xl font-bold">{stats.totalBoxes}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">${(stats.totalRevenue || 0).toFixed(0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{(stats.averageRating || 0).toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="boxes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="boxes">My Boxes ({myBoxes.length})</TabsTrigger>
            <TabsTrigger value="purchases">Purchases ({myOrders.length})</TabsTrigger>
            <TabsTrigger value="sales">Sales ({salesOrders.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="boxes">
            <Card>
              <CardHeader>
                <CardTitle>My Mystery Boxes</CardTitle>
                <CardDescription>Manage your listed mystery boxes</CardDescription>
              </CardHeader>
              <CardContent>
                {myBoxes.length > 0 ? (
                  <div className="space-y-4">
                    {myBoxes.map((box) => (
                      <div key={box.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="relative w-16 h-16 flex-shrink-0">
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
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm font-medium">${box.price}</span>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span className="text-xs">{box.views || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span className="text-xs">{box.likes || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(box.status)}>{box.status}</Badge>
                          <Link href={`/boxes/${box.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBox(box.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No mystery boxes yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first mystery box to start selling</p>
                    <Link href="/sell">
                      <Button className="mystery-gradient text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Box
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>My Purchases</CardTitle>
                <CardDescription>Track your mystery box orders</CardDescription>
              </CardHeader>
              <CardContent>
                {myOrders.length > 0 ? (
                  <div className="space-y-4">
                    {myOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium">${order.paymentDetails.amount}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
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
                      <Button className="mystery-gradient text-white">Browse Mystery Boxes</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>My Sales</CardTitle>
                <CardDescription>Track orders from your mystery boxes</CardDescription>
              </CardHeader>
              <CardContent>
                {salesOrders.length > 0 ? (
                  <div className="space-y-4">
                    {salesOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">Sale #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium">${order.paymentDetails.amount}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                          <Button variant="outline" size="sm">
                            Manage Order
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
                    <p className="text-muted-foreground mb-4">Create mystery boxes to start making sales</p>
                    <Link href="/sell">
                      <Button className="mystery-gradient text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Mystery Box
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span className="font-medium">
                        {stats.totalBoxes > 0 ? ((stats.totalSales / stats.totalBoxes) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Views per Box</span>
                      <span className="font-medium">
                        {stats.totalBoxes > 0 ? Math.round(stats.totalViews / stats.totalBoxes) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Revenue per Sale</span>
                      <span className="font-medium">
                        ${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Activity tracking coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
