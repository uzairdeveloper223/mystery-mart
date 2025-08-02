"use client"

import { motion } from "framer-motion"
import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <Card className="border-dashed border-2 border-destructive/20">
          <CardContent className="p-8">
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="mb-6 flex justify-center"
            >
              <div className="bg-destructive/10 rounded-2xl p-6">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-6xl font-bold text-destructive mb-4">500</h1>
              <h2 className="text-2xl font-semibold mb-2">Something Went Wrong</h2>
              <p className="text-muted-foreground mb-6">
                Our mystery boxes are experiencing some technical difficulties. 
                Don't worry, our team is working to fix this issue.
              </p>
            </motion.div>

            {/* Error Details */}
            {process.env.NODE_ENV === "development" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-left">
                    <strong>Error:</strong> {error.message}
                    {error.digest && (
                      <div className="mt-1">
                        <strong>Error ID:</strong> {error.digest}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button 
                onClick={reset} 
                className="w-full mystery-gradient text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/contact-admin">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Report Issue
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Support Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-6 border-t border-dashed border-muted-foreground/20"
            >
              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact our support team. 
                We're here to help solve any mysteries!
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
