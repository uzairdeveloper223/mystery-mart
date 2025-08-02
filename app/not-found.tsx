"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Package, Home, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-8">
            {/* Mystery Box Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="mb-6 flex justify-center"
            >
              <div className="mystery-gradient rounded-2xl p-6">
                <Package className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
              <h2 className="text-2xl font-semibold mb-2">Mystery Box Not Found</h2>
              <p className="text-muted-foreground mb-8">
                Oops! The mystery box you're looking for seems to have vanished into thin air. 
                It might have been sold out or moved to a different location.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button asChild className="w-full mystery-gradient text-white">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/boxes">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Boxes
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

            {/* Mystery Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-6 border-t border-dashed border-muted-foreground/20"
            >
              <p className="text-sm text-muted-foreground italic">
                "Every mystery has a solution, but some pages prefer to stay hidden."
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
