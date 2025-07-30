"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Star, Shield, Eye, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { FirebaseService } from "@/lib/firebase-service"

interface MysteryBox {
  id: string
  title: string
  description: string
  price: number
  estimatedValue: { min: number; max: number }
  category: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  images: string[]
  seller: {
    username: string
    isVerified: boolean
    rating: number
  }
  tags: string[]
  createdAt: string
}

interface MysteryBoxCardProps {
  box: MysteryBox
}

export function MysteryBoxCard({ box }: MysteryBoxCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const getRarityClass = (rarity: string) => {
    return `rarity-${rarity}`
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if this is inside a Link
    
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      // Use the initiatePurchase function from FirebaseService
      const conversationId = await FirebaseService.initiatePurchase(user.uid, box.id)
      
      toast({
        title: "Purchase Inquiry Sent",
        description: "A message has been sent to the seller. Check your messages for further instructions.",
      })

      // Redirect to the conversation
      router.push(`/messages?conversation=${conversationId}`)
    } catch (error) {
      console.error("Buy now error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate purchase",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={box.images[currentImageIndex] || "/placeholder.svg"}
          alt={box.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Rarity Badge */}
        <Badge className={cn("absolute top-3 left-3 capitalize", getRarityClass(box.rarity))}>{box.rarity}</Badge>

        {/* Like Button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
        </Button>

        {/* Image Indicators */}
        {box.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {box.images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentImageIndex ? "bg-white" : "bg-white/50",
                )}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Category */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{box.title}</h3>
            <p className="text-sm text-muted-foreground">{box.category}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{box.description}</p>

          {/* Price and Value */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold">${box.price}</p>
              <p className="text-xs text-muted-foreground">
                Est. ${box.estimatedValue?.min || 0}-${box.estimatedValue?.max || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">
                {box.estimatedValue?.min ? Math.round(((box.estimatedValue.min - box.price) / box.price) * 100) : 0}%+ value
              </p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{box.seller.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">@{box.seller.username}</span>
            {box.seller.isVerified && <Shield className="h-4 w-4 text-blue-500" />}
            <div className="flex items-center space-x-1 ml-auto">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{box.seller.rating}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {box.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-2">
        <div className="flex space-x-2 w-full">
          <Link href={`/boxes/${box.id}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </Link>
          <Button className="flex-1 mystery-gradient text-white" onClick={handleBuyNow}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
