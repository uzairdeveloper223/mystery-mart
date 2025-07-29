"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FirebaseService } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { Mail, Phone, FileText, Key, Shield, AlertTriangle, CheckCircle, Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AccountRecoveryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"method" | "verify" | "success">("method")
  const [selectedMethod, setSelectedMethod] = useState<"email" | "sms" | "documents" | "emergency">("email")

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    verificationCode: "",
    emergencyCode: "",
    backupEmail: "",
    fullName: "",
    reason: "",
    additionalInfo: "",
  })

  const [documents, setDocuments] = useState<string[]>([])

  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      switch (selectedMethod) {
        case "email":
          if (!formData.email) {
            throw new Error("Please enter your email address")
          }
          await FirebaseService.sendAccountRecoveryEmail(formData.email)
          toast({
            title: "Recovery Email Sent",
            description: "Check your email for the recovery code",
          })
          break

        case "sms":
          if (!formData.phone) {
            throw new Error("Please enter your phone number")
          }
          await FirebaseService.sendAccountRecoverySMS(formData.phone)
          toast({
            title: "Recovery SMS Sent",
            description: "Check your phone for the recovery code",
          })
          break

        case "documents":
          await FirebaseService.createAccountRecoveryRequest({
            type: "document_verification",
            fullName: formData.fullName,
            reason: formData.reason,
            additionalInfo: formData.additionalInfo,
            documents,
            status: "pending",
            createdAt: new Date().toISOString(),
          })
          toast({
            title: "Recovery Request Submitted",
            description: "Your request has been submitted for manual review",
          })
          setStep("success")
          return

        case "emergency":
          // Emergency codes are verified immediately
          break
      }

      if (selectedMethod !== "documents") {
        setStep("verify")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send recovery request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let isValid = false

      switch (selectedMethod) {
        case "email":
          isValid = await FirebaseService.verifyRecoveryCode(formData.email, formData.verificationCode, "email")
          break

        case "sms":
          isValid = await FirebaseService.verifyRecoveryCode(formData.phone, formData.verificationCode, "sms")
          break

        case "emergency":
          isValid = await FirebaseService.verifyEmergencyCode(formData.emergencyCode, formData.backupEmail)
          break
      }

      if (isValid) {
        setStep("success")
        toast({
          title: "Verification Successful",
          description: "You can now reset your password",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: "Invalid or expired code. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Verification failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || documents.length >= 3) return

    setLoading(true)
    try {
      for (let i = 0; i < Math.min(files.length, 3 - documents.length); i++) {
        const file = files[i]

        // Upload to ImgBB or similar service
        const formData = new FormData()
        formData.append("image", file)
        formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY || "")

        const response = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setDocuments((prev) => [...prev, data.data.url])
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && step === "method") {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Account Recovery</h1>
          <p className="text-muted-foreground">
            Recover access to your Mystery Mart account using one of the secure methods below
          </p>
        </div>

        {step === "method" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Choose Recovery Method</span>
              </CardTitle>
              <CardDescription>Select how you'd like to recover your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedMethod} onValueChange={(value: any) => setSelectedMethod(value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Email Recovery</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    We'll send a recovery code to your registered email address
                  </p>
                  <form onSubmit={handleMethodSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full mystery-gradient text-white">
                      {loading ? "Sending..." : "Send Recovery Code"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Phone className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">SMS Recovery</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    We'll send a recovery code to your registered phone number
                  </p>
                  <form onSubmit={handleMethodSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full mystery-gradient text-white">
                      {loading ? "Sending..." : "Send Recovery Code"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Document Verification</h3>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This method requires manual review and may take 24-48 hours to process.
                    </AlertDescription>
                  </Alert>
                  <form onSubmit={handleMethodSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full legal name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Recovery</Label>
                      <Textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                        placeholder="Explain why you need to recover your account"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                        placeholder="Any additional information that might help verify your identity"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Identity Documents (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">Upload up to 3 documents (ID, passport, etc.)</p>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          id="documents"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("documents")?.click()}
                          disabled={documents.length >= 3}
                        >
                          Choose Files
                        </Button>
                      </div>
                      {documents.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Uploaded Documents:</p>
                          {documents.map((doc, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Document {index + 1} uploaded</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button type="submit" disabled={loading} className="w-full mystery-gradient text-white">
                      {loading ? "Submitting..." : "Submit Recovery Request"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="emergency" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Key className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold">Emergency Recovery</h3>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Emergency codes are one-time use only. Use this method only if other options are unavailable.
                    </AlertDescription>
                  </Alert>
                  <form onSubmit={handleVerification} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyCode">Emergency Recovery Code</Label>
                      <Input
                        id="emergencyCode"
                        value={formData.emergencyCode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emergencyCode: e.target.value }))}
                        placeholder="Enter your emergency recovery code"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupEmail">Backup Email (Optional)</Label>
                      <Input
                        id="backupEmail"
                        type="email"
                        value={formData.backupEmail}
                        onChange={(e) => setFormData((prev) => ({ ...prev, backupEmail: e.target.value }))}
                        placeholder="Enter backup email for additional verification"
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full mystery-gradient text-white">
                      {loading ? "Verifying..." : "Verify Emergency Code"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {step === "verify" && selectedMethod !== "emergency" && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We've sent a verification code to your {selectedMethod === "email" ? "email" : "phone"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={formData.verificationCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="Enter the 6-digit code"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1 mystery-gradient text-white">
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep("method")} className="flex-1">
                    Back
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => handleMethodSubmit(new Event("submit") as any)}
                    disabled={loading}
                  >
                    Resend Code
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Recovery Successful</span>
              </CardTitle>
              <CardDescription>
                {selectedMethod === "documents"
                  ? "Your recovery request has been submitted and will be reviewed within 24-48 hours."
                  : "Your identity has been verified. You can now reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMethod !== "documents" && (
                <Button className="w-full mystery-gradient text-white">Reset Password</Button>
              )}

              <div className="text-center">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary">
            Remember your password? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
