"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

const categories = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Collectibles",
  "Books & Media",
  "Sports",
  "Beauty",
  "Toys & Games",
  "Other",
]

const rarities = [
  { value: "common", label: "Common", color: "bg-gray-500" },
  { value: "uncommon", label: "Uncommon", color: "bg-green-500" },
  { value: "rare", label: "Rare", color: "bg-blue-500" },
  { value: "epic", label: "Epic", color: "bg-purple-500" },
  { value: "legendary", label: "Legendary", color: "bg-yellow-500" },
]

interface BoxFiltersProps {
  onFilterChange: (filters: any) => void
}

export function BoxFilters({ onFilterChange }: BoxFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState("newest")
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updated = checked ? [...selectedCategories, category] : selectedCategories.filter((c) => c !== category)
    setSelectedCategories(updated)
    updateFilters({ categories: updated })
  }

  const handleRarityChange = (rarity: string, checked: boolean) => {
    const updated = checked ? [...selectedRarities, rarity] : selectedRarities.filter((r) => r !== rarity)
    setSelectedRarities(updated)
    updateFilters({ rarities: updated })
  }

  const updateFilters = (changes: any) => {
    const filters = {
      categories: selectedCategories,
      rarities: selectedRarities,
      priceRange,
      sortBy,
      verifiedOnly,
      ...changes,
    }
    onFilterChange(filters)
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedRarities([])
    setPriceRange([0, 1000])
    setSortBy("newest")
    setVerifiedOnly(false)
    onFilterChange({
      categories: [],
      rarities: [],
      priceRange: [0, 1000],
      sortBy: "newest",
      verifiedOnly: false,
    })
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedRarities.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000 ||
    verifiedOnly

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleCategoryChange(category, false)} />
                </Badge>
              ))}
              {selectedRarities.map((rarity) => (
                <Badge key={rarity} variant="secondary" className="text-xs">
                  {rarity}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleRarityChange(rarity, false)} />
                </Badge>
              ))}
              {verifiedOnly && (
                <Badge variant="secondary" className="text-xs">
                  Verified Only
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => {
                      setVerifiedOnly(false)
                      updateFilters({ verifiedOnly: false })
                    }}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value)
              updateFilters({ sortBy: value })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value)
                updateFilters({ priceRange: value })
              }}
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                />
                <Label htmlFor={category} className="text-sm font-normal">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rarity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rarity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rarities.map((rarity) => (
              <div key={rarity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={rarity.value}
                  checked={selectedRarities.includes(rarity.value)}
                  onCheckedChange={(checked) => handleRarityChange(rarity.value, checked as boolean)}
                />
                <Label htmlFor={rarity.value} className="text-sm font-normal flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${rarity.color}`} />
                  <span>{rarity.label}</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seller Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Seller Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified-only"
              checked={verifiedOnly}
              onCheckedChange={(checked) => {
                setVerifiedOnly(checked as boolean)
                updateFilters({ verifiedOnly: checked })
              }}
            />
            <Label htmlFor="verified-only" className="text-sm font-normal">
              Verified sellers only
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
