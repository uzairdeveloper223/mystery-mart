"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Sparkles, MessageSquare, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface FloatingAIButtonProps {
  className?: string
}

export function FloatingAIButton({ className = "" }: FloatingAIButtonProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  // Hide button on the AI chat page itself
  useEffect(() => {
    const currentPath = window.location.pathname
    setIsVisible(!currentPath.includes('/mystery-ai'))
  }, [])

  // Listen for route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname
      setIsVisible(!currentPath.includes('/mystery-ai'))
    }

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  const handleClick = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      // Navigate to AI chat page
      router.push('/mystery-ai')
    }
  }

  const handleQuickChat = (question: string) => {
    // Store the question in sessionStorage so the AI page can pick it up
    sessionStorage.setItem('ai-quick-question', question)
    router.push('/mystery-ai')
    setIsExpanded(false)
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Quick questions panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 mb-4 bg-background border border-border rounded-lg shadow-lg p-4 w-80 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Quick Questions
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            {[
              "How do I create a mystery box?",
              "What are the seller requirements?",
              "How does the rating system work?",
              "What payment methods are supported?",
              "How do I become a verified seller?"
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickChat(question)}
                className="w-full justify-start text-left text-xs h-8 px-3"
              >
                {question}
              </Button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <Button
              onClick={() => router.push('/mystery-ai')}
              className="w-full gap-2"
              size="sm"
            >
              <Bot className="h-4 w-4" />
              Open Full Chat
            </Button>
          </div>
        </div>
      )}

      {/* Main floating button */}
      <Button
        onClick={handleClick}
        className={`
          h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300
          bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
          text-white border-2 border-white hover:border-purple-200
          ${isExpanded ? 'rotate-45 scale-110' : 'hover:scale-110'}
          group relative overflow-hidden
        `}
        size="icon"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Sparkle effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-3 w-3 absolute top-1 left-2 animate-pulse" />
          <Sparkles className="h-3 w-3 absolute top-2 right-1 animate-pulse delay-100" />
          <Sparkles className="h-3 w-3 absolute bottom-1 left-1 animate-pulse delay-200" />
        </div>

        {/* Main icon */}
        <div className="relative z-10 transition-transform duration-300">
          {isExpanded ? (
            <X className="h-6 w-6" />
          ) : (
            <Bot className="h-6 w-6" />
          )}
        </div>

        {/* Pulse animation ring */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-20" />

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {isExpanded ? 'Close' : 'Chat with AI'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </Button>

      {/* Notification badge for new features */}
      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-bounce">
        AI
      </div>
    </div>
  )
}
