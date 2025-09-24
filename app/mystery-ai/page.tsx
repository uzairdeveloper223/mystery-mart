"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import ReactMarkdown from "react-markdown"
import {
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
  History,
  MoreVertical
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useChatStorage, type StoredMessage } from "@/hooks/use-chat-storage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "app-related" | "general" | "error"
  isTyping?: boolean
}

export default function MysteryAIPage() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Check for quick question from floating button
  useEffect(() => {
    const quickQuestion = sessionStorage.getItem('ai-quick-question')
    if (quickQuestion) {
      setInput(quickQuestion)
      sessionStorage.removeItem('ai-quick-question') // Clear it after use
    }
  }, [])

  // Chat storage functionality
  const {
    chats,
    currentChatId,
    isLoading: storageLoading,
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
  } = useChatStorage()

  // Get current chat messages
  const currentChat = getCurrentChat()
  const messages = currentChat?.messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp)
  })) || [
    {
      id: "1",
      role: "assistant" as const,
      content: "Hello! I'm your MysteryMart AI assistant. I can help you with questions about the app, guide you through features, or answer general questions. How can I assist you today?",
      timestamp: new Date(),
      type: "app-related" as const
    }
  ]

  // Function to scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current
      if (smooth) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    // Instant scroll when messages change
    scrollToBottom(false)
    
    // Smooth scroll after a tiny delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      scrollToBottom(true)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [messages])

  // Additional scroll when typing effect updates
  useEffect(() => {
    if (messages.some(m => m.isTyping)) {
      scrollToBottom(true)
    }
  }, [messages.map(m => m.content).join('')]) // Scroll when any message content changes

  // Handle page navigation from AI response buttons
  const handlePageNavigation = (path: string) => {
    // Use Next.js router for navigation instead of window.open
    window.location.href = path
  }

  // Make the function globally available for the HTML buttons
  useEffect(() => {
    (window as any).handlePageNavigation = handlePageNavigation
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isLoading || storageLoading) return

    // Create or get current chat
    let chatId = currentChatId
    if (!chatId) {
      const newChat = createNewChat()
      chatId = newChat.id
    }

    const userMessage: StoredMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      type: "app-related"
    }

    // Add user message to storage
    addMessageToChat(chatId, userMessage)
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          context: "mystery-mart-app",
          userInfo: user ? {
            username: user.username,
            userType: user.userType,
            isSeller: user.canSell
          } : null
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      // Add typing message first
      const typingMessage: StoredMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        type: data.type || "general",
        isTyping: true
      }

      addMessageToChat(chatId, typingMessage)

      // Simulate typing effect
      const fullResponse = data.response
      let currentText = ""
      const typingSpeed = 20 // milliseconds per character

      for (let i = 0; i < fullResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, typingSpeed))
        currentText += fullResponse[i]

        updateMessageInChat(chatId, typingMessage.id, {
          content: currentText,
          isTyping: i === fullResponse.length - 1 ? false : true
        })
      }

    } catch (err) {
      console.error("Error sending message:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")

      const errorMessage: StoredMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date().toISOString(),
        type: "error"
      }

      addMessageToChat(chatId, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    // Clear all chats from storage
    clearAllChats()
    setError(null)
  }

  const getMessageIcon = (role: string, type?: string) => {
    if (role === "user") return <User className="h-4 w-4" />
    if (type === "error") return <HelpCircle className="h-4 w-4 text-red-500" />
    return <Bot className="h-4 w-4" />
  }

  const getMessageBadgeColor = (type?: string) => {
    switch (type) {
      case "app-related":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "general":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

const formatMessage = (content: string) => {
  let formatted = content;

  // Handle GitHub URLs - Look for GitHub URLs and wrap them in custom formatting
  const handleGitHubUrls = (text: string) => {
    return text.replace(
      /(?:\s|^)(https?:\/\/(?:www\.)?github\.com\/[^\s<>"]+)(?=[\s.,!?]|$)/g,
      (_, url) => {
        const cleanUrl = url.trim().replace(/['".,;!?]+$/, '');
        return ` <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 cursor-pointer mx-1 border border-gray-700 hover:border-gray-600 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span class="font-semibold">GitHub</span>
        </a>`;
      }
    );
  };

  // Apply GitHub URL handler first
  formatted = handleGitHubUrls(formatted);

  // Convert page references to clickable buttons with better styling
  formatted = formatted.replace(/\/([a-zA-Z0-9\-_]+)/g, (match, pageName) => {
    const commonWords = [
      'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
      'is','are','was','were','be','been','being','have','has','had','do','does',
      'did','will','would','could','should','may','might','must','can','cant','wont',
      'dont','doesnt','didnt','isnt','arent','wasnt','werent','hasnt','havent',
      'hadnt','wouldnt','couldnt','shouldnt','mightnt','mustnt'
    ];

    if (
      match.includes('://') ||
      commonWords.includes(pageName.toLowerCase()) ||
      pageName.length < 3
    ) {
      return match;
    }

    const validPages = [
      'contact-admin','about','admin','auth','login','register','forgot-password',
      'account-recovery','boxes','cart','checkout','community-guidelines','cookies',
      'dashboard','forbidden','help','messages','notifications','order','orders',
      'privacy','refunds','sell','seller','settings','terms','wishlist','mystery-ai'
    ];

    if (validPages.includes(pageName) || pageName.includes('-')) {
      return `<button onclick="handlePageNavigation('/${pageName}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 rounded-lg transition-all duration-200 cursor-pointer mx-1 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span class="font-semibold">${pageName}</span>
      </button>`;
    }

    return match;
  });

  // Replace line breaks with <br>
  formatted = formatted.replace(/\n/g, '<br />');

  return formatted;
};


  return (
    <div className="min-h-screen bg-background">
      <style jsx>{`
        .typing-cursor::after {
          content: '▊';
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .page-button {
          transition: all 0.2s ease;
        }

        .page-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .message-content strong {
          font-weight: 600;
          color: hsl(var(--primary));
        }

        .message-content em {
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
      `}</style>
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                MysteryMart AI
              </h1>
              <p className="text-muted-foreground mt-2">
                Your intelligent assistant for all things MysteryMart
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="secondary" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              App Questions
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <HelpCircle className="h-3 w-3" />
              General Help
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              Beyond the App
            </Badge>
          </div>
        </div>

        <Card className="h-[700px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask me anything about MysteryMart or general questions
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Chat
              </Button>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {getMessageIcon(message.role, message.type)}
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {message.role === "user" ? "You" : "MysteryAI"}
                        </span>
                        {message.type && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getMessageBadgeColor(message.type)}`}
                          >
                            {message.type === "app-related" && "App Related"}
                            {message.type === "general" && "General"}
                            {message.type === "error" && "Error"}
                          </Badge>
                        )}
                        {message.isTyping && (
                          <Badge variant="secondary" className="text-xs">
                            Typing...
                          </Badge>
                        )}
                      </div>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        {getMessageIcon(message.role)}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">AI Assistant</span>
                        <Badge variant="secondary" className="text-xs">
                          Thinking...
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <LoadingSpinner />
                        <span className="text-sm text-muted-foreground">
                          Generating response...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error: {error}
                </p>
              </div>
            )}

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about MysteryMart or general questions..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-muted-foreground mr-2">Quick questions:</span>
                {[
                  "How do I create a mystery box?",
                  "What are the seller requirements?",
                  "How does the rating system work?",
                  "What payment methods are supported?",
                  "How do I become a verified seller?"
                ].map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setInput(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by advanced AI to help you with MysteryMart questions and general inquiries.
            Your conversations are private and secure.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
