"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"

import { useToast } from "@/hooks/use-toast"
import { User, Settings, Bell, MapPin, Shield, CheckCircle, Clock, X, Upload, Star, Award, Plus, Navigation, Trash2 } from "lucide-react"
import type { Address } from "@/lib/types"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showVerificationRequest, setShowVerificationRequest] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")
  
  // Address management states
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    isDefault: false,
  })

  // Security states removed

  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    twitter: "",
    instagram: "",
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    theme: "system" as "light" | "dark" | "system",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      setProfileData({
        fullName: user.fullName || "",
        username: user.username || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.socialLinks?.website || "",
        twitter: user.socialLinks?.twitter || "",
        instagram: user.socialLinks?.instagram || "",
      })
      setPreferences(user.preferences || preferences)
      fetchAddresses()
    }
  }, [user, authLoading, router])

  const fetchAddresses = async () => {
    if (!user) return
    try {
      const userAddresses = await FirebaseService.getUserAddresses(user.uid)
      setAddresses(userAddresses)
    } catch (error) {
      console.error("Failed to fetch addresses:", error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await FirebaseService.updateUser(user.uid, {
        fullName: profileData.fullName,
        bio: profileData.bio,
        location: profileData.location,
        socialLinks: {
          website: profileData.website,
          twitter: profileData.twitter,
          instagram: profileData.instagram,
        },
      })

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      await FirebaseService.updateUser(user.uid, {
        preferences,
      })

      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved",
      })
    } catch (error) {
      console.error("Failed to update preferences:", error)
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF)",
        variant: "destructive",
      })
      return
    }

    setUploadingPhoto(true)
    try {
      // Upload to ImgBB
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("https://api.imgbb.com/1/upload?key=a1deed7e7b58edf34021f788161121f4", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        // Update user profile with new image URL
        await FirebaseService.updateUser(user.uid, {
          profilePicture: data.data.url,
        })

        toast({
          title: "Photo Updated",
          description: "Your profile photo has been updated successfully",
        })

        // Trigger a refresh of user data
        window.location.reload()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Failed to upload photo:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleVerificationRequest = async () => {
    if (!user || !verificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message for your verification request",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await FirebaseService.requestVerification(user.uid, verificationMessage.trim())

      toast({
        title: "Verification Requested",
        description: "Your verification request has been submitted to admin for review",
      })

      setShowVerificationRequest(false)
      setVerificationMessage("")
    } catch (error) {
      console.error("Failed to request verification:", error)
      toast({
        title: "Error",
        description: "Failed to submit verification request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Address management functions
  const openAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address)
      setAddressForm({
        fullName: address.fullName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phoneNumber: address.phoneNumber,
        isDefault: address.isDefault,
      })
    } else {
      setEditingAddress(null)
      setAddressForm({
        fullName: user?.fullName || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        phoneNumber: "",
        isDefault: false,
      })
    }
    setShowAddressDialog(true)
  }

  const closeAddressDialog = () => {
    setShowAddressDialog(false)
    setEditingAddress(null)
    setAddressForm({
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phoneNumber: "",
      isDefault: false,
    })
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      })
      return
    }

    setGpsLoading(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })

      const { latitude, longitude } = position.coords

      // Use reverse geocoding to get address details using Nominatim (free OpenStreetMap service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error("Failed to get address from coordinates")
      }

      const data = await response.json()
      
      if (data && data.address) {
        const addr = data.address

        setAddressForm(prev => ({
          ...prev,
          addressLine1: `${addr.house_number || ""} ${addr.road || addr.street || ""}`.trim(),
          city: addr.city || addr.town || addr.village || addr.municipality || "",
          state: addr.state || addr.province || addr.region || "",
          postalCode: addr.postcode || "",
          country: addr.country || "",
        }))

        toast({
          title: "Location Found",
          description: "Address details have been filled automatically",
        })
      } else {
        // Fallback: Just show coordinates
        setAddressForm(prev => ({
          ...prev,
          addressLine1: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        }))

        toast({
          title: "Location Found",
          description: "Coordinates captured. Please fill in the address details manually.",
        })
      }
    } catch (error) {
      console.error("GPS Error:", error)
      toast({
        title: "Location Error",
        description: "Could not get your current location. Please enter address manually.",
        variant: "destructive",
      })
    } finally {
      setGpsLoading(false)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setAddressLoading(true)
    try {
      if (editingAddress) {
        // Update existing address
        await FirebaseService.updateAddress(editingAddress.id, {
          ...addressForm,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        })
        toast({
          title: "Address Updated",
          description: "Your address has been updated successfully",
        })
      } else {
        // Create new address
        await FirebaseService.createAddress({
          ...addressForm,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        toast({
          title: "Address Added",
          description: "Your address has been saved successfully",
        })
      }

      await fetchAddresses()
      closeAddressDialog()
    } catch (error) {
      console.error("Failed to save address:", error)
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddressLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return

    try {
      await FirebaseService.deleteAddress(addressId)
      toast({
        title: "Address Deleted",
        description: "The address has been removed from your account",
      })
      await fetchAddresses()
    } catch (error) {
      console.error("Failed to delete address:", error)
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Password and account deletion functions removed

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  const getVerificationStatusBadge = () => {
    if (user.isVerified) {
      return (
        <Badge className="bg-blue-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    }

    if (user.verificationStatus === "pending") {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Verification Pending
        </Badge>
      )
    }

    if (user.verificationStatus === "rejected") {
      return (
        <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Verification Rejected
        </Badge>
      )
    }

    return null
  }

  const getSellerStatusBadge = () => {
    if (user.canSell) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved Seller
        </Badge>
      )
    }

    if (user.sellerApplicationStatus === "pending") {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Seller Application Pending
        </Badge>
      )
    }

    if (user.sellerApplicationStatus === "rejected") {
      return (
        <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Seller Application Rejected
        </Badge>
      )
    }

    return <Badge variant="outline">Not a Seller</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and profile information</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>Update your public profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.fullName} />
                        <AvatarFallback className="text-xl">{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          id="profile-photo-upload"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => document.getElementById('profile-photo-upload')?.click()}
                          disabled={uploadingPhoto}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingPhoto ? "Uploading..." : "Change Photo"}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, username: e.target.value }))}
                          placeholder="Enter your username"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell others about yourself"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">{profileData.bio.length}/500 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Social Links</h3>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profileData.website}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input
                            id="twitter"
                            value={profileData.twitter}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, twitter: e.target.value }))}
                            placeholder="@username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input
                            id="instagram"
                            value={profileData.instagram}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, instagram: e.target.value }))}
                            placeholder="@username"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="mystery-gradient text-white">
                      {loading ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Account Status</span>
                    </CardTitle>
                    <CardDescription>Your account verification and seller status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Email Verification</h3>
                        <p className="text-sm text-muted-foreground">Your email address verification status</p>
                      </div>
                      <Badge className={user.isEmailVerified ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                        {user.isEmailVerified ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Account Verification</h3>
                        <p className="text-sm text-muted-foreground">Blue checkmark verification status</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getVerificationStatusBadge()}
                        {!user.isVerified && user.verificationStatus !== "pending" && (
                          <Button size="sm" variant="outline" onClick={() => setShowVerificationRequest(true)}>
                            Request Verification
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Seller Status</h3>
                        <p className="text-sm text-muted-foreground">Your ability to sell mystery boxes</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSellerStatusBadge()}
                        {!user.canSell && user.sellerApplicationStatus === "none" && (
                          <Button size="sm" variant="outline" onClick={() => router.push("/sell")}>
                            Apply to Sell
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Loyalty Tier</h3>
                        <p className="text-sm text-muted-foreground">Your current loyalty level</p>
                      </div>
                      <Badge
                        className={`capitalize ${
                          user.loyaltyTier === "diamond"
                            ? "bg-purple-500"
                            : user.loyaltyTier === "gold"
                              ? "bg-yellow-500"
                              : user.loyaltyTier === "silver"
                                ? "bg-gray-400"
                                : "bg-orange-600"
                        } text-white`}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {user.loyaltyTier}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Rating</h3>
                        <p className="text-sm text-muted-foreground">Your seller/buyer rating</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-semibold">{(user.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Request Modal */}
                {showVerificationRequest && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                      <CardHeader>
                        <CardTitle>Request Verification</CardTitle>
                        <CardDescription>
                          Tell us why you should be verified. This will be sent to our admin team for review.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="verificationMessage">Your Message</Label>
                          <Textarea
                            id="verificationMessage"
                            value={verificationMessage}
                            onChange={(e) => setVerificationMessage(e.target.value)}
                            placeholder="Explain why you should be verified (e.g., established seller, authentic business, etc.)"
                            rows={4}
                            maxLength={500}
                          />
                          <p className="text-xs text-muted-foreground">{verificationMessage.length}/500 characters</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleVerificationRequest}
                            disabled={loading || !verificationMessage.trim()}
                            className="flex-1 mystery-gradient text-white"
                          >
                            {loading ? "Submitting..." : "Submit Request"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowVerificationRequest(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Marketing Emails</h3>
                      <p className="text-sm text-muted-foreground">Receive promotional emails and updates</p>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>

                  <Button onClick={handlePreferencesUpdate} disabled={loading} className="mystery-gradient text-white">
                    {loading ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Shipping Addresses</span>
                  </CardTitle>
                  <CardDescription>Manage your shipping addresses</CardDescription>
                </CardHeader>
                <CardContent>
                  {addresses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Your Addresses</h3>
                        <Button 
                          onClick={() => openAddressDialog()}
                          className="mystery-gradient text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Address
                        </Button>
                      </div>
                      {addresses.map((address) => (
                        <div key={address.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{address.fullName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {address.addressLine1}
                                {address.addressLine2 && `, ${address.addressLine2}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                              <p className="text-sm text-muted-foreground">{address.country}</p>
                              <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
                              {address.isDefault && <Badge className="mt-2">Default</Badge>}
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openAddressDialog(address)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No addresses saved</p>
                      <Button 
                        onClick={() => openAddressDialog()}
                        className="mystery-gradient text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address Dialog */}
              <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAddress 
                        ? "Update your shipping address details" 
                        : "Add a new shipping address to your account"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          value={addressForm.addressLine1}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input
                          id="addressLine2"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Select
                            value={addressForm.country}
                            onValueChange={(value) => setAddressForm(prev => ({ ...prev, country: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="GB">United Kingdom</SelectItem>
                              <SelectItem value="AU">Australia</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                              <SelectItem value="JP">Japan</SelectItem>
                              <SelectItem value="IN">India</SelectItem>
                              <SelectItem value="BR">Brazil</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={addressForm.phoneNumber}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onCheckedChange={(checked) => setAddressForm(prev => ({ ...prev, isDefault: checked }))}
                        />
                        <Label htmlFor="isDefault">Set as default address</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={gpsLoading}
                          className="flex-1"
                        >
                          {gpsLoading ? (
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4 mr-2" />
                          )}
                          {gpsLoading ? "Getting Location..." : "Use Current Location"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeAddressDialog}
                          disabled={addressLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={addressLoading}
                          className="mystery-gradient text-white"
                        >
                          {addressLoading ? "Saving..." : editingAddress ? "Update" : "Add"} Address
                        </Button>
                      </div>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>


            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Security Settings</span>
                    </CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Account Recovery</h3>
                        <p className="text-sm text-muted-foreground">Set up recovery options</p>
                      </div>
                      <Button variant="outline" onClick={() => router.push("/auth/account-recovery")}>
                        Setup Recovery
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}
