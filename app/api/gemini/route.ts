import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCBMoXGrZhDSFLw1pQ4I62aVBC9BusRTEo")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

// Read the app documentation for context
const fs = require('fs')
const path = require('path')

let appContext = ""
try {
  const contextPath = path.join(process.cwd(), 'for-model.txt')
  appContext = fs.readFileSync(contextPath, 'utf8')
} catch (error) {
  console.warn("Could not load app context:", error)
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, userInfo } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Determine if this is an app-related question or general question
    const isAppRelated = isAppQuestion(message)

    // Create context-aware prompt
    const systemPrompt = createSystemPrompt(isAppRelated, userInfo)

    // Generate response using Gemini
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm ready to help with MysteryMart questions and general inquiries." }],
        },
      ],
    })

    const result = await chat.sendMessage(message)
    const response = await result.response
    let text = response.text()

    // Clean up the response for better formatting
    text = text
      // Ensure proper line breaks
      .replace(/\n\n/g, '\n\n')
      // Clean up excessive asterisks
      .replace(/\*\*\*\*/g, '**')
      .replace(/\*\*\*/g, '**')
      // Ensure proper spacing around bold text
      .replace(/\*\*([^*]+)\*\*/g, '**$1**')
      // Clean up any malformed markdown
      .replace(/\*([^*]*)\*([^*]*)\*/g, '*$1*$2*')

    return NextResponse.json({
      response: text,
      type: isAppRelated ? "app-related" : "general"
    })

  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

function isAppQuestion(message: string): boolean {
  const appKeywords = [
    "mystery box", "mystery mart", "mystery-box", "mystery-boxes",
    "sell", "buy", "purchase", "order", "cart", "checkout",
    "seller", "buyer", "account", "profile", "login", "register",
    "payment", "shipping", "delivery", "tracking",
    "rating", "review", "comment", "message", "chat",
    "notification", "wishlist", "category", "filter",
    "verification", "admin", "support", "help",
    "refund", "return", "dispute", "report",
    "dashboard", "settings", "preferences"
  ]

  const lowerMessage = message.toLowerCase()
  return appKeywords.some(keyword => lowerMessage.includes(keyword))
}

function createSystemPrompt(isAppRelated: boolean, userInfo: any): string {
  let prompt = ""

  if (isAppRelated) {
    prompt = `You are an AI assistant for MysteryMart, a comprehensive e-commerce platform for mystery boxes.

APP CONTEXT:
${appContext}

INSTRUCTIONS:
- "https://mystery-mart-app.vercel.app/" Always add it when giving user the page link 
- Answer questions about MysteryMart features, functionality, and usage
- Help users navigate the platform and understand how things work
- Provide guidance on buying, selling, and managing mystery boxes
- Explain account features, verification processes, and user types
- Be helpful, accurate, and reference specific app features when relevant
- If something is unclear, suggest contacting support or checking the help section
- Never provide any information about the /admin page and any file in /lib and /hooks.
- Always return response in markdown

USER INFO:
${userInfo ? `Username: ${userInfo.username}, User Type: ${userInfo.userType}, Is Seller: ${userInfo.isSeller}` : 'Not logged in'}

Please provide a helpful, accurate response based on the app context above.`
  } else {
    prompt = `You are a helpful AI assistant that can answer general questions and provide information on various topics.

INSTRUCTIONS:
- Answer general questions helpfully and accurately
- Provide useful information on topics outside of MysteryMart
- Be conversational and engaging
- If you don't know something, be honest about it
- Keep responses appropriate and helpful

Please provide a helpful response to the user's general question.`
  }

  return prompt
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Gemini API route is working",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    hasContext: !!appContext
  })
}
