"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import type { MysteryBox } from "@/lib/types"

interface CartItem {
  box: MysteryBox
  quantity: number
  addedAt: string
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (box: MysteryBox, quantity?: number) => Promise<void>
  removeFromCart: (boxId: string) => Promise<void>
  updateQuantity: (boxId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  isInCart: (boxId: string) => boolean
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.uid}`)
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (error) {
          console.error("Failed to load cart:", error)
        }
      }
    } else {
      setItems([])
    }
  }, [user])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart_${user.uid}`, JSON.stringify(items))
    }
  }, [items, user])

  const addToCart = async (box: MysteryBox, quantity = 1) => {
    if (!user) throw new Error("Must be logged in to add to cart")

    setLoading(true)
    try {
      setItems((prev) => {
        const existingItem = prev.find((item) => item.box.id === box.id)
        if (existingItem) {
          return prev.map((item) => (item.box.id === box.id ? { ...item, quantity: item.quantity + quantity } : item))
        } else {
          return [...prev, { box, quantity, addedAt: new Date().toISOString() }]
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (boxId: string) => {
    setLoading(true)
    try {
      setItems((prev) => prev.filter((item) => item.box.id !== boxId))
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (boxId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(boxId)
      return
    }

    setLoading(true)
    try {
      setItems((prev) => prev.map((item) => (item.box.id === boxId ? { ...item, quantity } : item)))
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    setLoading(true)
    try {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const isInCart = (boxId: string) => {
    return items.some((item) => item.box.id === boxId)
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.box.price || 0) * item.quantity, 0)

  const value = {
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    loading,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
