"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { FirebaseService } from "@/lib/firebase-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Category } from "@/lib/types"
import {
  Smartphone,
  Shirt,
  Home,
  Trophy,
  BookOpen,
  Dumbbell,
  Sparkles,
  Gamepad2,
  MoreHorizontal,
  Palette,
  Music,
  Camera,
  Watch,
  Gift,
} from "lucide-react"

const iconMap = {
  Smartphone,
  Shirt,
  Home,
  Trophy,
  BookOpen,
  Dumbbell,
  Sparkles,
  Gamepad2,
  MoreHorizontal,
  Palette,
  Music,
  Camera,
  Watch,
  Gift,
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Try to fetch real categories from Firebase
        const fetchedCategories = await FirebaseService.getCategories()

        if (fetchedCategories.length > 0) {
          setCategories(fetchedCategories)
        } else {
          // If no real categories exist, create sample ones
          const sampleCategories = await createSampleCategories()
          setCategories(sampleCategories)
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        // Fallback to sample categories
        const sampleCategories = await createSampleCategories()
        setCategories(sampleCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 gradient-text">Browse by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find mystery boxes in your favorite categories from electronics to collectibles
            </p>
          </motion.div>
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 gradient-text">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find mystery boxes in your favorite categories from electronics to collectibles
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap] || MoreHorizontal
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={`/boxes?category=${category.name.toLowerCase().replace(/\s+/g, "-").replace("&", "and")}`}>
                  <Card className="hover:shadow-md transition-all duration-300 cursor-pointer group hover-scale">
                    <CardContent className="p-6 text-center">
                      <motion.div
                        className={`${category.color} rounded-full p-4 w-16 h-16 mx-auto mb-4 transition-transform duration-300`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </motion.div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.boxCount} boxes</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// Helper function to create sample categories if none exist
async function createSampleCategories(): Promise<Category[]> {
  const sampleCategories: Category[] = [
    {
      id: "electronics",
      name: "Electronics",
      icon: "Smartphone",
      color: "bg-blue-500",
      boxCount: await getRandomBoxCount(),
      description: "Latest gadgets and tech accessories",
    },
    {
      id: "fashion",
      name: "Fashion",
      icon: "Shirt",
      color: "bg-pink-500",
      boxCount: await getRandomBoxCount(),
      description: "Trendy clothing and accessories",
    },
    {
      id: "gaming",
      name: "Gaming",
      icon: "Gamepad2",
      color: "bg-purple-500",
      boxCount: await getRandomBoxCount(),
      description: "Gaming gear and collectibles",
    },
    {
      id: "collectibles",
      name: "Collectibles",
      icon: "Trophy",
      color: "bg-yellow-500",
      boxCount: await getRandomBoxCount(),
      description: "Rare and unique collectible items",
    },
    {
      id: "beauty",
      name: "Beauty",
      icon: "Sparkles",
      color: "bg-rose-500",
      boxCount: await getRandomBoxCount(),
      description: "Skincare and makeup products",
    },
    {
      id: "sports",
      name: "Sports",
      icon: "Dumbbell",
      color: "bg-green-500",
      boxCount: await getRandomBoxCount(),
      description: "Sports equipment and gear",
    },
    {
      id: "home",
      name: "Home & Garden",
      icon: "Home",
      color: "bg-orange-500",
      boxCount: await getRandomBoxCount(),
      description: "Home decor and garden items",
    },
    {
      id: "books",
      name: "Books",
      icon: "BookOpen",
      color: "bg-indigo-500",
      boxCount: await getRandomBoxCount(),
      description: "Books and educational materials",
    },
    {
      id: "art",
      name: "Art & Crafts",
      icon: "Palette",
      color: "bg-teal-500",
      boxCount: await getRandomBoxCount(),
      description: "Art supplies and handmade items",
    },
    {
      id: "music",
      name: "Music",
      icon: "Music",
      color: "bg-red-500",
      boxCount: await getRandomBoxCount(),
      description: "Musical instruments and accessories",
    },
  ]

  return sampleCategories
}

async function getRandomBoxCount(): Promise<number> {
  // In a real app, this would query the actual box count for each category
  return Math.floor(Math.random() * 50) + 5
}
