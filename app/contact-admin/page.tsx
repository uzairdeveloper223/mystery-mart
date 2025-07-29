"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FirebaseService } from "@/lib/firebase-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ContactAdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    subject: "",
    priority: "low",
    content: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await FirebaseService.createAdminMessage({
        userId: user.uid,
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        status: "open",
        type: "general_inquiry",
        responses: [],
      })

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the admin. You'll receive a response soon.",
      })

      // Reset form
      setFormData({
        subject: "",
        priority: "low", 
        content: "",
      })

      // Redirect to messages after a short delay
      setTimeout(() => {
        router.push("/messages")
      }, 2000)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Contact Admin</h1>
          <p className="text-muted-foreground">
            Send a message to the admin team. We'll get back to you as soon as possible.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              New Message
            </CardTitle>
            <CardDescription>
              Please provide details about your inquiry or issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your message"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="medium">Medium - Account issue</SelectItem>
                    <SelectItem value="high">High - Payment/Order issue</SelectItem>
                    <SelectItem value="urgent">Urgent - Security concern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  placeholder="Describe your issue or inquiry in detail..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Please provide as much detail as possible to help us assist you better.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full mystery-gradient text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            You can also check your message history in the{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/messages")}>
              Messages section
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
