"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Plus, Package, AlertCircle, Clock, MessageCircle } from "lucide-react"
import type { MysteryBox } from "@/lib/types"
import Link from "next/link"

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
  { value: "common", label: "Common", description: "Standard items" },
  { value: "uncommon", label: "Uncommon", description: "Above average items" },
  { value: "rare", label: "Rare", description: "Hard to find items" },
  { value: "epic", label: "Epic", description: "Very valuable items" },
  { value: "legendary", label: "Legendary", description: "Extremely rare items" },
]

export default function SellPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [showApplication, setShowApplication] = useState(false)
  const [applicationData, setApplicationData] = useState({
    businessName: "",
    businessType: "individual" as "individual" | "business",
    description: "",
    experience: "",
    categories: [] as string[],
    expectedVolume: "",
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    estimatedValueMin: "",
    estimatedValueMax: "",
    category: "",
    rarity: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    freeShipping: false,
    shippingCost: "",
    processingTime: "1-3 business days",
  })
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  // Check seller status and show appropriate UI
  const renderSellerStatus = () => {
    if (!user.isApprovedSeller && (!user.sellerApplicationStatus || user.sellerApplicationStatus === "none")) {
      return (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Become a Seller</span>
            </CardTitle>
            <CardDescription>
              To start selling mystery boxes, you need to apply for seller approval first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowApplication(true)} className="mystery-gradient text-white">
              Apply to Become a Seller
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (user.sellerApplicationStatus === "pending") {
      return (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Application Under Review</span>
            </CardTitle>
            <CardDescription>
              Your seller application is being reviewed by our admin team. You'll be notified once it's processed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Status: Pending Review</Badge>
              <Link href="/messages?admin=true">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (user.sellerApplicationStatus === "rejected") {
      return (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <span>Application Rejected</span>
            </CardTitle>
            <CardDescription>
              Your seller application was rejected. You can reapply or contact admin for more information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowApplication(true)} variant="outline">
                Reapply
              </Button>
              <Link href="/messages?admin=true">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (user.isApprovedSeller && !user.canSell) {
      return (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Account Setup in Progress</span>
            </CardTitle>
            <CardDescription>
              Your seller application was approved! Your account is being set up for selling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-800">Approved Seller</Badge>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!applicationData.description.trim() || !applicationData.experience.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await FirebaseService.submitSellerApplication(user.uid, applicationData)

      toast({
        title: "Application Submitted",
        description: "Your seller application has been submitted for review",
      })

      setShowApplication(false)
      // Refresh user data
      window.location.reload()
    } catch (error) {
      console.error("Failed to submit application:", error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || images.length >= 5) return

    setLoading(true)
    try {
      for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
        const file = files[i]

        // Create FormData for ImgBB API
        const formData = new FormData()
        formData.append("image", file)
        formData.append("key", "a1deed7e7b58edf34021f788161121f4") 

        const response = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setImages((prev) => [...prev, data.data.url])
        } else {
          throw new Error("Failed to upload image")
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (currentTag.trim() && tags.length < 10 && !tags.includes(currentTag.trim().toLowerCase())) {
      setTags((prev) => [...prev, currentTag.trim().toLowerCase()])
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim() || formData.title.length < 3 || formData.title.length > 100) {
      newErrors.title = "Title must be between 3-100 characters"
    }

    if (!formData.description.trim() || formData.description.length < 10 || formData.description.length > 1000) {
      newErrors.description = "Description must be between 10-1000 characters"
    }

    const price = Number.parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price < 1 || price > 10000) {
      newErrors.price = "Price must be between $1-$10,000"
    }

    const minValue = Number.parseFloat(formData.estimatedValueMin)
    const maxValue = Number.parseFloat(formData.estimatedValueMax)
    if (!formData.estimatedValueMin || isNaN(minValue) || minValue < price) {
      newErrors.estimatedValueMin = "Minimum value must be at least the selling price"
    }

    if (!formData.estimatedValueMax || isNaN(maxValue) || maxValue < minValue) {
      newErrors.estimatedValueMax = "Maximum value must be greater than minimum value"
    }

    if (!formData.category) {
      newErrors.category = "Please select a category"
    }

    if (!formData.rarity) {
      newErrors.rarity = "Please select a rarity level"
    }

    if (images.length === 0) {
      newErrors.images = "Please upload at least one image"
    }

    if (!formData.freeShipping && (!formData.shippingCost || Number.parseFloat(formData.shippingCost) < 0)) {
      newErrors.shippingCost = "Please enter a valid shipping cost"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const boxData: Omit<MysteryBox, "id"> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number.parseFloat(formData.price),
        estimatedValue: {
          min: Number.parseFloat(formData.estimatedValueMin),
          max: Number.parseFloat(formData.estimatedValueMax),
        },
        category: formData.category,
        rarity: formData.rarity as MysteryBox["rarity"],
        images,
        sellerId: user!.uid,
        seller: {
          username: user!.username,
          fullName: user!.fullName,
          isVerified: user!.isVerified,
          rating: user!.rating,
          profilePicture: user!.profilePicture,
        },
        tags,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        isRevealed: false,
        shipping: {
          weight: Number.parseFloat(formData.weight) || 1,
          dimensions: {
            length: Number.parseFloat(formData.length) || 10,
            width: Number.parseFloat(formData.width) || 10,
            height: Number.parseFloat(formData.height) || 10,
          },
          freeShipping: formData.freeShipping,
          shippingCost: formData.freeShipping ? 0 : Number.parseFloat(formData.shippingCost),
          processingTime: formData.processingTime,
          shippingMethods: ["Standard", "Express"],
        },
      }

      const boxId = await FirebaseService.createBox(boxData)

      toast({
        title: "Success!",
        description: "Your mystery box has been listed successfully",
      })

      router.push(`/boxes/${boxId}`)
    } catch (error) {
      console.error("Failed to create box:", error)
      toast({
        title: "Error",
        description: "Failed to create mystery box. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Mystery Box</h1>
            <p className="text-muted-foreground">List your mystery box and start selling to our community</p>
          </div>

          {/* Seller Status Check */}
          {renderSellerStatus()}

          {/* Seller Application Modal */}
          {showApplication && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Apply to Become a Seller</CardTitle>
                  <CardDescription>
                    Tell us about yourself and your business to get approved as a seller
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleApplicationSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Account Type *</Label>
                      <Select
                        value={applicationData.businessType}
                        onValueChange={(value: "individual" | "business") =>
                          setApplicationData((prev) => ({ ...prev, businessType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Seller</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {applicationData.businessType === "business" && (
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={applicationData.businessName}
                          onChange={(e) => setApplicationData((prev) => ({ ...prev, businessName: e.target.value }))}
                          placeholder="Enter your business name"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="description">Tell us about yourself/business *</Label>
                      <Textarea
                        id="description"
                        value={applicationData.description}
                        onChange={(e) => setApplicationData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what you plan to sell and your background"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Selling Experience *</Label>
                      <Textarea
                        id="experience"
                        value={applicationData.experience}
                        onChange={(e) => setApplicationData((prev) => ({ ...prev, experience: e.target.value }))}
                        placeholder="Tell us about your experience with selling, mystery boxes, or relevant background"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Categories you plan to sell in</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <label key={category} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={applicationData.categories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setApplicationData((prev) => ({
                                    ...prev,
                                    categories: [...prev.categories, category],
                                  }))
                                } else {
                                  setApplicationData((prev) => ({
                                    ...prev,
                                    categories: prev.categories.filter((c) => c !== category),
                                  }))
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedVolume">Expected monthly volume</Label>
                      <Select
                        value={applicationData.expectedVolume}
                        onValueChange={(value) => setApplicationData((prev) => ({ ...prev, expectedVolume: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expected volume" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 boxes per month</SelectItem>
                          <SelectItem value="11-50">11-50 boxes per month</SelectItem>
                          <SelectItem value="51-100">51-100 boxes per month</SelectItem>
                          <SelectItem value="100+">100+ boxes per month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-4">
                      <Button type="submit" disabled={loading} className="flex-1 mystery-gradient text-white">
                        {loading ? "Submitting..." : "Submit Application"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowApplication(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Only show the create box form if user can sell */}
          {user.canSell && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <CardDescription>Provide the essential details about your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter a catchy title for your mystery box"
                      maxLength={100}
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    <p className="text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe what buyers can expect in this mystery box"
                      rows={4}
                      maxLength={1000}
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    <p className="text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rarity">Rarity Level *</Label>
                      <Select value={formData.rarity} onValueChange={(value) => handleInputChange("rarity", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rarity level" />
                        </SelectTrigger>
                        <SelectContent>
                          {rarities.map((rarity) => (
                            <SelectItem key={rarity.value} value={rarity.value}>
                              <div>
                                <div className="font-medium">{rarity.label}</div>
                                <div className="text-xs text-muted-foreground">{rarity.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.rarity && <p className="text-sm text-red-500">{errors.rarity}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Value</CardTitle>
                  <CardDescription>Set your selling price and estimated value range</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Selling Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        max="10000"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="99.99"
                      />
                      {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedValueMin">Est. Min Value ($) *</Label>
                      <Input
                        id="estimatedValueMin"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.estimatedValueMin}
                        onChange={(e) => handleInputChange("estimatedValueMin", e.target.value)}
                        placeholder="150.00"
                      />
                      {errors.estimatedValueMin && <p className="text-sm text-red-500">{errors.estimatedValueMin}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedValueMax">Est. Max Value ($) *</Label>
                      <Input
                        id="estimatedValueMax"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.estimatedValueMax}
                        onChange={(e) => handleInputChange("estimatedValueMax", e.target.value)}
                        placeholder="300.00"
                      />
                      {errors.estimatedValueMax && <p className="text-sm text-red-500">{errors.estimatedValueMax}</p>}
                    </div>
                  </div>

                  {formData.price && formData.estimatedValueMin && (
                    <Alert>
                      <AlertDescription>
                        Potential value increase:{" "}
                        {Math.round(
                          ((Number.parseFloat(formData.estimatedValueMin) - Number.parseFloat(formData.price)) /
                            Number.parseFloat(formData.price)) *
                            100,
                        )}
                        %+
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>Upload 1-5 high-quality images of your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="images"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG (MAX. 5MB each)</p>
                        </div>
                        <input
                          id="images"
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={loading || images.length >= 5}
                        />
                      </label>
                    </div>

                    {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Mystery box image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">{images.length}/5 images uploaded</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>Add up to 10 tags to help buyers find your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Enter a tag"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      maxLength={20}
                    />
                    <Button type="button" onClick={addTag} disabled={tags.length >= 10}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-sm">
                          {tag}
                          <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">{tags.length}/10 tags added</p>
                </CardContent>
              </Card>

              {/* Shipping */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>Provide shipping details for your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        placeholder="1.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="length">Length (in)</Label>
                      <Input
                        id="length"
                        type="number"
                        min="1"
                        value={formData.length}
                        onChange={(e) => handleInputChange("length", e.target.value)}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="width">Width (in)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="1"
                        value={formData.width}
                        onChange={(e) => handleInputChange("width", e.target.value)}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Height (in)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="1"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="freeShipping"
                        checked={formData.freeShipping}
                        onChange={(e) => handleInputChange("freeShipping", e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="freeShipping">Offer free shipping</Label>
                    </div>

                    {!formData.freeShipping && (
                      <div className="space-y-2">
                        <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
                        <Input
                          id="shippingCost"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.shippingCost}
                          onChange={(e) => handleInputChange("shippingCost", e.target.value)}
                          placeholder="9.99"
                        />
                        {errors.shippingCost && <p className="text-sm text-red-500">{errors.shippingCost}</p>}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="processingTime">Processing Time</Label>
                      <Select
                        value={formData.processingTime}
                        onValueChange={(value) => handleInputChange("processingTime", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-3 business days">1-3 business days</SelectItem>
                          <SelectItem value="3-5 business days">3-5 business days</SelectItem>
                          <SelectItem value="5-7 business days">5-7 business days</SelectItem>
                          <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="mystery-gradient text-white">
                  {loading ? "Creating..." : "Create Mystery Box"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
