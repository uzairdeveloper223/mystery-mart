"use client"

import { useState } from "react"
import { useMysteryBoxes } from "@/hooks/use-mystery-boxes"
import { MysteryBoxCard } from "@/components/boxes/mystery-box-card"
import { BoxFilters } from "@/components/boxes/box-filters"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"

export default function BoxesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    category: "",
    priceRange: [0, 1000],
    rarity: "",
    sortBy: "newest",
    verifiedOnly: false,
  })

  const { boxes, loading, error, refreshBoxes } = useMysteryBoxes({
    status: "active",
    category: filters.category || undefined,
  })

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    // The useMysteryBoxes hook will automatically refetch when filters change
  }

  // Apply client-side filtering for complex filters
  const filteredBoxes = boxes.filter((box) => {
    // Price range filter
    if (box.price < filters.priceRange[0] || box.price > filters.priceRange[1]) {
      return false
    }

    // Rarity filter
    if (filters.rarity && box.rarity !== filters.rarity) {
      return false
    }

    // Verified sellers only
    if (filters.verifiedOnly && !box.seller.isVerified) {
      return false
    }

    return true
  })

  // Apply sorting
  const sortedBoxes = [...filteredBoxes].sort((a, b) => {
    switch (filters.sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return b.seller.rating - a.seller.rating
      case "popular":
        return (b.views || 0) - (a.views || 0)
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <BoxFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Mystery Boxes</h1>
                <p className="text-muted-foreground">
                  {loading ? "Loading..." : `Discover ${sortedBoxes.length} amazing mystery boxes`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && <LoadingSpinner />}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Error loading boxes: {error}</p>
                <Button onClick={refreshBoxes}>Try Again</Button>
              </div>
            )}

            {/* Boxes Grid */}
            {!loading && !error && (
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {sortedBoxes.map((box) => (
                  <MysteryBoxCard key={box.id} box={box} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && sortedBoxes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No mystery boxes found matching your criteria.</p>
                <Button onClick={refreshBoxes} className="mt-4">
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
