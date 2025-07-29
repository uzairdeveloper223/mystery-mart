"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useMysteryBox } from "@/hooks/use-mystery-boxes"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import {
  Heart,
  Share2,
  ShoppingCart,
  MessageCircle,
  Shield,
  Star,
  Package,
  Truck,
  Clock,
  Eye,
  Flag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Comment } from "@/lib/types"

export default function BoxDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { addToCart, isInCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const boxId = params.id as string
  const { box, loading, error, refreshBox } = useMysteryBox(boxId)

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (boxId) {
      fetchComments()
    }
  }, [boxId])

  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      const fetchedComments = await FirebaseService.getBoxComments(boxId)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!box) return

    try {
      await addToCart(box)
      toast({
        title: "Added to Cart",
        description: "Mystery box has been added to your cart",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      })
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!box) return

    try {
      if (isInWishlist(box.id)) {
        await removeFromWishlist(box.id)
        toast({
          title: "Removed from Wishlist",
          description: "Mystery box has been removed from your wishlist",
        })
      } else {
        await addToWishlist(box)
        toast({
          title: "Added to Wishlist",
          description: "Mystery box has been added to your wishlist",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: box?.title,
          text: box?.description,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Box link has been copied to clipboard",
      })
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || !box) return

    try {
      setSubmittingComment(true)
      await FirebaseService.createComment({
        boxId: box.id,
        userId: user.uid,
        content: newComment.trim(),
        user: {
          username: user.username,
          profilePicture: user.profilePicture,
          isVerified: user.isVerified,
        },
      })

      setNewComment("")
      await fetchComments()
      toast({
        title: "Comment Posted",
        description: "Your comment has been posted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReport = async () => {
    if (!user || !box) return

    try {
      await FirebaseService.createReport({
        reporterId: user.uid,
        reportedId: box.id,
        reportedType: "box",
        category: "inappropriate",
        description: "Reported mystery box",
      })

      toast({
        title: "Report Submitted",
        description: "Thank you for reporting. We'll review this box.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      })
    }
  }

  const nextImage = () => {
    if (box && box.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % box.images.length)
    }
  }

  const prevImage = () => {
    if (box && box.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + box.images.length) % box.images.length)
    }
  }

  const getRarityClass = (rarity: string) => {
    return `rarity-${rarity}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingSpinner />
        <Footer />
      </div>
    )
  }

  if (error || !box) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Mystery Box Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "The mystery box you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.push("/boxes")}>Browse Other Boxes</Button>
        </div>
        <Footer />
      </div>
    )
  }

  const isOwner = user?.uid === box.sellerId
  const inCart = isInCart(box.id)
  const inWishlist = isInWishlist(box.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <Image
                src={box.images[currentImageIndex] || "/placeholder.svg"}
                alt={box.title}
                fill
                className="object-cover"
                priority
              />

              {box.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <div className="absolute top-4 left-4">
                <Badge className={cn("capitalize", getRarityClass(box.rarity))}>{box.rarity}</Badge>
              </div>

              <div className="absolute top-4 right-4 flex space-x-2">
                <Button variant="secondary" size="icon" onClick={handleWishlistToggle}>
                  <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500 text-red-500")} />
                </Button>
                <Button variant="secondary" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                {!isOwner && (
                  <Button variant="secondary" size="icon" onClick={handleReport}>
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {box.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {box.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2",
                      index === currentImageIndex ? "border-primary" : "border-transparent",
                    )}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${box.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{box.title}</h1>
              <p className="text-muted-foreground">{box.category}</p>
            </div>

            {/* Seller Info */}
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={box.seller.profilePicture || "/placeholder.svg"} alt={box.seller.username} />
                <AvatarFallback>{box.seller.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <Link href={`/seller/${box.seller.username}`} className="font-medium hover:underline">
                    @{box.seller.username}
                  </Link>
                  {box.seller.isVerified && <Shield className="h-4 w-4 text-blue-500" />}
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">{(box.seller?.rating || 0).toFixed(1)}</span>
                </div>
              </div>
              {!isOwner && (
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-bold">${box.price}</span>
                <div className="text-sm text-muted-foreground">
                  <div>
                    Est. Value: ${box.estimatedValue?.min || 0} - ${box.estimatedValue?.max || 0}
                  </div>
                  <div className="text-green-600 font-medium">
                    {box.estimatedValue?.min ? Math.round(((box.estimatedValue.min - box.price) / box.price) * 100) : 0}%+ potential value
                  </div>
                </div>
              </div>

              {box.shipping.freeShipping ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-medium">Free Shipping</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm">Shipping: ${box.shipping.shippingCost}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {!isOwner && box.status === "active" && (
                <>
                  <Button
                    className="w-full mystery-gradient text-white"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={inCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {inCart ? "In Cart" : "Add to Cart"}
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" size="lg">
                    Buy Now
                  </Button>
                </>
              )}

              {isOwner && (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full bg-transparent">
                    Edit Listing
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Remove Listing
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{box.views || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{box.likes || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{new Date(box.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">Listed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
              <TabsTrigger value="similar">Similar Boxes</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{box.description}</p>

                    {box.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {box.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Shipping Cost</h3>
                        <p className="text-muted-foreground">
                          {box.shipping.freeShipping ? "Free shipping" : `$${box.shipping.shippingCost}`}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Processing Time</h3>
                        <p className="text-muted-foreground">{box.shipping.processingTime}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Weight</h3>
                        <p className="text-muted-foreground">{box.shipping.weight} lbs</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Dimensions</h3>
                        <p className="text-muted-foreground">
                          {box.shipping.dimensions.length}" × {box.shipping.dimensions.width}" ×{" "}
                          {box.shipping.dimensions.height}"
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Shipping Methods</h3>
                      <div className="space-y-2">
                        {box.shipping.shippingMethods.map((method) => (
                          <div key={method} className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{method}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Add Comment */}
                    {user && !isOwner && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Leave a Comment</h3>
                        <div className="space-y-2">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your thoughts about this mystery box..."
                            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                            maxLength={500}
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">{newComment.length}/500</span>
                            <Button
                              onClick={handleSubmitComment}
                              disabled={!newComment.trim() || submittingComment}
                              size="sm"
                            >
                              {submittingComment ? "Posting..." : "Post Comment"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-4">
                      {loadingComments ? (
                        <LoadingSpinner />
                      ) : comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={comment.user.profilePicture || "/placeholder.svg"}
                                  alt={comment.user.username}
                                />
                                <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">@{comment.user.username}</span>
                                  {comment.user.isVerified && <Shield className="h-3 w-3 text-blue-500" />}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="similar" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Similar boxes feature coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}
