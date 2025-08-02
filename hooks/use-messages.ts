"use client"

import { useState, useEffect } from "react"
import { FirebaseService } from "@/lib/firebase-service"
import { useAuth } from "@/components/providers/auth-provider"
import type { Conversation, Message } from "@/lib/types"

export function useMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setConversations([])
      setUnreadMessageCount(0)
      setLoading(false)
      return
    }

    // Subscribe to real-time conversations from Firebase
    const unsubscribe = FirebaseService.subscribeToUserConversations(user.uid, (fetchedConversations) => {
      // Calculate unread count for each conversation and total
      const conversationsWithUnread = fetchedConversations.map((conversation: any) => {
        // Count unread messages for this user in this conversation
        const unreadCount = conversation.unreadCount || 0
        return {
          ...conversation,
          unreadCount
        }
      })
      
      setConversations(conversationsWithUnread)
      
      // Calculate total unread messages
      const totalUnread = conversationsWithUnread.reduce((total: number, conv: any) => {
        return total + (conv.unreadCount || 0)
      }, 0)
      
      setUnreadMessageCount(totalUnread)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  return {
    conversations,
    loading,
    unreadMessageCount,
  }
}
