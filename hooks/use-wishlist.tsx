"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { useAuth } from "@/hooks/use-auth"
import type { MysteryBox } from "@/lib/types"

interface WishlistContextType {
  items: MysteryBox[]
  addToWishlist: (box: MysteryBox) => Promise<void>
  removeFromWishlist: (boxId: string) => Promise<void>
  isInWishlist: (boxId: string) => boolean
  clearWishlist: () => Promise<void>
  loading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<MysteryBox[]>([])
  const [loading, setLoading] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.uid}`)
      if (savedWishlist) {
        try {
          setItems(JSON.parse(savedWishlist))
        } catch (error) {
          console.error("Failed to load wishlist:", error)
        }
      }
    } else {
      setItems([])
    }
  }, [user])

  // Save wishlist to localStorage whenever items change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`wishlist_${user.uid}`, JSON.stringify(items))
    }
  }, [items, user])

  const addToWishlist = async (box: MysteryBox) => {
    if (!user) throw new Error("Must be logged in to add to wishlist")

    setLoading(true)
    try {
      setItems((prev) => {
        if (prev.some((item) => item.id === box.id)) {
          return prev // Already in wishlist
        }
        return [...prev, box]
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (boxId: string) => {
    setLoading(true)
    try {
      setItems((prev) => prev.filter((item) => item.id !== boxId))
    } finally {
      setLoading(false)
    }
  }

  const isInWishlist = (boxId: string) => {
    return items.some((item) => item.id === boxId)
  }

  const clearWishlist = async () => {
    setLoading(true)
    try {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const value = {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    loading,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
