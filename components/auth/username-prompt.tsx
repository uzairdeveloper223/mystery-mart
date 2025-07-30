"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { User, CheckCircle } from "lucide-react"

export function UsernamePrompt() {
  const { user, updateUsername, hasTemporaryUsername } = useAuth()
  const { toast } = useToast()
  const [newUsername, setNewUsername] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPrompt, setShowPrompt] = useState(true)

  // Don't show if user doesn't have temporary username or user dismissed it
  if (!user || !hasTemporaryUsername() || !showPrompt) {
    return null
  }

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      })
      return
    }

    // Basic username validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
      toast({
        title: "Invalid Username",
        description: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const success = await updateUsername(newUsername)
      if (success) {
        toast({
          title: "Username Updated",
          description: "Your username has been successfully updated!",
        })
        setShowPrompt(false)
      } else {
        toast({
          title: "Update Failed",
          description: "Username is already taken or update failed. Please try a different username.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <User className="h-5 w-5" />
            Choose Your Username
          </CardTitle>
          <CardDescription className="text-blue-700">
            You're currently using a temporary username: <code className="bg-blue-100 px-1 rounded">{user.username}</code>
            <br />
            Choose a permanent username for your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-username">New Username</Label>
            <Input
              id="new-username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your preferred username"
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUsernameUpdate}
              disabled={isUpdating || !newUsername.trim()}
              className="flex-1"
            >
              {isUpdating ? (
                "Updating..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Update Username
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPrompt(false)}
              disabled={isUpdating}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
