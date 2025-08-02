"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Eye, EyeOff, Check, X, ShoppingCart, Store, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    userType: "buyer" as "buyer" | "seller" | "both",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { register, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  // Password validation
  const isValidPassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    return regex.test(password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!isValidPassword(formData.password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and numbers")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      // Generate temporary username from email
      const baseUsername = formData.email.split("@")[0]
      const timestamp = Date.now().toString().slice(-6)
      const tempUsername = `${baseUsername}_${timestamp}`
      
      await register(formData.email, formData.password, tempUsername, formData.fullName, formData.userType)
      toast({
        title: "Welcome to Mystery Mart!",
        description: "Your account has been created and you're now logged in. Set your username in the dashboard.",
      })
      
      // Small delay to ensure auth state is updated before redirect
      setTimeout(() => {
        router.push("/dashboard")
      }, 100)
    } catch (error: any) {
      setError(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mystery-gradient rounded-lg p-3 w-12 h-12 mx-auto mb-4">
            <Package className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Join Mystery Mart</CardTitle>
          <CardDescription>Create your account to start buying and selling mystery boxes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Account Type</Label>
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={cn(
                    "border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50",
                    formData.userType === "buyer" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleInputChange("userType", "buyer")}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <ShoppingCart className="h-6 w-6" />
                    <span className="text-sm font-medium">Buyer</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50",
                    formData.userType === "seller" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleInputChange("userType", "seller")}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Store className="h-6 w-6" />
                    <span className="text-sm font-medium">Seller</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50",
                    formData.userType === "both" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleInputChange("userType", "both")}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">Both</span>
                  </div>
                </div>
              </div>
              {(formData.userType === "seller" || formData.userType === "both") && (
                <p className="text-xs text-muted-foreground">
                  Seller accounts require admin approval before you can start selling
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>



            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a password"
                  className={cn(
                    formData.password && !isValidPassword(formData.password) && "border-red-500",
                    formData.password && isValidPassword(formData.password) && "border-green-500",
                  )}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  className={cn(
                    formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-500",
                    formData.confirmPassword &&
                      formData.password === formData.confirmPassword &&
                      formData.password &&
                      "border-green-500",
                  )}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mystery-gradient text-white"
              disabled={
                loading ||
                !formData.email ||
                !formData.fullName ||
                !formData.password ||
                !formData.confirmPassword ||
                !isValidPassword(formData.password) ||
                formData.password !== formData.confirmPassword
              }
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
