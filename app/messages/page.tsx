"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
} from "lucide-react"
import type { Conversation, Message, UserProfile } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      initializeMessages()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const conversationId = searchParams.get("conversation")
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation) {
        setActiveConversation(conversation)
      }
    }
  }, [searchParams, conversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeMessages = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Subscribe to real-time conversations
      const unsubscribeConversations = FirebaseService.subscribeToUserConversations(
        user.uid,
        (fetchedConversations) => {
          setConversations(fetchedConversations)
          setLoading(false)
        },
      )

      // Subscribe to online users
      const unsubscribeOnlineUsers = FirebaseService.subscribeToOnlineUsers((users) => {
        setOnlineUsers(new Set(users))
      })

      return () => {
        unsubscribeConversations()
        unsubscribeOnlineUsers()
      }
    } catch (error) {
      console.error("Failed to initialize messages:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeConversation || !user) return

    // Subscribe to real-time messages for active conversation
    const unsubscribeMessages = FirebaseService.subscribeToConversationMessages(
      activeConversation.id,
      (fetchedMessages) => {
        setMessages(fetchedMessages)

        // Mark messages as read
        const unreadMessages = fetchedMessages.filter(
          (msg) => msg.senderId !== user.uid && !msg.readBy?.includes(user.uid),
        )

        if (unreadMessages.length > 0) {
          unreadMessages.forEach((msg) => {
            FirebaseService.markMessageAsRead(msg.id, user.uid)
          })
        }
      },
    )

    // Subscribe to typing indicators
    const unsubscribeTyping = FirebaseService.subscribeToTypingIndicators(activeConversation.id, (typingUserIds) => {
      setTypingUsers(typingUserIds.filter((id) => id !== user.uid))
    })

    return () => {
      unsubscribeMessages()
      unsubscribeTyping()
    }
  }, [activeConversation, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !user || sending) return

    const messageText = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      // Optimistic UI update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversation.id,
        senderId: user.uid,
        senderName: user.fullName,
        senderAvatar: user.profilePicture || "",
        content: messageText,
        type: "text",
        createdAt: new Date().toISOString(),
        status: "sending",
        readBy: [],
      }

      setMessages((prev) => [...prev, tempMessage])
      scrollToBottom()

      // Send message to Firebase
      await FirebaseService.sendMessage({
        conversationId: activeConversation.id,
        senderId: user.uid,
        content: messageText,
        type: "text",
      })

      // Stop typing indicator
      await FirebaseService.setTypingStatus(activeConversation.id, user.uid, false)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })

      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== `temp-${Date.now()}`))
    } finally {
      setSending(false)
    }
  }

  const handleTyping = async (value: string) => {
    setNewMessage(value)

    if (!activeConversation || !user) return

    // Set typing indicator
    if (value.trim()) {
      await FirebaseService.setTypingStatus(activeConversation.id, user.uid, true)
    } else {
      await FirebaseService.setTypingStatus(activeConversation.id, user.uid, false)
    }
  }

  const getOtherParticipant = (conversation: Conversation): UserProfile | null => {
    if (!user) return null
    return conversation.participants.find((p) => p.id !== user.uid) || null
  }

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId)
  }

  const getMessageStatus = (message: Message): string => {
    if (message.senderId !== user?.uid) return ""

    switch (message.status) {
      case "sending":
        return "Sending..."
      case "sent":
        return "Sent"
      case "delivered":
        return "Delivered"
      case "read":
        return "Read"
      default:
        return ""
    }
  }

  const getMessageStatusIcon = (message: Message) => {
    if (message.senderId !== user?.uid) return null

    switch (message.status) {
      case "sending":
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return (
      otherParticipant?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]"
        >
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Messages</span>
                <Badge variant="secondary">{conversations.length}</Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation, index) => {
                      const otherParticipant = getOtherParticipant(conversation)
                      const isActive = activeConversation?.id === conversation.id
                      const isOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false

                      return (
                        <motion.div
                          key={conversation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          className={`p-4 cursor-pointer border-b transition-colors ${
                            isActive ? "bg-muted" : "hover:bg-muted/50"
                          }`}
                          onClick={() => setActiveConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage
                                  src={otherParticipant?.profilePicture || "/placeholder.svg"}
                                  alt={otherParticipant?.displayName || "User"}
                                />
                                <AvatarFallback>{otherParticipant?.displayName?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold truncate">
                                  {otherParticipant?.displayName || "Unknown User"}
                                </p>
                                {conversation.lastMessage && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.lastMessage?.content || "No messages yet"}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery ? "No conversations found" : "No conversations yet"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setActiveConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getOtherParticipant(activeConversation)?.profilePicture || "/placeholder.svg"}
                            alt={getOtherParticipant(activeConversation)?.displayName || "User"}
                          />
                          <AvatarFallback>
                            {getOtherParticipant(activeConversation)?.displayName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {getOtherParticipant(activeConversation) &&
                          isUserOnline(getOtherParticipant(activeConversation)!.id) && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {getOtherParticipant(activeConversation)?.displayName || "Unknown User"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getOtherParticipant(activeConversation) &&
                          isUserOnline(getOtherParticipant(activeConversation)!.id)
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message, index) => {
                        const isOwn = message.senderId === user.uid
                        const showAvatar =
                          index === 0 ||
                          messages[index - 1].senderId !== message.senderId ||
                          new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() >
                            300000 // 5 minutes

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"} message-enter`}
                          >
                            <div
                              className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}
                            >
                              {!isOwn && showAvatar && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={message.senderAvatar || "/placeholder.svg"}
                                    alt={message.senderName}
                                  />
                                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              {!isOwn && !showAvatar && <div className="w-8" />}

                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div
                                  className={`flex items-center justify-between mt-1 text-xs ${
                                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}
                                >
                                  <span>
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {isOwn && (
                                    <div className="flex items-center space-x-1 ml-2">
                                      {getMessageStatusIcon(message)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {/* Typing Indicator */}
                    <AnimatePresence>
                      {typingUsers.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-end space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={getOtherParticipant(activeConversation)?.profilePicture || "/placeholder.svg"}
                                alt={getOtherParticipant(activeConversation)?.displayName || "User"}
                              />
                              <AvatarFallback>
                                {getOtherParticipant(activeConversation)?.displayName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg px-4 py-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sending}
                      className="mystery-gradient text-white btn-press"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                </motion.div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
