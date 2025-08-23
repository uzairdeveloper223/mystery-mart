"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MysteryBoxCard } from "@/components/boxes/mystery-box-card"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import {
  Star,
  MapPin,
  Calendar,
  Package,
  Users,
  MessageCircle,
  Flag,
  CheckCircle,
  Globe,
  Twitter,
  Instagram,
  TrendingUp,
  Award,
  Shield,
  Heart,
  HeartOff,
  DollarSign,
} from "lucide-react"
import type { UserProfile, MysteryBox, Order } from "@/lib/types"
import Link from "next/link"

export default function SellerProfilePage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [seller, setSeller] = useState<UserProfile | null>(null)
  const [boxes, setBoxes] = useState<MysteryBox[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("boxes")
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [showDonation, setShowDonation] = useState(false)
  const [donorEthAddress, setDonorEthAddress] = useState("")
  const [donationVerifying, setDonationVerifying] = useState(false)

  useEffect(() => {
    if (params.username) {
      fetchSellerProfile()
    }
  }, [params.username])

  const fetchSellerProfile = async () => {
    try {
      setLoading(true)
      const username = params.username as string

      // Get seller by username
      const sellerData = await FirebaseService.getUserByUsername(username)
      if (!sellerData) {
        setSeller(null)
        return
      }

      setSeller(sellerData)

      // Fetch seller's active boxes
      const sellerBoxes = await FirebaseService.getBoxes({
        sellerId: sellerData.uid,
        status: "active",
        limit: 50,
      })
      setBoxes(sellerBoxes)

      // Fetch seller's completed orders for stats
      const sellerOrders = await FirebaseService.getUserOrders(sellerData.uid, "seller")
      setOrders(sellerOrders)

      // Check if current user is following this seller
      if (user) {
        const followStatus = await FirebaseService.checkFollowStatus(user.uid, sellerData.uid)
        setIsFollowing(followStatus)
      }

      // Get followers count
      const followers = await FirebaseService.getFollowersCount(sellerData.uid)
      setFollowersCount(followers)
    } catch (error) {
      console.error("Failed to fetch seller profile:", error)
      toast({
        title: "Error",
        description: "Failed to load seller profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!user || !seller) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow sellers",
        variant: "destructive",
      })
      return
    }

    try {
      if (isFollowing) {
        await FirebaseService.unfollowUser(user.uid, seller.uid)
        setIsFollowing(false)
        setFollowersCount((prev) => prev - 1)
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${seller.fullName}`,
        })
      } else {
        await FirebaseService.followUser(user.uid, seller.uid)
        setIsFollowing(true)
        setFollowersCount((prev) => prev + 1)
        toast({
          title: "Following",
          description: `You are now following ${seller.fullName}`,
        })

        // Create notification for seller
        await FirebaseService.createNotification({
          userId: seller.uid,
          type: "system",
          title: "New Follower",
          message: `${user.fullName} started following you`,
          actionUrl: `/seller/${user.username}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Failed to follow/unfollow:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    }
  }

  const handleMessage = async () => {
    if (!user || !seller) {
      toast({
        title: "Authentication Required",
        description: "Please log in to message sellers",
        variant: "destructive",
      })
      return
    }

    try {
      // Create or get conversation
      const conversationId = await FirebaseService.createConversation(user.uid, seller.uid)
      window.location.href = `/messages?conversation=${conversationId}`
    } catch (error) {
      console.error("Failed to start conversation:", error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    }
  }

  const handleReport = async () => {
    if (!user || !seller) {
      toast({
        title: "Authentication Required",
        description: "Please log in to report users",
        variant: "destructive",
      })
      return
    }

    try {
      await FirebaseService.createReport({
        reporterId: user.uid,
        reportedId: seller.uid,
        reportedType: "user",
        category: "other",
        description: "Reported via seller profile",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We'll review it shortly.",
      })
    } catch (error) {
      console.error("Failed to submit report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      })
    }
  }

  const handleDonateClick = async () => {
    if (!user || !seller) {
      toast({
        title: "Authentication Required",
        description: "Please log in to donate",
        variant: "destructive",
      })
      return
    }

    // Check if seller has ETH address
    if (!seller.ethAddress) {
      toast({
        title: "Donations Not Available",
        description: "This seller hasn't set up their donation address yet",
        variant: "destructive",
      })
      return
    }

    // Check if user has ETH address
    if (!user.ethAddress) {
      toast({
        title: "ETH Address Required",
        description: "Please add your ETH address in settings before donating",
        variant: "destructive",
      })
      return
    }

    setDonorEthAddress(user.ethAddress)
    setShowDonation(true)
  }

  const handleDonationConfirmation = async () => {
    if (!user || !seller || !donorEthAddress) return

    setDonationVerifying(true)
    try {
      // Start verification process
      await FirebaseService.verifyEthDonation({
        donorId: user.uid,
        recipientId: seller.uid,
        donorAddress: donorEthAddress,
        recipientAddress: seller.ethAddress!,
      })

      toast({
        title: "Verification Started",
        description: "We're checking for your donation. Both you and the seller will be notified once verified.",
      })

      setShowDonation(false)
      setDonorEthAddress("")
    } catch (error) {
      console.error("Failed to start donation verification:", error)
      toast({
        title: "Error",
        description: "Failed to start donation verification",
        variant: "destructive",
      })
    } finally {
      setDonationVerifying(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Seller Not Found</h1>
            <p className="text-muted-foreground">The seller you're looking for doesn't exist.</p>
            <Link href="/boxes">
              <Button className="mt-4 mystery-gradient text-white">Browse Mystery Boxes</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Calculate seller stats from real data
  const completedOrders = orders.filter((order) => order.status === "delivered").length
  const totalRevenue = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + order.paymentDetails.amount, 0)
  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
  const responseTime = seller.stats?.responseTime || 24 // hours
  const fulfillmentRate = seller.stats?.fulfillmentRate || 95 // percentage

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={seller.profilePicture || "/placeholder.svg"} alt={seller.fullName} />
                  <AvatarFallback className="text-2xl">{seller.fullName?.charAt(0) || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold">{seller.fullName}</h1>
                  {seller.isVerified && (
                    <Badge className="bg-blue-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge
                    className={`${seller.loyaltyTier === "diamond" ? "bg-purple-500" : seller.loyaltyTier === "gold" ? "bg-yellow-500" : seller.loyaltyTier === "silver" ? "bg-gray-400" : "bg-orange-600"} text-white capitalize`}
                  >
                    {seller.loyaltyTier}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">@{seller.username}</p>
                {seller.location && (
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    {seller.location}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Member since {new Date(seller.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="text-2xl font-bold">{(seller.rating || 0).toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-xs text-muted-foreground">({completedOrders} orders)</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Package className="h-5 w-5 text-blue-500 mr-1" />
                      <span className="text-2xl font-bold">{seller.totalSales}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Sales</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-green-500 mr-1" />
                      <span className="text-2xl font-bold">{followersCount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-5 w-5 text-purple-500 mr-1" />
                      <span className="text-2xl font-bold">${(averageOrderValue || 0).toFixed(0)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Order</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {user && user.uid !== seller.uid && (
                    <>
                      <Button onClick={handleFollow} className="mystery-gradient text-white">
                        {isFollowing ? (
                          <>
                            <HeartOff className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleMessage}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {seller.firegramLinked && seller.firegramUsername && (
                        <Button
                          asChild
                          variant="outline"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                        >
                          <a
                            href={`https://firegram-social-app.vercel.app/profile/${seller.firegramUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View on Firegram
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleDonateClick}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Donate ETH
                      </Button>
                      <Button variant="outline" onClick={handleReport}>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {seller.bio && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-muted-foreground leading-relaxed">{seller.bio}</p>
              </div>
            )}

            {/* Social Links */}
            {(seller.socialLinks?.website || seller.socialLinks?.twitter || seller.socialLinks?.instagram) && (
              <div className="mt-4 flex flex-wrap gap-4">
                {seller.socialLinks?.website && (
                  <a
                    href={seller.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
                {seller.socialLinks?.twitter && (
                  <a
                    href={`https://twitter.com/${seller.socialLinks.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <Twitter className="h-4 w-4 mr-1" />
                    {seller.socialLinks.twitter}
                  </a>
                )}
                {seller.socialLinks?.instagram && (
                  <a
                    href={`https://instagram.com/${seller.socialLinks.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <Instagram className="h-4 w-4 mr-1" />
                    {seller.socialLinks.instagram}
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ETH Donation Modal */}
        {showDonation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <CardTitle>Donate ETH to {seller.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Send Ethereum directly to support this seller. We'll verify the transaction automatically.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-medium">How to donate:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Send ETH from your address to the seller's address below</li>
                    <li>2. Click "I have donated" when the transaction is sent</li>
                    <li>3. We'll verify the transaction using Etherscan API</li>
                    <li>4. Both you and the seller will be notified once verified</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your ETH Address (From):</label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm">
                    {donorEthAddress}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Seller's ETH Address (To):</label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {seller.ethAddress}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleDonationConfirmation} 
                    disabled={donationVerifying}
                    className="flex-1 mystery-gradient text-white"
                  >
                    {donationVerifying ? "Verifying..." : "I have donated"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDonation(false)}>
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Note: Make sure to send the transaction before clicking "I have donated". 
                  It may take a few minutes to verify on the blockchain.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seller Details */}
        <div className="grid lg:grid-cols-4 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Response Time</span>
                <span className="text-sm font-medium">
                  {responseTime < 24 ? `${responseTime}h` : `${Math.round(responseTime / 24)}d`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Fulfillment Rate</span>
                <span className="text-sm font-medium">{fulfillmentRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Revenue</span>
                <span className="text-sm font-medium">${(totalRevenue || 0).toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Trust & Safety</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verified</span>
                <Badge variant={seller.isEmailVerified ? "default" : "destructive"}>
                  {seller.isEmailVerified ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Identity Verified</span>
                <Badge variant={seller.isVerified ? "default" : "secondary"}>{seller.isVerified ? "Yes" : "No"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Return Rate</span>
                <span className="text-sm font-medium">{seller.stats?.returnRate || 2}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Inventory</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Active Boxes</span>
                <span className="text-sm font-medium">{boxes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Categories</span>
                <span className="text-sm font-medium">{[...new Set(boxes.map((box) => box.category))].length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Price</span>
                <span className="text-sm font-medium">
                  ${boxes.length > 0 ? (boxes.reduce((sum, box) => sum + (box.price || 0), 0) / boxes.length).toFixed(0) : "0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {seller.totalSales >= 100 && (
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Top Seller</p>
                    <p className="text-xs text-muted-foreground">100+ sales</p>
                  </div>
                </div>
              )}
              {seller.rating >= 4.5 && (
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Highly Rated</p>
                    <p className="text-xs text-muted-foreground">4.5+ rating</p>
                  </div>
                </div>
              )}
              {responseTime <= 12 && (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Fast Responder</p>
                    <p className="text-xs text-muted-foreground">Quick replies</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="boxes">Mystery Boxes ({boxes.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({completedOrders})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="boxes" className="mt-6">
            {boxes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boxes.map((box) => (
                  <MysteryBoxCard key={box.id} box={box} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No mystery boxes available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {orders
                .filter((order) => order.rating)
                .slice(0, 10)
                .map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < (order.rating?.stars || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(order.rating?.createdAt || order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{order.rating?.comment || "Great seller!"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {orders.filter((order) => order.rating).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Member Since</p>
                    <p className="text-sm text-muted-foreground">{new Date(seller.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Loyalty Tier</p>
                    <Badge className="capitalize">{seller.loyaltyTier}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Total Sales</p>
                    <p className="text-sm text-muted-foreground">{seller.totalSales} boxes sold</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Languages</p>
                    <p className="text-sm text-muted-foreground">English</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact & Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Response Time</p>
                    <p className="text-sm text-muted-foreground">
                      {responseTime < 24 ? `${responseTime} hours` : `${Math.round(responseTime / 24)} days`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Support</p>
                    <p className="text-sm text-muted-foreground">Available via messages</p>
                  </div>
                  {user && user.uid !== seller.uid && (
                    <Button onClick={handleMessage} className="w-full mystery-gradient text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Seller
                    </Button>
                  )}
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
