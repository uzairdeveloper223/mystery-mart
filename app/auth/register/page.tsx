"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Eye, EyeOff, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const { register, checkUsernameAvailability } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Username validation
  const isValidUsername = (username: string) => {
    const regex = /^[a-z0-9_.]{3,16}$/
    return regex.test(username)
  }

  // Password validation
  const isValidPassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    return regex.test(password)
  }

  // Check username availability with debounce
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username && isValidUsername(formData.username)) {
        setCheckingUsername(true)
        try {
          const available = await checkUsernameAvailability(formData.username)
          setUsernameAvailable(available)
        } catch (error) {
          setUsernameAvailable(null)
        } finally {
          setCheckingUsername(false)
        }
      } else {
        setUsernameAvailable(null)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.username, checkUsernameAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!isValidUsername(formData.username)) {
      setError("Username must be 3-16 characters and contain only lowercase letters, numbers, underscores, and periods")
      setLoading(false)
      return
    }

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

    if (!usernameAvailable) {
      setError("Username is not available")
      setLoading(false)
      return
    }

    try {
      await register(formData.email, formData.password, formData.username, formData.fullName)
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })
      router.push("/auth/verify-email")
    } catch (error: any) {
      setError(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value.toLowerCase())}
                  placeholder="Choose a username"
                  className={cn(
                    formData.username && !isValidUsername(formData.username) && "border-red-500",
                    formData.username &&
                      isValidUsername(formData.username) &&
                      usernameAvailable === true &&
                      "border-green-500",
                    formData.username &&
                      isValidUsername(formData.username) &&
                      usernameAvailable === false &&
                      "border-red-500",
                  )}
                  required
                />
                {formData.username && isValidUsername(formData.username) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {checkingUsername ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary" />
                    ) : usernameAvailable === true ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                3-16 characters, lowercase letters, numbers, underscores, and periods only
              </p>
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
              disabled={loading || !usernameAvailable || !isValidPassword(formData.password)}
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
