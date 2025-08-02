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
import { User, Settings, Bell, MapPin, Shield, CheckCircle, Clock, X, Upload, Star, Award, Plus, Navigation, Trash2, DollarSign, Palette, Edit3} from "lucide-react"
import type { Address } from "@/lib/types"

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showVerificationRequest, setShowVerificationRequest] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")
  
  // Avatar editor states
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [avatarConfig, setAvatarConfig] = useState({
    backgroundColor: "#3b82f6", // Default blue
    textColor: "#ffffff",
    fontSize: "90",
    fontWeight: "600",
    borderRadius: "50",
    letter: "U"
  })
  
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

  // Security states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const [ethAddress, setEthAddress] = useState("")
  const [ethAddressLoading, setEthAddressLoading] = useState(false)

  // Username change request states
  const [showUsernameRequest, setShowUsernameRequest] = useState(false)
  const [usernameRequestForm, setUsernameRequestForm] = useState({
    newUsername: "",
    reason: "",
  })
  const [usernameRequestLoading, setUsernameRequestLoading] = useState(false)

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
      setEthAddress(user.ethAddress || "")
      
      // Update avatar config with user's first letter
      setAvatarConfig(prev => ({
        ...prev,
        letter: user.fullName?.charAt(0)?.toUpperCase() || "U"
      }))
      
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

      // Refresh user data to reflect changes immediately
      await refreshUser()

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

  // Check if user has default avatar (no profile picture or placeholder)
  const hasDefaultAvatar = !user?.profilePicture || user.profilePicture === "/placeholder.svg" || user.profilePicture.startsWith("data:image/svg+xml")

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
        await refreshUser()
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

  const generateAvatarSvg = (config: typeof avatarConfig) => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="100" 
          cy="100" 
          r="${config.borderRadius === "50" ? "100" : "20"}" 
          fill="${config.backgroundColor}"
        />
        <text 
          x="100" 
          y="100" 
          text-anchor="middle" 
          dominant-baseline="central" 
          font-size="${config.fontSize}px" 
          font-weight="${config.fontWeight}" 
          fill="${config.textColor}"
          font-family="system-ui, -apple-system, sans-serif"
        >
          ${config.letter}
        </text>
      </svg>
    `)}`
  }

  const handleSaveCustomAvatar = async () => {
    if (!user) return

    setUploadingPhoto(true)
    try {
      const avatarSvg = generateAvatarSvg(avatarConfig)
      
      // Save the SVG data URL directly to Firebase
      await FirebaseService.updateUser(user.uid, {
        profilePicture: avatarSvg,
      })

      toast({
        title: "Avatar Updated",
        description: "Your custom avatar has been saved successfully",
      })

      await refreshUser()
      setShowAvatarEditor(false)
    } catch (error) {
      console.error("Failed to save avatar:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save custom avatar. Please try again.",
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

  const handleUsernameChangeRequest = async () => {
    if (!user || !usernameRequestForm.newUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new username",
        variant: "destructive",
      })
      return
    }

    if (!usernameRequestForm.reason.trim()) {
      toast({
        title: "Error", 
        description: "Please provide a reason for the username change",
        variant: "destructive",
      })
      return
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(usernameRequestForm.newUsername)) {
      toast({
        title: "Invalid Username",
        description: "Username must be 3-20 characters long and contain only letters, numbers, and underscores",
        variant: "destructive",
      })
      return
    }

    setUsernameRequestLoading(true)
    try {
      await FirebaseService.requestUsernameChange(
        user.uid, 
        usernameRequestForm.newUsername.toLowerCase().trim(),
        usernameRequestForm.reason.trim()
      )

      toast({
        title: "Username Change Requested",
        description: "Your username change request has been submitted to admin for review",
      })

      setShowUsernameRequest(false)
      setUsernameRequestForm({
        newUsername: "",
        reason: "",
      })
    } catch (error) {
      console.error("Failed to request username change:", error)
      toast({
        title: "Error",
        description: "Failed to submit username change request",
        variant: "destructive",
      })
    } finally {
      setUsernameRequestLoading(false)
    }
  }

  const handleEthAddressUpdate = async () => {
    if (!user) return

    // Validate ETH address format
    const ethRegex = /^0x[a-fA-F0-9]{40}$/
    if (ethAddress && !ethRegex.test(ethAddress)) {
      toast({
        title: "Invalid ETH Address",
        description: "Please enter a valid Ethereum address (0x...)",
        variant: "destructive",
      })
      return
    }

    setEthAddressLoading(true)
    try {
      // Use the new donation address validation function
      await FirebaseService.updateDonationAddress(user.uid, ethAddress.trim())

      // Refresh user data to reflect changes
      await refreshUser()

      toast({
        title: "ETH Address Updated",
        description: "Your Ethereum address has been saved successfully",
      })
    } catch (error) {
      console.error("Failed to update ETH address:", error)
      
      // Handle specific error for duplicate address
      if (error instanceof Error && error.message.includes("already being used")) {
        toast({
          title: "Address Already in Use",
          description: "This Ethereum address is already being used by another user. Please use a different address.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update ETH address",
          variant: "destructive",
        })
      }
    } finally {
      setEthAddressLoading(false)
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

  // Password and account deletion functions
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate password form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)
    try {
      // Import Firebase Auth functions
      const { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth")
      
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email!, passwordForm.currentPassword)
      await reauthenticateWithCredential(currentUser, credential)

      // Update password
      await updatePassword(currentUser, passwordForm.newPassword)

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      })

      // Clear form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      console.error("Failed to update password:", error)
      
      let errorMessage = "Failed to update password"
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak"
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in before changing your password"
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (!user) return

    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Error",
        description: "Please type 'DELETE' to confirm account deletion",
        variant: "destructive",
      })
      return
    }

    setDeleteLoading(true)
    try {
      // Import Firebase Auth functions
      const { getAuth, deleteUser } = await import("firebase/auth")
      
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      // Delete user data from database first
      await FirebaseService.deleteUserData(user.uid)

      // Delete Firebase Auth user
      await deleteUser(currentUser)

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      })

      // Redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("Failed to delete account:", error)
      
      let errorMessage = "Failed to delete account"
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in before deleting your account"
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation("")
    }
  }

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="donations">Donations</TabsTrigger>
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
                      <div className="space-y-2">
                        <div className="flex gap-2">
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
                            {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                          </Button>
                          
                          {/* Edit Avatar button - only show for default avatars */}
                          {hasDefaultAvatar && (
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => setShowAvatarEditor(true)}
                              disabled={uploadingPhoto}
                            >
                              <Palette className="h-4 w-4 mr-2" />
                              Edit Avatar
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {hasDefaultAvatar 
                            ? "Upload a photo or customize your avatar letter"
                            : "JPG, PNG or GIF. Max size 5MB."}
                        </p>
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Want to change your username?
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setShowUsernameRequest(true)}
                            className="text-xs p-0 h-auto text-primary hover:text-primary/80"
                          >
                            Click here to request a change
                          </Button>
                        </div>
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

              {/* Username Change Request Dialog */}
              <Dialog open={showUsernameRequest} onOpenChange={setShowUsernameRequest}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Request Username Change</DialogTitle>
                    <DialogDescription>
                      Submit a request to change your username. Our admin team will review your request and manually update your username if approved.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Current Username:</strong> @{user.username}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Username changes require admin approval and may take 1-3 business days to process.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newUsername">Requested Username</Label>
                      <Input
                        id="newUsername"
                        value={usernameRequestForm.newUsername}
                        onChange={(e) => setUsernameRequestForm(prev => ({ ...prev, newUsername: e.target.value }))}
                        placeholder="Enter your desired username"
                        className="lowercase"
                      />
                      {usernameRequestForm.newUsername && (
                        <p className="text-xs text-blue-600">
                          Will be saved as: <span className="font-mono bg-blue-100 px-1 rounded">@{usernameRequestForm.newUsername.toLowerCase()}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        3-20 characters, letters, numbers, and underscores only
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Change</Label>
                      <Textarea
                        id="reason"
                        value={usernameRequestForm.reason}
                        onChange={(e) => setUsernameRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Please explain why you want to change your username..."
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">
                        {usernameRequestForm.reason.length}/500 characters
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUsernameRequest(false)
                        setUsernameRequestForm({
                          newUsername: "",
                          reason: "",
                        })
                      }}
                      disabled={usernameRequestLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUsernameChangeRequest}
                      disabled={usernameRequestLoading || !usernameRequestForm.newUsername.trim() || !usernameRequestForm.reason.trim()}
                      className="mystery-gradient text-white"
                    >
                      {usernameRequestLoading ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                              <SelectItem value="PK">Pakistan</SelectItem>
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

            <TabsContent value="donations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Donation Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Set up your Ethereum address to receive donations from others
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">How Donations Work</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Add your Ethereum address to receive ETH donations</li>
                        <li>• Others can donate to you through your seller profile</li>
                        <li>• We verify donations using Etherscan API</li>
                        <li>• You'll be notified when someone donates to you</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ethAddress">Ethereum Address (ETH only)</Label>
                      <Input
                        id="ethAddress"
                        type="text"
                        value={ethAddress}
                        onChange={(e) => setEthAddress(e.target.value)}
                        placeholder="0x1234567890abcdef1234567890abcdef12345678"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your Ethereum wallet address. Each address can only be used by one user. Make sure it's correct as this cannot be easily changed.
                      </p>
                    </div>

                    <Button 
                      onClick={handleEthAddressUpdate} 
                      disabled={ethAddressLoading}
                      className="mystery-gradient text-white"
                    >
                      {ethAddressLoading ? "Saving..." : "Save ETH Address"}
                    </Button>

                    {ethAddress && (
                      <div className="p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">ETH Address Configured</span>
                        </div>
                        <p className="text-xs text-green-700">
                          Others can now send you ETH donations through your profile page.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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

                {/* Change Password Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter your current password"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter your new password"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your new password"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={passwordLoading}
                        className="mystery-gradient text-white"
                      >
                        {passwordLoading ? "Updating Password..." : "Update Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Delete Account Card */}
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>Permanently delete your account and all associated data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">Warning: This action cannot be undone</h4>
                        <p className="text-sm text-red-700">
                          Deleting your account will permanently remove:
                        </p>
                        <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                          <li>Your profile and all personal information</li>
                          <li>All mystery boxes you've created</li>
                          <li>Your purchase and order history</li>
                          <li>All messages and conversations</li>
                          <li>Your addresses and preferences</li>
                        </ul>
                      </div>

                      <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteDialog(true)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Delete Account Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">
                          To confirm deletion, please type <span className="font-bold">DELETE</span> in the box below:
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirmation">Confirmation</Label>
                        <Input
                          id="deleteConfirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false)
                          setDeleteConfirmation("")
                        }}
                        disabled={deleteLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleAccountDeletion}
                        disabled={deleteLoading || deleteConfirmation !== "DELETE"}
                      >
                        {deleteLoading ? "Deleting Account..." : "Delete Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Avatar Editor Dialog */}
      <Dialog open={showAvatarEditor} onOpenChange={setShowAvatarEditor}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Avatar</DialogTitle>
            <DialogDescription>
              Design your personalized avatar letter with custom colors and styling. The avatar text may look big but its size will be adjusted based on the container size.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold transition-all duration-200"
                style={{
                  backgroundColor: avatarConfig.backgroundColor,
                  color: avatarConfig.textColor,
                  fontSize: `${parseInt(avatarConfig.fontSize) * 1.5}px`,
                  fontWeight: avatarConfig.fontWeight,
                  borderRadius: avatarConfig.borderRadius === "50" ? "50%" : "12px"
                }}
              >
                {avatarConfig.letter}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Letter Input */}
              <div className="space-y-2">
                <Label htmlFor="avatar-letter">Avatar Letter</Label>
                <Input
                  id="avatar-letter"
                  value={avatarConfig.letter}
                  onChange={(e) => setAvatarConfig(prev => ({ 
                    ...prev, 
                    letter: e.target.value.charAt(0).toUpperCase() 
                  }))}
                  maxLength={1}
                  placeholder="Enter letter"
                  className="text-center text-lg font-semibold"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="bg-color"
                    type="color"
                    value={avatarConfig.backgroundColor}
                    onChange={(e) => setAvatarConfig(prev => ({ 
                      ...prev, 
                      backgroundColor: e.target.value 
                    }))}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={avatarConfig.backgroundColor}
                    onChange={(e) => setAvatarConfig(prev => ({ 
                      ...prev, 
                      backgroundColor: e.target.value 
                    }))}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="text-color"
                    type="color"
                    value={avatarConfig.textColor}
                    onChange={(e) => setAvatarConfig(prev => ({ 
                      ...prev, 
                      textColor: e.target.value 
                    }))}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={avatarConfig.textColor}
                    onChange={(e) => setAvatarConfig(prev => ({ 
                      ...prev, 
                      textColor: e.target.value 
                    }))}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Style Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="font-weight">Font Weight</Label>
                  <Select
                    value={avatarConfig.fontWeight}
                    onValueChange={(value) => setAvatarConfig(prev => ({ 
                      ...prev, 
                      fontWeight: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="800">Extra Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-radius">Shape</Label>
                  <Select
                    value={avatarConfig.borderRadius}
                    onValueChange={(value) => setAvatarConfig(prev => ({ 
                      ...prev, 
                      borderRadius: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">Circle</SelectItem>
                      <SelectItem value="12">Rounded Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Color Presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { bg: "#3b82f6", text: "#ffffff", name: "Blue" },
                    { bg: "#ef4444", text: "#ffffff", name: "Red" },
                    { bg: "#22c55e", text: "#ffffff", name: "Green" },
                    { bg: "#a855f7", text: "#ffffff", name: "Purple" },
                    { bg: "#f59e0b", text: "#ffffff", name: "Orange" },
                    { bg: "#06b6d4", text: "#ffffff", name: "Cyan" },
                    { bg: "#1f2937", text: "#ffffff", name: "Dark" },
                    { bg: "#f3f4f6", text: "#1f2937", name: "Light" },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: preset.bg }}
                      onClick={() => setAvatarConfig(prev => ({
                        ...prev,
                        backgroundColor: preset.bg,
                        textColor: preset.text
                      }))}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAvatarEditor(false)}
              disabled={uploadingPhoto}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomAvatar}
              disabled={uploadingPhoto || !avatarConfig.letter.trim()}
            >
              {uploadingPhoto ? "Saving..." : "Save Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
