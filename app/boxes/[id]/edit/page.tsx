"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Upload, X, Plus, Trash2, Save, Eye } from "lucide-react"
import type { MysteryBox, Category } from "@/lib/types"

export default function EditBoxPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [box, setBox] = useState<MysteryBox | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    originalValue: "",
    rarity: "common",
    quantity: "1",
    images: [] as string[],
    items: [] as Array<{ name: string; description: string; estimatedValue: string }>,
    tags: [] as string[],
    isActive: true,
    allowInternationalShipping: false,
    shippingCost: "0",
    processingTime: "1-2",
    returnPolicy: "no-returns",
  })

  const [newTag, setNewTag] = useState("")
  const [newItem, setNewItem] = useState({ name: "", description: "", estimatedValue: "" })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user && params.id) {
      fetchBoxData()
      fetchCategories()
    }
  }, [user, authLoading, params.id, router])

  const fetchBoxData = async () => {
    try {
      setLoading(true)
      const boxId = params.id as string
      const boxData = await FirebaseService.getBox(boxId)

      if (!boxData) {
        toast({
          title: "Error",
          description: "Mystery box not found",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      // Check if user owns this box
      if (boxData.sellerId !== user?.uid) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this box",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setBox(boxData)
      setFormData({
        title: boxData.title || "",
        description: boxData.description || "",
        category: boxData.category || "",
        price: boxData.price?.toString() || "",
        originalValue: boxData.estimatedValue?.min?.toString() || "",
        rarity: boxData.rarity || "common",
        quantity: "1", // Mystery boxes typically have quantity 1
        images: boxData.images || [],
        items: [], // Items are not stored in the current MysteryBox structure
        tags: boxData.tags || [],
        isActive: boxData.status === "active",
        allowInternationalShipping: boxData.shipping?.freeShipping || false,
        shippingCost: boxData.shipping?.shippingCost?.toString() || "0",
        processingTime: boxData.shipping?.processingTime || "1-2",
        returnPolicy: "no-returns", // Default value
      })
    } catch (error) {
      console.error("Failed to fetch box data:", error)
      toast({
        title: "Error",
        description: "Failed to load box data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesData = await FirebaseService.getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("image", file)

        const response = await fetch("https://api.imgbb.com/1/upload?key=a1deed7e7b58edf34021f788161121f4", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()
        if (data.success) {
          return data.data.url
        }
        throw new Error("Upload failed")
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }))

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Failed to upload images:", error)
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const addItem = () => {
    if (newItem.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem }],
      }))
      setNewItem({ name: "", description: "", estimatedValue: "" })
    }
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!box || !user) return

    setSaving(true)
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number.parseFloat(formData.price),
        estimatedValue: {
          min: Number.parseFloat(formData.originalValue) || Number.parseFloat(formData.price),
          max: Number.parseFloat(formData.originalValue) * 1.5 || Number.parseFloat(formData.price) * 2,
        },
        rarity: formData.rarity as MysteryBox["rarity"],
        images: formData.images,
        tags: formData.tags,
        status: formData.isActive ? "active" : ("inactive" as MysteryBox["status"]),
        shipping: {
          freeShipping: Number.parseFloat(formData.shippingCost) === 0,
          shippingCost: Number.parseFloat(formData.shippingCost),
          processingTime: formData.processingTime,
          weight: 1, // Default weight
          dimensions: { length: 10, width: 10, height: 10 }, // Default dimensions
          shippingMethods: ["Standard", "Express"],
        },
        updatedAt: new Date().toISOString(),
      }

      await FirebaseService.updateBox(box.id, updateData)

      toast({
        title: "Success",
        description: "Mystery box updated successfully",
      })

      router.push(`/boxes/${box.id}`)
    } catch (error) {
      console.error("Failed to update box:", error)
      toast({
        title: "Error",
        description: "Failed to update mystery box",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || !box) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Mystery Box</h1>
              <p className="text-muted-foreground">Update your mystery box details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push(`/boxes/${box.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="mystery-gradient text-white">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Update the basic details of your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter mystery box title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your mystery box..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rarity">Rarity *</Label>
                      <Select
                        value={formData.rarity}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, rarity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                          <SelectItem value="legendary">Legendary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="originalValue">Original Value ($)</Label>
                      <Input
                        id="originalValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.originalValue}
                        onChange={(e) => setFormData((prev) => ({ ...prev, originalValue: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>Upload images of your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Box image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="images" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading ? "Uploading..." : "Click to upload images"}
                        </p>
                      </div>
                    </Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Box Contents</CardTitle>
                  <CardDescription>List the items that might be in this mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                          {item.estimatedValue && (
                            <p className="text-sm text-green-600">Est. Value: ${item.estimatedValue}</p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium">Add New Item</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Item name"
                        value={newItem.name}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newItem.description}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                      />
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Est. value"
                          type="number"
                          step="0.01"
                          value={newItem.estimatedValue}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, estimatedValue: e.target.value }))}
                        />
                        <Button type="button" onClick={addItem} disabled={!newItem.name.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>Add tags to help buyers find your mystery box</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Active</Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.isActive ? "Box is visible to buyers" : "Box is hidden from buyers"}
                  </p>
                </CardContent>
              </Card>

              {/* Shipping */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shippingCost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, shippingCost: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processingTime">Processing Time</Label>
                    <Select
                      value={formData.processingTime}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, processingTime: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 business days</SelectItem>
                        <SelectItem value="3-5">3-5 business days</SelectItem>
                        <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="internationalShipping">International Shipping</Label>
                    <Switch
                      id="internationalShipping"
                      checked={formData.allowInternationalShipping}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, allowInternationalShipping: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Policies */}
              <Card>
                <CardHeader>
                  <CardTitle>Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="returnPolicy">Return Policy</Label>
                    <Select
                      value={formData.returnPolicy}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, returnPolicy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-returns">No Returns</SelectItem>
                        <SelectItem value="7-days">7 Days</SelectItem>
                        <SelectItem value="14-days">14 Days</SelectItem>
                        <SelectItem value="30-days">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}
