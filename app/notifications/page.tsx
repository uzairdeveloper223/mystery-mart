"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useNotifications } from "@/hooks/use-notifications"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  MessageCircle, 
  Package, 
  CreditCard, 
  Shield, 
  Settings, 
  User,
  Filter,
  Search,
  X
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import type { Notification } from "@/lib/types"

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "message":
      return <MessageCircle className="h-5 w-5" />
    case "order":
      return <Package className="h-5 w-5" />
    case "payment":
      return <CreditCard className="h-5 w-5" />
    case "verification":
      return <Shield className="h-5 w-5" />
    case "system":
      return <Settings className="h-5 w-5" />
    case "admin":
      return <User className="h-5 w-5" />
    default:
      return <Bell className="h-5 w-5" />
  }
}

const getNotificationGradient = (type: Notification["type"]) => {
  switch (type) {
    case "message":
      return "from-blue-500 to-cyan-500"
    case "order":
      return "from-green-500 to-emerald-500"
    case "payment":
      return "from-yellow-500 to-orange-500"
    case "verification":
      return "from-purple-500 to-violet-500"
    case "system":
      return "from-gray-500 to-slate-500"
    case "admin":
      return "from-red-500 to-pink-500"
    default:
      return "from-blue-500 to-purple-500"
  }
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { toast } = useToast()
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [typeFilter, setTypeFilter] = useState<Notification["type"] | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return <LoadingSpinner variant="mystery" size="lg" text="Loading notifications..." fullScreen />
  }

  if (!user) {
    return null
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesReadFilter = 
      filter === "all" || 
      (filter === "unread" && !notification.isRead) || 
      (filter === "read" && notification.isRead)
    
    const matchesTypeFilter = typeFilter === "all" || notification.type === typeFilter
    
    const matchesSearch = searchQuery === "" || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesReadFilter && matchesTypeFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
      toast({
        title: "Success",
        description: "Notification deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const notificationTypes = [
    { value: "all", label: "All", icon: Bell },
    { value: "message", label: "Messages", icon: MessageCircle },
    { value: "order", label: "Orders", icon: Package },
    { value: "payment", label: "Payments", icon: CreditCard },
    { value: "verification", label: "Verification", icon: Shield },
    { value: "system", label: "System", icon: Settings },
    { value: "admin", label: "Admin", icon: User },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Bell className="h-8 w-8" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Badge variant="destructive" className="text-sm px-3 py-1">
                        {unreadCount} new
                      </Badge>
                    </motion.div>
                  )}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Stay updated with your latest activities and messages
                </p>
              </div>
              
              {unreadCount > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={handleMarkAllAsRead} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="mb-6 border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* Read Status Filter */}
                  <div className="flex space-x-2">
                    {[
                      { key: "all", label: `All (${notifications.length})` },
                      { key: "unread", label: `Unread (${unreadCount})` },
                      { key: "read", label: `Read (${notifications.length - unreadCount})` }
                    ].map((item) => (
                      <motion.div key={item.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant={filter === item.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilter(item.key as any)}
                          className={filter === item.key ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : ""}
                        >
                          {item.label}
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="w-px h-8 bg-border" />

                  {/* Type Filter */}
                  <div className="flex flex-wrap gap-2">
                    {notificationTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <motion.div key={type.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={typeFilter === type.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTypeFilter(type.value as any)}
                            className={`${typeFilter === type.value ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : ""} flex items-center space-x-1`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{type.label}</span>
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner variant="mystery" size="lg" text="Loading notifications..." />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardContent className="py-16">
                  <div className="text-center">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="inline-block p-4 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 mb-4"
                    >
                      <BellOff className="h-16 w-16 text-muted-foreground" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">No notifications found</h2>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No notifications match "${searchQuery}"`
                        : filter === "unread" 
                        ? "You're all caught up! No unread notifications."
                        : typeFilter !== "all"
                        ? `No ${typeFilter} notifications found.`
                        : "You don't have any notifications yet."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group"
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${
                        !notification.isRead 
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-l-4 border-l-blue-500" 
                          : "bg-white/50 dark:bg-gray-900/50 hover:bg-white/70 dark:hover:bg-gray-900/70"
                      } backdrop-blur-sm`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between space-x-4">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Icon */}
                            <motion.div 
                              className={`p-3 rounded-xl bg-gradient-to-r ${getNotificationGradient(notification.type)} text-white shadow-lg`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              {getNotificationIcon(notification.type)}
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className={`font-semibold text-lg ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                  {notification.title}
                                </h3>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs bg-gradient-to-r ${getNotificationGradient(notification.type)} text-white`}
                                >
                                  {notification.type}
                                </Badge>
                                {!notification.isRead && (
                                  <motion.div 
                                    className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                )}
                              </div>
                              
                              <p className={`text-sm ${!notification.isRead ? "text-foreground" : "text-muted-foreground"} mb-3 leading-relaxed`}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                  <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                </span>
                                {notification.actionUrl && (
                                  <span className="text-blue-500 font-medium">Click to view →</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="h-9 w-9 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                              </motion.div>
                            )}
                            
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load More Button (if needed for pagination) */}
          {filteredNotifications.length > 0 && filteredNotifications.length >= 20 && (
            <motion.div 
              className="text-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="outline" className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                Load More Notifications
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}