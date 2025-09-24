"use client"

import { useState, useEffect, useCallback } from 'react'

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  type?: 'app-related' | 'general' | 'error'
  isTyping?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: StoredMessage[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'mystery-mart-chats'
const CURRENT_CHAT_KEY = 'mystery-mart-current-chat'

export function useChatStorage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load chats from localStorage on mount
  useEffect(() => {
    try {
      const storedChats = localStorage.getItem(STORAGE_KEY)
      const storedCurrentChatId = localStorage.getItem(CURRENT_CHAT_KEY)

      if (storedChats) {
        const parsedChats = JSON.parse(storedChats)
        setChats(parsedChats)
      }

      if (storedCurrentChatId) {
        setCurrentChatId(storedCurrentChatId)
      }
    } catch (error) {
      console.error('Error loading chats from storage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
      } catch (error) {
        console.error('Error saving chats to storage:', error)
      }
    }
  }, [chats, isLoading])

  // Save current chat ID whenever it changes
  useEffect(() => {
    if (!isLoading && currentChatId !== null) {
      try {
        localStorage.setItem(CURRENT_CHAT_KEY, currentChatId)
      } catch (error) {
        console.error('Error saving current chat ID:', error)
      }
    }
  }, [currentChatId, isLoading])

  const createNewChat = useCallback((): Chat => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! I\'m your MysteryMart AI assistant. I can help you with questions about the app, guide you through features, or answer general questions. How can I assist you today?',
          timestamp: new Date().toISOString(),
          type: 'app-related'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    return newChat
  }, [])

  const addMessageToChat = useCallback((chatId: string, message: StoredMessage) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, message],
          updatedAt: new Date().toISOString()
        }
      }
      return chat
    }))
  }, [])

  const updateMessageInChat = useCallback((chatId: string, messageId: string, updates: Partial<StoredMessage>) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
          updatedAt: new Date().toISOString()
        }
      }
      return chat
    }))
  }, [])

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))

    // If we deleted the current chat, switch to the most recent one or create a new one
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id)
      } else {
        setCurrentChatId(null)
        localStorage.removeItem(CURRENT_CHAT_KEY)
      }
    }
  }, [currentChatId, chats])

  const clearAllChats = useCallback(() => {
    setChats([])
    setCurrentChatId(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_CHAT_KEY)
  }, [])

  const getCurrentChat = useCallback((): Chat | null => {
    if (!currentChatId) return null
    return chats.find(chat => chat.id === currentChatId) || null
  }, [currentChatId, chats])

  const switchToChat = useCallback((chatId: string) => {
    if (chats.find(chat => chat.id === chatId)) {
      setCurrentChatId(chatId)
    }
  }, [chats])

  const exportChats = useCallback(() => {
    const dataStr = JSON.stringify(chats, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `mystery-mart-chats-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [chats])

  const importChats = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedChats = JSON.parse(e.target?.result as string)
          if (Array.isArray(importedChats)) {
            setChats(prev => [...importedChats, ...prev])
            resolve()
          } else {
            reject(new Error('Invalid file format'))
          }
        } catch (error) {
          reject(new Error('Failed to parse file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const getStorageInfo = useCallback(() => {
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
    const totalSize = JSON.stringify(chats).length

    return {
      totalChats: chats.length,
      totalMessages,
      totalSize,
      lastUpdated: chats.length > 0 ? chats[0].updatedAt : null
    }
  }, [chats])

  return {
    chats,
    currentChatId,
    isLoading,
    createNewChat,
    addMessageToChat,
    updateMessageInChat,
    deleteChat,
    clearAllChats,
    getCurrentChat,
    switchToChat,
    exportChats,
    importChats,
    getStorageInfo
  }
}
