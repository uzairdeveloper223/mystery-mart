"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Shield, Home, ArrowLeft, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/providers/auth-provider"

export default function ForbiddenPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <Card className="border-dashed border-2 border-yellow-500/20">
          <CardContent className="p-8">
            {/* Shield Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="mb-6 flex justify-center"
            >
              <div className="bg-yellow-500/10 rounded-2xl p-6">
                <Shield className="h-16 w-16 text-yellow-500" />
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-6xl font-bold text-yellow-500 mb-4">403</h1>
              <h2 className="text-2xl font-semibold mb-2">Access Forbidden</h2>
              <p className="text-muted-foreground mb-8">
                {user 
                  ? "You don't have permission to access this mystery box. This area might be restricted to specific user roles or require special authorization."
                  : "This mystery box is locked! You need to sign in to access this exclusive content and discover what's inside."
                }
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {!user ? (
                <Button asChild className="w-full mystery-gradient text-white">
                  <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In to Continue
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full mystery-gradient text-white">
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="javascript:history.back()">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Help Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-6 border-t border-dashed border-muted-foreground/20"
            >
              <p className="text-sm text-muted-foreground">
                {user 
                  ? "If you believe this is an error, please contact our support team for assistance."
                  : "New to Mystery Mart? Sign up to start exploring our collection of mystery boxes!"
                }
              </p>
              {!user && (
                <Link 
                  href="/auth/register" 
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Create a new account →
                </Link>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
