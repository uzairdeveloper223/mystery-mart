"use client"

import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface LoadingSpinnerProps {
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "default" | "dots" | "pulse" | "bars" | "mystery" | "orbit" | "wave" | "gradient"
  text?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  variant = "default",
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-md flex flex-col justify-center items-center z-50"
    : "flex flex-col justify-center items-center p-8"

  useEffect(() => {
    // Add custom CSS animations
    if (typeof document !== 'undefined') {
      const existingStyle = document.getElementById('loading-spinner-styles')
      if (!existingStyle) {
        const style = document.createElement('style')
        style.id = 'loading-spinner-styles'
        style.textContent = `
          @keyframes reverse-spin {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
            50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4); }
          }
          
          @keyframes wave {
            0%, 40%, 100% { transform: scaleY(0.4); }
            20% { transform: scaleY(1.0); }
          }
          
          @keyframes orbit {
            0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
          }
          
          .animate-reverse-spin { animation: reverse-spin 2s linear infinite; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-glow { animation: glow 2s ease-in-out infinite; }
          .animate-wave { animation: wave 1.4s ease-in-out infinite; }
          .animate-orbit { animation: orbit 2s linear infinite; }
        `
        document.head.appendChild(style)
      }
    }
  }, [])

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce",
                  size === "xs" ? "h-2 w-2" :
                  size === "sm" ? "h-3 w-3" :
                  size === "md" ? "h-4 w-4" :
                  size === "lg" ? "h-6 w-6" : "h-8 w-8"
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1.4s"
                }}
              />
            ))}
          </div>
        )

      case "pulse":
        return (
          <div className={cn(
            "rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping",
            sizeClasses[size]
          )} />
        )

      case "bars":
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm animate-wave",
                  size === "xs" ? "h-4 w-1" :
                  size === "sm" ? "h-6 w-1.5" :
                  size === "md" ? "h-8 w-2" :
                  size === "lg" ? "h-12 w-3" : "h-16 w-4"
                )}
                style={{
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )

      case "mystery":
        return (
          <div className="relative animate-float">
            {/* Outer ring with glow */}
            <div className={cn(
              "animate-spin rounded-full border-4 border-transparent animate-glow",
              sizeClasses[size]
            )} 
            style={{
              background: "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6)",
              padding: "2px"
            }}>
              <div className="w-full h-full rounded-full bg-background" />
            </div>
            
            {/* Inner ring */}
            <div className={cn(
              "absolute inset-3 animate-reverse-spin rounded-full border-2 border-transparent"
            )} 
            style={{
              background: "conic-gradient(from 180deg, #ec4899, #8b5cf6, #6366f1, #ec4899)",
              padding: "1px"
            }}>
              <div className="w-full h-full rounded-full bg-background" />
            </div>
            
            {/* Center orb */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse",
                size === "xs" ? "h-1 w-1" :
                size === "sm" ? "h-1.5 w-1.5" :
                size === "md" ? "h-2 w-2" :
                size === "lg" ? "h-3 w-3" : "h-4 w-4"
              )} />
            </div>
          </div>
        )

      case "orbit":
        return (
          <div className={cn("relative", sizeClasses[size])}>
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-300 dark:border-purple-700" />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 animate-orbit"
                style={{
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: "2s"
                }}
              >
                <div className={cn(
                  "rounded-full bg-gradient-to-r from-blue-500 to-purple-500",
                  size === "xs" ? "h-1.5 w-1.5" :
                  size === "sm" ? "h-2 w-2" :
                  size === "md" ? "h-3 w-3" :
                  size === "lg" ? "h-4 w-4" : "h-6 w-6"
                )} />
              </div>
            ))}
          </div>
        )

      case "wave":
        return (
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4, 6, 7].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse",
                  size === "xs" ? "h-1 w-1" :
                  size === "sm" ? "h-1.5 w-1.5" :
                  size === "md" ? "h-2 w-2" :
                  size === "lg" ? "h-3 w-3" : "h-4 w-4"
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "1.4s"
                }}
              />
            ))}
          </div>
        )

      case "gradient":
        return (
          <div className={cn(
            "animate-spin rounded-full border-4 border-transparent",
            sizeClasses[size]
          )} 
          style={{
            background: "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444, #8b5cf6)",
            borderRadius: "50%",
            padding: "3px"
          }}>
            <div className="w-full h-full rounded-full bg-background" />
          </div>
        )

      default:
        return (
          <div className={cn(
            "animate-spin rounded-full border-3 border-muted border-t-primary shadow-lg",
            sizeClasses[size]
          )} />
        )
    }
  }

  return (
    <div className={cn(containerClasses, className)}>
      <div className="relative">
        {renderSpinner()}
        
        {/* Ambient glow effect for fullscreen */}
        {fullScreen && (
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
          </div>
        )}
      </div>
      
      {text && (
        <div className="mt-6 text-center">
          <p className={cn(
            "text-muted-foreground font-medium animate-pulse",
            size === "xs" || size === "sm" ? "text-sm" :
            size === "md" ? "text-base" :
            size === "lg" ? "text-lg" : "text-xl"
          )}>
            {text}
          </p>
          
          {fullScreen && (
            <div className="mt-2 flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1.4s"
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}