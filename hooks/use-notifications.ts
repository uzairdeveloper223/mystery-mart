"use client"

import { useState, useEffect } from "react"
import { FirebaseService } from "@/lib/firebase-service"
import { useAuth } from "@/hooks/use-auth"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Subscribe to real-time notifications from Firebase
    const unsubscribe = FirebaseService.subscribeToUserNotifications(user.uid, (fetchedNotifications) => {
      setNotifications(fetchedNotifications)
      setUnreadCount(fetchedNotifications.filter((n) => !n.isRead).length)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      await FirebaseService.markNotificationAsRead(notificationId)
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead)
      await Promise.all(
        unreadNotifications.map((notification) => FirebaseService.markNotificationAsRead(notification.id)),
      )
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await FirebaseService.deleteNotification(notificationId)
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const createNotification = async (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => {
    try {
      await FirebaseService.createNotification({
        ...notification,
        isRead: false,
      })
    } catch (error) {
      console.error("Failed to create notification:", error)
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  }
}
