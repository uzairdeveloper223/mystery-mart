"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { User, Settings, Bell, MapPin, Shield, CheckCircle, Clock, X, Upload, Star, Award } from "lucide-react"
import type { Address } from "@/lib/types"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showVerificationRequest, setShowVerificationRequest] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")

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
                        <Button type="button" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Photo
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
                        <span className="font-semibold">{user.rating.toFixed(1)}</span>
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
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive">
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
                      <Button className="mystery-gradient text-white">Add Address</Button>
                    </div>
                  )}
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
                        <h3 className="font-semibold">Password</h3>
                        <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Account Recovery</h3>
                        <p className="text-sm text-muted-foreground">Set up recovery options</p>
                      </div>
                      <Button variant="outline" onClick={() => router.push("/auth/account-recovery")}>
                        Setup Recovery
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Login Sessions</h3>
                        <p className="text-sm text-muted-foreground">Manage your active sessions</p>
                      </div>
                      <Button variant="outline">View Sessions</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-red-600">Delete Account</h3>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive">Delete Account</Button>
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
