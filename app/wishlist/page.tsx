"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useWishlist } from "@/hooks/use-wishlist"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { MysteryBoxCard } from "@/components/boxes/mystery-box-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft } from "lucide-react"

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, loading } = useWishlist()
  const router = useRouter()

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground">
            {items.length === 0
              ? "Your wishlist is empty"
              : `${items.length} item${items.length > 1 ? "s" : ""} in your wishlist`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">Save mystery boxes you love to your wishlist</p>
            <Button onClick={() => router.push("/boxes")} className="mystery-gradient text-white">
              Browse Mystery Boxes
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((box) => (
              <MysteryBoxCard key={box.id} box={box} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
