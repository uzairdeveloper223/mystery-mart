"use client"

import { useState, useEffect } from "react"
import { FirebaseService } from "@/lib/firebase-service"
import type { MysteryBox } from "@/lib/types"

interface UseBoxesOptions {
  category?: string
  sellerId?: string
  status?: string
  limit?: number
  featured?: boolean
}

export function useMysteryBoxes(options: UseBoxesOptions = {}) {
  const [boxes, setBoxes] = useState<MysteryBox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch real boxes from Firebase
        const fetchedBoxes = await FirebaseService.getBoxes({
          category: options.category,
          sellerId: options.sellerId,
          status: options.status || "active",
          limit: options.limit || 20,
          featured: options.featured,
        })

        setBoxes(fetchedBoxes)

        // If no real data available, create some sample data for demo
        if (fetchedBoxes.length === 0) {
          const sampleBoxes = await createSampleBoxes(options)
          setBoxes(sampleBoxes)
        }
      } catch (err) {
        console.error("Error fetching boxes:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch boxes")
      } finally {
        setLoading(false)
      }
    }

    fetchBoxes()
  }, [options.category, options.sellerId, options.status, options.limit, options.featured])

  const refreshBoxes = async () => {
    try {
      setLoading(true)
      const fetchedBoxes = await FirebaseService.getBoxes(options)
      setBoxes(fetchedBoxes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh boxes")
    } finally {
      setLoading(false)
    }
  }

  return {
    boxes,
    loading,
    error,
    refreshBoxes,
  }
}

export function useMysteryBox(boxId: string) {
  const [box, setBox] = useState<MysteryBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBox = async () => {
      if (!boxId) return

      try {
        setLoading(true)
        setError(null)
        const fetchedBox = await FirebaseService.getBox(boxId)
        setBox(fetchedBox)

        // Increment view count
        if (fetchedBox) {
          await FirebaseService.incrementBoxViews(boxId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch box")
      } finally {
        setLoading(false)
      }
    }

    fetchBox()
  }, [boxId])

  const refreshBox = async () => {
    if (!boxId) return

    try {
      setLoading(true)
      const fetchedBox = await FirebaseService.getBox(boxId)
      setBox(fetchedBox)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh box")
    } finally {
      setLoading(false)
    }
  }

  return {
    box,
    loading,
    error,
    refreshBox,
  }
}

// Helper function to create sample data if no real data exists
async function createSampleBoxes(options: UseBoxesOptions): Promise<MysteryBox[]> {
  const categories = ["Electronics", "Fashion", "Gaming", "Collectibles", "Beauty", "Sports"]
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"]

  const sampleBoxes: MysteryBox[] = []
  const limit = options.limit || 6

  for (let i = 0; i < limit; i++) {
    const category = options.category || categories[Math.floor(Math.random() * categories.length)]
    const rarity = rarities[Math.floor(Math.random() * rarities.length)]

    const box: MysteryBox = {
      id: `sample-${i}`,
      title: `${category} Mystery Box #${i + 1}`,
      description: `Discover amazing ${category.toLowerCase()} items in this exciting mystery box!`,
      price: Math.floor(Math.random() * 200) + 20,
      category,
      rarity,
      images: [`/placeholder.svg?height=300&width=300&text=${category}`],
      seller: {
        id: `seller-${i}`,
        username: `seller${i}`,
        displayName: `Seller ${i + 1}`,
        profilePicture: `/placeholder.svg?height=40&width=40&text=S${i + 1}`,
        rating: 4 + Math.random(),
        totalSales: Math.floor(Math.random() * 1000),
        isVerified: Math.random() > 0.5,
        loyaltyTier: "bronze",
      },
      status: "active",
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      tags: [category.toLowerCase(), rarity],
      shipping: {
        freeShipping: Math.random() > 0.5,
        shippingCost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 20) + 5,
        estimatedDelivery: "3-7 business days",
      },
      featured: options.featured || Math.random() > 0.7,
    }

    sampleBoxes.push(box)
  }

  return sampleBoxes
}
