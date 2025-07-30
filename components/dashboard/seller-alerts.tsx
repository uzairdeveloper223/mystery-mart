"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useAuth } from "@/components/providers/auth-provider"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Package,
  MessageCircle,
  TrendingDown,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  ShoppingCart
} from "lucide-react"

interface SellerDashboardData {
  pendingInquiries: any[]
  lowStockBoxes: any[]
  outOfStockBoxes: any[]
  recentSales: any[]
}

export function SellerAlerts() {
  const { user } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.canSell) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      const data = await FirebaseService.getSellerDashboardData(user.uid)
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching seller dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user?.canSell) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner size="sm" />
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { pendingInquiries, lowStockBoxes, outOfStockBoxes } = dashboardData
  const totalAlerts = pendingInquiries.length + lowStockBoxes.length + outOfStockBoxes.length

  if (totalAlerts === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending actions required for your boxes.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Seller Alerts</span>
            <Badge variant="secondary">{totalAlerts}</Badge>
          </CardTitle>
          <CardDescription>
            Important notifications about your mystery boxes and sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Purchase Inquiries */}
          {pendingInquiries.length > 0 && (
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {pendingInquiries.length} new purchase inquir{pendingInquiries.length === 1 ? 'y' : 'ies'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customers are interested in buying your boxes. After completing sales, remember to update your inventory.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/messages")}
                  >
                    View Messages
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Low Stock Alerts */}
          {lowStockBoxes.length > 0 && (
            <Alert className="border-yellow-500">
              <TrendingDown className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {lowStockBoxes.length} box{lowStockBoxes.length === 1 ? '' : 'es'} running low on stock
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      These boxes have 2 or fewer items remaining. Consider restocking soon.
                    </p>
                    <div className="mt-2 space-y-1">
                      {lowStockBoxes.slice(0, 3).map((box) => {
                        const remaining = (box.quantity || 0) - (box.soldQuantity || 0)
                        return (
                          <div key={box.id} className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[200px]">{box.title}</span>
                            <Badge variant="outline" className="text-yellow-600">
                              {remaining} left
                            </Badge>
                          </div>
                        )
                      })}
                      {lowStockBoxes.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{lowStockBoxes.length - 3} more boxes
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard?tab=inventory")}
                  >
                    Manage Stock
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Out of Stock Alerts */}
          {outOfStockBoxes.length > 0 && (
            <Alert className="border-red-500">
              <Package className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {outOfStockBoxes.length} box{outOfStockBoxes.length === 1 ? ' is' : 'es are'} out of stock
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      These boxes are no longer available for purchase. Restock or mark as unavailable.
                    </p>
                    <div className="mt-2 space-y-1">
                      {outOfStockBoxes.slice(0, 3).map((box) => (
                        <div key={box.id} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{box.title}</span>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      ))}
                      {outOfStockBoxes.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{outOfStockBoxes.length - 3} more boxes
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard?tab=inventory")}
                  >
                    Restock
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/sell")}
            >
              <Package className="h-3 w-3 mr-1" />
              Add New Box
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard?tab=sales")}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              View Sales
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/messages")}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              All Messages
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Box Management Links */}
      {(lowStockBoxes.length > 0 || outOfStockBoxes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Inventory Management</CardTitle>
            <CardDescription>
              Directly manage inventory for boxes that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...lowStockBoxes, ...outOfStockBoxes].slice(0, 5).map((box) => {
                const remaining = (box.quantity || 0) - (box.soldQuantity || 0)
                const isOutOfStock = remaining <= 0
                
                return (
                  <div key={box.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium truncate">{box.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={isOutOfStock ? "destructive" : "outline"}
                          className={!isOutOfStock ? "text-yellow-600" : ""}
                        >
                          {isOutOfStock ? "Out of Stock" : `${remaining} left`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ${box.price}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/boxes/${box.id}/edit/order`)}
                    >
                      Manage
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}