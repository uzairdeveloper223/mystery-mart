"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import {
  Package,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Users,
  MessageCircle,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react"
import type { MysteryBox } from "@/lib/types"

interface PurchaseInquiry {
  id: string
  buyerId: string
  buyerName: string
  conversationId: string
  createdAt: string
  status: "pending" | "fulfilled" | "cancelled"
}

export default function BoxOrderManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const boxId = params.id as string
  const [box, setBox] = useState<MysteryBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [purchaseInquiries, setPurchaseInquiries] = useState<PurchaseInquiry[]>([])

  const [formData, setFormData] = useState({
    quantity: 0,
    soldQuantity: 0,
    status: "active" as MysteryBox["status"],
    notes: ""
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    
    fetchBoxData()
    fetchPurchaseInquiries()
  }, [boxId, user])

  const fetchBoxData = async () => {
    try {
      const boxData = await FirebaseService.getBox(boxId)
      if (!boxData) {
        toast({
          title: "Error",
          description: "Mystery box not found",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      if (boxData.sellerId !== user?.uid) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to manage this box",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setBox(boxData)
      setFormData({
        quantity: boxData.quantity || 0,
        soldQuantity: boxData.soldQuantity || 0,
        status: boxData.status,
        notes: ""
      })
    } catch (error) {
      console.error("Error fetching box:", error)
      toast({
        title: "Error",
        description: "Failed to load box data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseInquiries = async () => {
    try {
      // Get all conversations for this seller
      const conversations = await new Promise<any[]>((resolve) => {
        let unsubscribe: (() => void) | undefined
        unsubscribe = FirebaseService.subscribeToUserConversations(user!.uid, (convs) => {
          if (unsubscribe) {
            unsubscribe()
          }
          resolve(convs)
        })
      })

      // Filter conversations that mention this box
      const boxInquiries: PurchaseInquiry[] = []
      
      for (const conv of conversations) {
        const messages = await FirebaseService.getConversation(conv.id)
        const purchaseMessages = messages.filter(msg => 
          msg.content.includes(boxId) && 
          msg.content.includes("want to buy") &&
          msg.senderId !== user!.uid
        )

        for (const msg of purchaseMessages) {
          const buyer = await FirebaseService.getUser(msg.senderId)
          if (buyer) {
            boxInquiries.push({
              id: msg.id,
              buyerId: msg.senderId,
              buyerName: buyer.fullName,
              conversationId: conv.id,
              createdAt: msg.createdAt,
              status: "pending" // We'll track this separately later
            })
          }
        }
      }

      // Sort by most recent first
      boxInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setPurchaseInquiries(boxInquiries)
    } catch (error) {
      console.error("Error fetching purchase inquiries:", error)
    }
  }

  const handleQuantityChange = (field: "quantity" | "soldQuantity", value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }))
  }

  const handleSave = async () => {
    if (!box) return

    setSaving(true)
    try {
      const updates: Partial<MysteryBox> = {
        quantity: formData.quantity,
        soldQuantity: formData.soldQuantity,
        status: formData.soldQuantity >= formData.quantity ? "out_of_stock" : formData.status
      }

      await FirebaseService.updateBox(boxId, updates)

      // Create notification for significant changes
      if (formData.soldQuantity > (box.soldQuantity || 0)) {
        const soldCount = formData.soldQuantity - (box.soldQuantity || 0)
        await FirebaseService.createNotification({
          userId: user!.uid,
          type: "order",
          title: "Inventory Updated",
          message: `You've marked ${soldCount} item(s) as sold for "${box.title}"`,
        })
      }

      toast({
        title: "Success",
        description: "Box inventory updated successfully",
      })

      // Refresh data
      await fetchBoxData()
    } catch (error) {
      console.error("Error updating box:", error)
      toast({
        title: "Error",
        description: "Failed to update box inventory",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsSold = (quantity: number = 1) => {
    setFormData(prev => ({
      ...prev,
      soldQuantity: Math.min(prev.quantity, prev.soldQuantity + quantity)
    }))
  }

  const getStockStatus = () => {
    const remaining = formData.quantity - formData.soldQuantity
    if (remaining <= 0) return { status: "out_of_stock", color: "text-red-500", text: "Out of Stock" }
    if (remaining <= 2) return { status: "low_stock", color: "text-yellow-500", text: "Low Stock" }
    return { status: "in_stock", color: "text-green-500", text: "In Stock" }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingSpinner variant="mystery" size="lg" text="Loading box data..." fullScreen />
        <Footer />
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Box Not Found</h1>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
        <Footer />
      </div>
    )
  }

  const stockStatus = getStockStatus()
  const remainingStock = formData.quantity - formData.soldQuantity

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Order Management</h1>
                <p className="text-muted-foreground text-lg">{box.title}</p>
              </div>
              <Badge className={stockStatus.color}>
                {stockStatus.text}
              </Badge>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Inventory Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Inventory Management</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your box quantity and track sales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formData.quantity}</div>
                        <div className="text-sm text-muted-foreground">Total Quantity</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formData.soldQuantity}</div>
                        <div className="text-sm text-muted-foreground">Sold</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className={`text-2xl font-bold ${stockStatus.color}`}>{remainingStock}</div>
                        <div className="text-sm text-muted-foreground">Remaining</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quantity Controls */}
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="total-quantity">Total Quantity</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange("quantity", formData.quantity - 1)}
                              disabled={formData.quantity <= formData.soldQuantity}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id="total-quantity"
                              type="number"
                              min={formData.soldQuantity}
                              value={formData.quantity}
                              onChange={(e) => handleQuantityChange("quantity", parseInt(e.target.value) || 0)}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange("quantity", formData.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sold-quantity">Sold Quantity</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange("soldQuantity", formData.soldQuantity - 1)}
                              disabled={formData.soldQuantity <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id="sold-quantity"
                              type="number"
                              min="0"
                              max={formData.quantity}
                              value={formData.soldQuantity}
                              onChange={(e) => handleQuantityChange("soldQuantity", parseInt(e.target.value) || 0)}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange("soldQuantity", formData.soldQuantity + 1)}
                              disabled={formData.soldQuantity >= formData.quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsSold(1)}
                          disabled={remainingStock <= 0}
                        >
                          Mark 1 as Sold
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsSold(5)}
                          disabled={remainingStock < 5}
                        >
                          Mark 5 as Sold
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, soldQuantity: prev.quantity }))}
                          disabled={remainingStock <= 0}
                        >
                          Mark All as Sold
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Status Control */}
                    <div className="space-y-2">
                      <Label htmlFor="box-status">Box Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: MysteryBox["status"]) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          <SelectItem value="removed">Removed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this inventory update..."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full mystery-gradient text-white"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Purchase Inquiries */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Purchase Inquiries</span>
                      {purchaseInquiries.length > 0 && (
                        <Badge variant="secondary">{purchaseInquiries.length}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Customers who have expressed interest in buying this box
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {purchaseInquiries.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No purchase inquiries yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchaseInquiries.map((inquiry) => (
                          <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{inquiry.buyerName}</p>
                              <p className="text-sm text-muted-foreground">
                                Inquired {new Date(inquiry.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">Pending</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/messages?conversation=${inquiry.conversationId}`)}
                              >
                                View Chat
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stock Alert */}
              {remainingStock <= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Alert className={remainingStock === 0 ? "border-red-500" : "border-yellow-500"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {remainingStock === 0 
                        ? "This box is out of stock. Consider restocking or marking as unavailable."
                        : `Only ${remainingStock} item(s) left in stock. Consider restocking soon.`
                      }
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Box Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Box Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Views</span>
                      </div>
                      <span className="font-medium">{box.views || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Listed</span>
                      </div>
                      <span className="font-medium">{new Date(box.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Price</span>
                      </div>
                      <span className="font-medium">${box.price}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Sales Rate</span>
                      </div>
                      <span className="font-medium">
                        {formData.quantity > 0 ? Math.round((formData.soldQuantity / formData.quantity) * 100) : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/boxes/${boxId}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Box Page
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/boxes/${boxId}/edit`)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Edit Box Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push("/messages")}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View All Messages
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}