"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { FirebaseService } from "@/lib/firebase-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, Clock, AlertTriangle } from "lucide-react"

interface MaintenanceCheckProps {
  children: React.ReactNode
}

export function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const settings = await FirebaseService.getPlatformSettings()
        setMaintenanceMode(settings.maintenanceMode)
        setMaintenanceMessage(settings.maintenanceMessage)
      } catch (error) {
        console.error("Failed to check maintenance mode:", error)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenanceMode()
  }, [])

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  // If maintenance mode is enabled and user is not admin, show maintenance page
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Under Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">We'll be back soon</span>
            </div>

            <p className="text-muted-foreground">
              {maintenanceMessage ||
                "We're currently performing maintenance to improve your experience. Please check back soon!"}
            </p>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Expected downtime: 30-60 minutes</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Follow us for updates:</p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://twitter.com/mysterymart" target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:support@mysterymart.com">Contact Support</a>
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
