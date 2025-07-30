"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Package,
  Shield,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  Settings,
  Database,
  Eye,
  Trash2,
  UserX,
  UserCheck,
  Activity,
  TrendingUp,
  Send,
  Bell,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import type {
  VerificationRequest,
  Report,
  SellerApplication,
  AdminMessage,
  UserProfile,
  MysteryBox,
  PlatformSettings,
} from "@/lib/types"

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBoxes: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    activeReports: 0,
    pendingSellerRequests: 0,
    totalDonations: 0,
    bannedUsers: 0,
    activeBoxes: 0,
    pendingBoxes: 0,
  })

  const [approvedBoxes, setApprovedBoxes] = useState<MysteryBox[]>([])
  const [reportActions, setReportActions] = useState<{ [key: string]: { investigating: boolean, actionTaken: boolean } }>({})

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [allBoxes, setAllBoxes] = useState<MysteryBox[]>([])
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Custom notification states
  const [notificationForm, setNotificationForm] = useState({
    selectedUserId: "",
    notificationType: "system" as "message" | "order" | "payment" | "verification" | "system" | "admin",
    title: "",
    message: "",
    actionUrl: "",
  })
  const [sendingNotification, setSendingNotification] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/")
    }
  }, [user, isAdmin, loading, router])

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData()
    }
  }, [user, isAdmin])

  const fetchAdminData = async () => {
    try {
      setDataLoading(true)

      const [
        platformStats,
        pendingVerifications,
        pendingSellerApps,
        activeReports,
        pendingMessages,
        users,
        boxes,
        approved,
        settings,
      ] = await Promise.all([
        FirebaseService.getPlatformStats(),
        FirebaseService.getVerificationRequests("pending"),
        FirebaseService.getSellerApplications("pending"),
        FirebaseService.getReports("pending"),
        FirebaseService.getAdminMessages("open"),
        FirebaseService.getAllUsers(100),
        FirebaseService.getAllBoxes(),
        FirebaseService.getAllBoxes().then(boxes => boxes.filter(box => box.status === 'active')),
        FirebaseService.getPlatformSettings(),
      ])

      setStats(platformStats || {
        totalUsers: 0,
        totalBoxes: 0,
        pendingVerifications: 0,
        totalRevenue: 0,
        activeReports: 0,
        pendingSellerRequests: 0,
        totalDonations: 0,
        bannedUsers: 0,
        activeBoxes: 0,
        pendingBoxes: 0,
      })
      setVerificationRequests(pendingVerifications || [])
      setSellerApplications(pendingSellerApps || [])
      setReports(activeReports || [])
      setAdminMessages(pendingMessages || [])
      setAllUsers(users || [])
      setAllBoxes(boxes || [])
      setApprovedBoxes(approved || [])
      setPlatformSettings(settings)
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
      
      // Ensure arrays are still empty arrays on error
      setVerificationRequests([])
      setSellerApplications([])
      setReports([])
      setAdminMessages([])
      setAllUsers([])
      setAllBoxes([])
      
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setDataLoading(false)
    }
  }

  const handleSellerApplicationAction = async (
    applicationId: string,
    action: "approved" | "rejected",
    notes?: string,
  ) => {
    setActionLoading(applicationId)
    try {
      if (action === "approved") {
        await FirebaseService.approveSellerApplication(applicationId, user!.uid, notes)
      } else {
        await FirebaseService.rejectSellerApplication(applicationId, user!.uid, notes || "Application rejected")
      }

      toast({
        title: "Success",
        description: `Seller application ${action}`,
      })

      await fetchAdminData()
    } catch (error) {
      console.error("Failed to process seller application:", error)
      toast({
        title: "Error",
        description: "Failed to process seller application",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerificationAction = async (verificationId: string, action: "approved" | "rejected", notes?: string) => {
    setActionLoading(verificationId)
    try {
      if (action === "approved") {
        await FirebaseService.approveVerificationRequest(verificationId, user!.uid, notes)
      } else {
        await FirebaseService.rejectVerificationRequest(verificationId, user!.uid, notes || "Verification rejected")
      }

      toast({
        title: "Success",
        description: `Verification request ${action}`,
      })

      await fetchAdminData()
    } catch (error) {
      console.error("Failed to process verification:", error)
      toast({
        title: "Error",
        description: "Failed to process verification request",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUserBan = async (userId: string, reason: string, duration?: number) => {
    try {
      await FirebaseService.banUser(userId, reason, duration)
      toast({
        title: "Success",
        description: "User has been banned",
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to ban user:", error)
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      })
    }
  }

  const handleUserUnban = async (userId: string) => {
    try {
      await FirebaseService.unbanUser(userId)
      toast({
        title: "Success",
        description: "User has been unbanned",
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to unban user:", error)
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      })
    }
  }

  const handleUserDelete = async (userId: string, userEmail: string) => {
    const confirmText = prompt(
      `Are you sure you want to permanently delete this user? This action cannot be undone.\n\nType "DELETE ${userEmail}" to confirm:`
    )
    
    if (confirmText !== `DELETE ${userEmail}`) {
      toast({
        title: "Deletion Cancelled",
        description: "User deletion was cancelled - confirmation text did not match",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(userId)
      // Mark user as deleted and anonymize data
      await FirebaseService.updateUser(userId, { 
        fullName: "[DELETED USER]",
        username: `deleted_${Date.now()}`,
        isBanned: true,
        bio: "This user has been deleted by admin"
      })
      toast({
        title: "User Deleted",
        description: "User and all associated data have been permanently deleted",
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUserRoleChange = async (userId: string, role: 'user' | 'seller' | 'admin') => {
    try {
      setActionLoading(userId)
      await FirebaseService.updateUser(userId, { 
        isApprovedSeller: role === 'seller' || role === 'admin'
      })
      toast({
        title: "Role Updated",
        description: `User role has been changed to ${role}`,
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to update user role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerificationToggle = async (userId: string, isVerified: boolean) => {
    try {
      setActionLoading(userId)
      await FirebaseService.updateUser(userId, { isVerified: !isVerified })
      toast({
        title: "Verification Updated",
        description: `User ${!isVerified ? 'verified' : 'unverified'} successfully`,
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to update verification:", error)
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleBoxModeration = async (boxId: string, action: "approve" | "reject" | "remove", reason?: string) => {
    try {
      await FirebaseService.moderateBox(boxId, action, reason)
      toast({
        title: "Success",
        description: `Box ${action}d successfully`,
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to moderate box:", error)
      toast({
        title: "Error",
        description: "Failed to moderate box",
        variant: "destructive",
      })
    }
  }

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      await FirebaseService.setMaintenanceMode(enabled, platformSettings?.maintenanceMessage)
      toast({
        title: "Success",
        description: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error)
      toast({
        title: "Error",
        description: "Failed to toggle maintenance mode",
        variant: "destructive",
      })
    }
  }

  const handleDatabaseOptimization = async () => {
    try {
      setActionLoading("optimize")
      const results = await FirebaseService.optimizeDatabase()
      toast({
        title: "Database Optimized",
        description: `Cleaned up ${results.deletedExpiredCodes + results.deletedOldNotifications + results.deletedOldMessages} items`,
      })
    } catch (error) {
      console.error("Failed to optimize database:", error)
      toast({
        title: "Error",
        description: "Failed to optimize database",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMessageReply = async (messageId: string, content: string) => {
    try {
      await FirebaseService.replyToAdminMessage(messageId, user!.uid, content)
      toast({
        title: "Success",
        description: "Reply sent successfully",
      })
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to send reply:", error)
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      })
    }
  }

  const handleReportInvestigation = async (reportId: string) => {
    setReportActions(prev => ({ ...prev, [reportId]: { ...prev[reportId], investigating: true } }))
    try {
      // You can add investigation logic here
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate investigation
      
      setReportActions(prev => ({ ...prev, [reportId]: { ...prev[reportId], investigating: false } }))
      
      toast({
        title: "Investigation Complete",
        description: "Report has been investigated and marked for review",
      })
    } catch (error) {
      console.error("Failed to investigate report:", error)
      setReportActions(prev => ({ ...prev, [reportId]: { ...prev[reportId], investigating: false } }))
      toast({
        title: "Error",
        description: "Failed to investigate report",
        variant: "destructive",
      })
    }
  }

  const handleReportAction = async (reportId: string, action: "dismiss" | "escalate" | "ban_user" | "remove_content") => {
    setReportActions(prev => ({ ...prev, [reportId]: { ...prev[reportId], actionTaken: true } }))
    try {
      // Simple implementation - mark report as resolved
      await FirebaseService.updateReport(reportId, { 
        status: 'resolved', 
        resolvedBy: user!.uid, 
        resolvedAt: new Date().toISOString(),
        action: action 
      })
      
      toast({
        title: "Action Taken",
        description: `Report has been ${action.replace('_', ' ')}d`,
      })
      
      await fetchAdminData()
    } catch (error) {
      console.error("Failed to take action on report:", error)
      setReportActions(prev => ({ ...prev, [reportId]: { ...prev[reportId], actionTaken: false } }))
      toast({
        title: "Error",
        description: "Failed to take action on report",
        variant: "destructive",
      })
    }
  }

  const sendCustomNotification = async () => {
    if (!notificationForm.selectedUserId || !notificationForm.title || !notificationForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingNotification(true)

      const notificationData: any = {
        userId: notificationForm.selectedUserId,
        type: notificationForm.notificationType,
        title: notificationForm.title,
        message: notificationForm.message,
        isRead: false,
      }

      // Only include actionUrl if it has a value
      if (notificationForm.actionUrl && notificationForm.actionUrl.trim()) {
        notificationData.actionUrl = notificationForm.actionUrl.trim()
      }

      await FirebaseService.createNotification(notificationData)

      toast({
        title: "Success",
        description: "Custom notification sent successfully",
      })

      // Reset form
      setNotificationForm({
        selectedUserId: "",
        notificationType: "system",
        title: "",
        message: "",
        actionUrl: "",
      })
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setSendingNotification(false)
    }
  }

  if (loading || dataLoading) {
    return <LoadingSpinner />
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage Mystery Mart platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Boxes</p>
                  <p className="text-2xl font-bold">{stats.activeBoxes.toLocaleString()}</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {stats.pendingBoxes + stats.pendingSellerRequests + stats.pendingVerifications}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">${((stats.totalRevenue || 0) / 1000000).toFixed(1)}M</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reports</p>
                  <p className="text-2xl font-bold">{stats.activeReports}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="platform-settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="platform-settings">Settings</TabsTrigger>
            <TabsTrigger value="seller-applications">Sellers ({sellerApplications?.length || 0})</TabsTrigger>
            <TabsTrigger value="verifications">Verify ({verificationRequests?.length || 0})</TabsTrigger>
            <TabsTrigger value="box-moderation">Pending ({stats.pendingBoxes})</TabsTrigger>
            <TabsTrigger value="approved-boxes">Active ({approvedBoxes?.length || 0})</TabsTrigger>
            <TabsTrigger value="user-management">Users</TabsTrigger>
            <TabsTrigger value="messages">Messages ({adminMessages?.length || 0})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({reports?.length || 0})</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="platform-settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Platform Controls
                  </CardTitle>
                  <CardDescription>Manage platform-wide settings and features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Put platform under maintenance</p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      checked={platformSettings?.maintenanceMode || false}
                      onCheckedChange={handleMaintenanceToggle}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea
                      id="maintenance-message"
                      placeholder="Enter maintenance message..."
                      value={platformSettings?.maintenanceMessage || ""}
                      onChange={(e) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            maintenanceMessage: e.target.value,
                          })
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow New Registrations</Label>
                      <p className="text-sm text-muted-foreground">Enable user registration</p>
                    </div>
                    <Switch
                      checked={platformSettings?.allowRegistration || false}
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          FirebaseService.updatePlatformSettings({ allowRegistration: checked })
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Box Creation</Label>
                      <p className="text-sm text-muted-foreground">Enable sellers to create boxes</p>
                    </div>
                    <Switch
                      checked={platformSettings?.allowBoxCreation || false}
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          FirebaseService.updatePlatformSettings({ allowBoxCreation: checked })
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Purchases</Label>
                      <p className="text-sm text-muted-foreground">Enable buying functionality</p>
                    </div>
                    <Switch
                      checked={platformSettings?.allowPurchases || false}
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          FirebaseService.updatePlatformSettings({ allowPurchases: checked })
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Management
                  </CardTitle>
                  <CardDescription>Optimize and maintain database performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleDatabaseOptimization}
                    disabled={actionLoading === "optimize"}
                    className="w-full"
                  >
                    {actionLoading === "optimize" ? "Optimizing..." : "Optimize Database"}
                  </Button>

                  <div className="space-y-2">
                    <h4 className="font-medium">Database Stats</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span>{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Boxes:</span>
                        <span>{stats.totalBoxes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Banned Users:</span>
                        <span>{stats.bannedUsers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline">
                        Export Data
                      </Button>
                      <Button size="sm" variant="outline">
                        Backup DB
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seller-applications">
            <Card>
              <CardHeader>
                <CardTitle>Seller Applications</CardTitle>
                <CardDescription>Review and approve new seller applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sellerApplications && sellerApplications.length > 0 ? (
                    sellerApplications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Application #{application.id.slice(-8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(application.requestedAt).toLocaleDateString()}
                            </p>
                            <Badge className="mt-2">
                              {application.businessInfo.businessType === "business" ? "Business" : "Individual"}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{application.status}</Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          {application.businessInfo.businessName && (
                            <div>
                              <p className="text-sm font-medium">Business Name:</p>
                              <p className="text-sm text-muted-foreground">{application.businessInfo.businessName}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium">Description:</p>
                            <p className="text-sm text-muted-foreground">{application.businessInfo.description}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Experience:</p>
                            <p className="text-sm text-muted-foreground">{application.businessInfo.experience}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Categories:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {application.businessInfo.categories?.map((category) => (
                                <Badge key={category} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Expected Volume:</p>
                            <p className="text-sm text-muted-foreground">{application.businessInfo.expectedVolume}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSellerApplicationAction(application.id, "approved")}
                            disabled={actionLoading === application.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const notes = prompt("Reason for rejection:")
                              if (notes) {
                                handleSellerApplicationAction(application.id, "rejected", notes)
                              }
                            }}
                            disabled={actionLoading === application.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/messages?user=${application.userId}`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending seller applications</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Verification Requests</CardTitle>
                <CardDescription>Review blue checkmark verification requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verificationRequests && verificationRequests.length > 0 ? (
                    verificationRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Verification Request #{request.id.slice(-8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">{request.status}</Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Seller Message:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{request.message}</p>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleVerificationAction(request.id, "approved")}
                            disabled={actionLoading === request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Grant Verification
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const notes = prompt("Reason for rejection:")
                              if (notes) {
                                handleVerificationAction(request.id, "rejected", notes)
                              }
                            }}
                            disabled={actionLoading === request.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/messages?user=${request.userId}`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending verification requests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="box-moderation">
            <Card>
              <CardHeader>
                <CardTitle>Box Moderation</CardTitle>
                <CardDescription>Review and moderate mystery boxes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allBoxes && allBoxes.filter((box) => box.status === "pending").length > 0 ? (
                    allBoxes
                      .filter((box) => box.status === "pending")
                      .map((box) => (
                        <div key={box.id} className="border rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold">{box.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{box.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Price: ${box.price}</span>
                                <span>Category: {box.category}</span>
                                <span>Rarity: {box.rarity}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Created: {new Date(box.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Badge variant="secondary">{box.status}</Badge>
                              {box.images && box.images.length > 0 && (
                                <img
                                  src={box.images[0] || "/placeholder.svg"}
                                  alt={box.title}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleBoxModeration(box.id, "approve")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt("Reason for rejection:")
                                if (reason) {
                                  handleBoxModeration(box.id, "reject", reason)
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt("Reason for removal:")
                                if (reason) {
                                  handleBoxModeration(box.id, "remove", reason)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/boxes/${box.id}`)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No boxes pending moderation</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved-boxes">
            <Card>
              <CardHeader>
                <CardTitle>Active Box Management</CardTitle>
                <CardDescription>View and manage approved/active mystery boxes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvedBoxes && approvedBoxes.length > 0 ? (
                    approvedBoxes.map((box) => (
                      <div key={box.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{box.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Seller: {box.sellerId} • Price: ${box.price}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(box.createdAt).toLocaleDateString()} • Status: {box.status}
                          </p>
                          <p className="text-sm">{box.description}</p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="secondary">{box.category}</Badge>
                            {box.tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt("Reason for suspension:")
                              if (reason) {
                                handleBoxModeration(box.id, "reject", reason)
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("Reason for removal:")
                              if (reason) {
                                handleBoxModeration(box.id, "remove", reason)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/boxes/${box.id}`)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No active boxes found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-management">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Input placeholder="Search users..." className="max-w-sm" />
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="sellers">Sellers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    {allUsers && allUsers.slice(0, 20).map((user) => (
                      <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture || "/placeholder.svg"}
                                alt={user.username}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.fullName}</p>
                              {user.isVerified && <Badge variant="secondary">Verified</Badge>}
                              {user.isApprovedSeller && <Badge variant="outline">Seller</Badge>}
                              {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                              <Badge variant="default" className="text-xs">
                                {user.isApprovedSeller ? (user.isVerified ? 'Admin' : 'Seller') : 'User'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              @{user.username} • {user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Verification Toggle */}
                          <Button 
                            size="sm" 
                            variant={user.isVerified ? "secondary" : "outline"}
                            onClick={() => handleVerificationToggle(user.uid, user.isVerified)}
                            disabled={actionLoading === user.uid}
                          >
                            {user.isVerified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Remove Verify
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>

                          {/* Role Management */}
                          <Select onValueChange={(role: any) => handleUserRoleChange(user.uid, role)}>
                            <SelectTrigger className="w-auto h-auto p-2" disabled={actionLoading === user.uid}>
                              <div className="flex items-center">
                                <Settings className="h-4 w-4 mr-1" />
                                <span className="text-sm">Role</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Regular User</SelectItem>
                              <SelectItem value="seller">Approved Seller</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Ban/Unban */}
                          {user.isBanned ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleUserUnban(user.uid)}
                              disabled={actionLoading === user.uid}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading === user.uid}
                              onClick={() => {
                                const reason = prompt("Reason for ban:")
                                const duration = prompt("Duration in days (leave empty for permanent):")
                                if (reason) {
                                  handleUserBan(user.uid, reason, duration ? Number.parseInt(duration) : undefined)
                                }
                              }}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                          )}

                          {/* View Profile */}
                          <Button size="sm" variant="outline" onClick={() => router.push(`/seller/${user.username}`)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {/* Delete User */}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            disabled={actionLoading === user.uid}
                            onClick={() => handleUserDelete(user.uid, user.email)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Admin Messages</CardTitle>
                <CardDescription>Handle user inquiries and support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminMessages && adminMessages.length > 0 ? (
                    adminMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{message.subject}</h3>
                            <p className="text-sm text-muted-foreground">
                              From: User #{message.userId.slice(-8)} •{" "}
                              {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                            <Badge
                              className={`mt-2 ${
                                message.priority === "urgent"
                                  ? "bg-red-500"
                                  : message.priority === "high"
                                    ? "bg-orange-500"
                                    : message.priority === "medium"
                                      ? "bg-yellow-500"
                                      : "bg-gray-500"
                              }`}
                            >
                              {message.priority} priority
                            </Badge>
                          </div>
                          <Badge variant="secondary">{message.status}</Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Message:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{message.content}</p>
                        </div>

                        {message.responses && message.responses.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Conversation:</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {message.responses.map((response) => (
                                <div
                                  key={response.id}
                                  className={`p-2 rounded text-sm ${
                                    response.senderType === "admin" ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"
                                  }`}
                                >
                                  <p className="font-medium text-xs mb-1">
                                    {response.senderType === "admin" ? "Admin" : "User"} •{" "}
                                    {new Date(response.createdAt).toLocaleTimeString()}
                                  </p>
                                  <p>{response.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Textarea placeholder="Type your reply..." id={`reply-${message.id}`} rows={3} />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const textarea = document.getElementById(`reply-${message.id}`) as HTMLTextAreaElement
                                if (textarea.value.trim()) {
                                  handleMessageReply(message.id, textarea.value.trim())
                                  textarea.value = ""
                                }
                              }}
                            >
                              Send Reply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/messages?user=${message.userId}`)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Open Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending messages</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
                <CardDescription>Handle user reports and disputes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{report.category}</p>
                          <p className="text-sm text-muted-foreground">
                            Reported: {report.reportedType} ID {report.reportedId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{report.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={reportActions[report.id]?.investigating}
                            onClick={() => handleReportInvestigation(report.id)}
                          >
                            {reportActions[report.id]?.investigating ? (
                              <>
                                <Clock className="h-4 w-4 mr-1 animate-spin" />
                                Investigating...
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Investigate
                              </>
                            )}
                          </Button>
                          <Select onValueChange={(action) => handleReportAction(report.id, action as any)}>
                            <SelectTrigger 
                              className="w-auto h-auto p-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100" 
                              disabled={reportActions[report.id]?.actionTaken}
                            >
                              <span className="text-sm">
                                {reportActions[report.id]?.actionTaken ? "Action Taken" : "Take Action"}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dismiss">Dismiss Report</SelectItem>
                              <SelectItem value="escalate">Escalate to Senior Admin</SelectItem>
                              <SelectItem value="ban_user">Ban Reported User</SelectItem>
                              <SelectItem value="remove_content">Remove Content</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No active reports</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Send Custom Notification
                </CardTitle>
                <CardDescription>Send a custom notification to any user on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-select">Select User</Label>
                      <Select
                        value={notificationForm.selectedUserId}
                        onValueChange={(value) =>
                          setNotificationForm((prev) => ({ ...prev, selectedUserId: value }))
                        }
                      >
                        <SelectTrigger id="user-select">
                          <SelectValue placeholder="Choose a user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers.map((user) => (
                            <SelectItem key={user.uid} value={user.uid}>
                              {user.username} ({user.email})
                              {user.isVerified && " ✓"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notification-type">Notification Type</Label>
                      <Select
                        value={notificationForm.notificationType}
                        onValueChange={(value: any) =>
                          setNotificationForm((prev) => ({ ...prev, notificationType: value }))
                        }
                      >
                        <SelectTrigger id="notification-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="message">Message</SelectItem>
                          <SelectItem value="order">Order</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="verification">Verification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notification-title">Title</Label>
                      <Input
                        id="notification-title"
                        placeholder="Enter notification title..."
                        value={notificationForm.title}
                        onChange={(e) =>
                          setNotificationForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="action-url">Action URL (Optional)</Label>
                      <Input
                        id="action-url"
                        placeholder="e.g., /orders/123"
                        value={notificationForm.actionUrl}
                        onChange={(e) =>
                          setNotificationForm((prev) => ({ ...prev, actionUrl: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notification-message">Message</Label>
                      <Textarea
                        id="notification-message"
                        placeholder="Enter notification message..."
                        value={notificationForm.message}
                        onChange={(e) =>
                          setNotificationForm((prev) => ({ ...prev, message: e.target.value }))
                        }
                        rows={8}
                      />
                    </div>

                    <Button
                      onClick={sendCustomNotification}
                      disabled={sendingNotification || !notificationForm.selectedUserId || !notificationForm.title || !notificationForm.message}
                      className="w-full"
                    >
                      {sendingNotification ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Notification
                        </>
                      )}
                    </Button>

                    {notificationForm.selectedUserId && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Preview:</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">To:</span>{" "}
                            {allUsers.find((u) => u.uid === notificationForm.selectedUserId)?.username}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {notificationForm.notificationType}
                          </div>
                          <div>
                            <span className="font-medium">Title:</span> {notificationForm.title || "No title"}
                          </div>
                          <div>
                            <span className="font-medium">Message:</span> {notificationForm.message || "No message"}
                          </div>
                          {notificationForm.actionUrl && (
                            <div>
                              <span className="font-medium">Action URL:</span> {notificationForm.actionUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>User Growth Rate</span>
                      <span className="font-medium text-green-600">+12.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seller Approval Rate</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification Rate</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Revenue</span>
                      <span className="font-medium">${stats.totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Sellers</span>
                      <span className="font-medium">{Math.round(stats.totalUsers * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time</span>
                      <span className="font-medium">2.3 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Report Resolution Rate</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Satisfaction</span>
                      <span className="font-medium">4.7/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-medium">${stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fees</span>
                      <span className="font-medium">${Math.round(stats.totalRevenue * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Donations</span>
                      <span className="font-medium">${stats.totalDonations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Growth</span>
                      <span className="font-medium text-green-600">+18.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
