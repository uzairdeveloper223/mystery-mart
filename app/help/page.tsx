"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"
import { FirebaseService } from "@/lib/firebase-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Search,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  HelpCircle,
  Book,
  Shield,
  Users,
  Package,
  CreditCard,
  Truck,
  Star,
  Flag,
} from "lucide-react"

const faqData = [
  {
    category: "Getting Started",
    icon: <Book className="h-5 w-5" />,
    questions: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Sign Up' in the top right corner, fill in your details, and verify your email address. You'll be able to start browsing and purchasing mystery boxes immediately.",
      },
      {
        question: "How do I become a seller?",
        answer:
          "After creating an account, you need to apply for seller approval. Go to your dashboard and click 'Apply to Sell'. Our team will review your application within 24-48 hours.",
      },
      {
        question: "What are mystery boxes?",
        answer:
          "Mystery boxes are curated packages containing surprise items. Each box has an estimated value range, but the exact contents remain a mystery until you receive and open it.",
      },
    ],
  },
  {
    category: "Buying & Orders",
    icon: <Package className="h-5 w-5" />,
    questions: [
      {
        question: "How do I purchase a mystery box?",
        answer:
          "Browse our catalog, select a box you like, add it to your cart, and proceed to checkout. You'll need to provide shipping information and payment details.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept major credit cards, PayPal, and select cryptocurrencies. All payments are processed securely through our encrypted payment system.",
      },
      {
        question: "Can I return a mystery box?",
        answer:
          "Due to the nature of mystery boxes, returns are generally not accepted unless the item is damaged or significantly different from the description. Check individual seller policies for specific terms.",
      },
      {
        question: "How long does shipping take?",
        answer:
          "Shipping times vary by seller and location. Most domestic orders arrive within 3-7 business days. International shipping may take 1-3 weeks.",
      },
    ],
  },
  {
    category: "Selling",
    icon: <Star className="h-5 w-5" />,
    questions: [
      {
        question: "How do I get approved as a seller?",
        answer:
          "Submit a seller application with your business information. Our team reviews applications based on quality standards, business legitimacy, and platform fit.",
      },
      {
        question: "What are the seller fees?",
        answer:
          "Mystery Mart operates on a donation-based model. There are no mandatory fees, but buyers can choose to support the platform and sellers through voluntary donations.",
      },
      {
        question: "How do I create a mystery box listing?",
        answer:
          "Once approved as a seller, go to your dashboard and click 'Create Box'. Provide detailed descriptions, images, estimated value, and shipping information.",
      },
      {
        question: "How do I get verified?",
        answer:
          "Verified sellers have a blue checkmark indicating authenticity. Apply for verification through your dashboard by messaging our admin team with your request and seller history.",
      },
    ],
  },
  {
    category: "Account & Security",
    icon: <Shield className="h-5 w-5" />,
    questions: [
      {
        question: "How do I reset my password?",
        answer:
          "Click 'Forgot Password' on the login page, enter your email, and follow the reset instructions sent to your inbox.",
      },
      {
        question: "How do I recover my account?",
        answer:
          "If you can't access your account, use our secure account recovery system. Provide identity verification documents for manual review by our security team.",
      },
      {
        question: "Is my personal information safe?",
        answer:
          "Yes, we use industry-standard encryption and security measures. Your personal data is never shared with third parties without your consent.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Contact our support team to request account deletion. Note that this action is permanent and cannot be undone.",
      },
    ],
  },
  {
    category: "Payments & Donations",
    icon: <CreditCard className="h-5 w-5" />,
    questions: [
      {
        question: "Are there any taxes or fees?",
        answer:
          "There are no taxes or mandatory fees on Mystery Mart. The platform operates on voluntary donations from users who want to support sellers and the platform.",
      },
      {
        question: "How do donations work?",
        answer:
          "Users can donate to sellers they appreciate or to support the platform. Donations are completely voluntary and 100% go to the intended recipient.",
      },
      {
        question: "How do I donate to a seller?",
        answer:
          "Visit a seller's profile and click the 'Donate' button. Choose your amount and complete the donation through our secure payment system.",
      },
    ],
  },
  {
    category: "Safety & Trust",
    icon: <Flag className="h-5 w-5" />,
    questions: [
      {
        question: "How do I report a problem?",
        answer:
          "Use the 'Report' button on user profiles or mystery box listings. Provide detailed information about the issue for our moderation team to review.",
      },
      {
        question: "What if I receive a damaged item?",
        answer:
          "Contact the seller first through our messaging system. If unresolved, report the issue to our support team with photos and order details.",
      },
      {
        question: "How do you ensure seller quality?",
        answer:
          "All sellers must be approved before listing items. We monitor seller performance, customer feedback, and maintain quality standards through our review system.",
      },
    ],
  },
]

export default function HelpPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    priority: "medium",
    message: "",
  })

  const filteredFAQs = faqData.filter((category) => {
    if (selectedCategory !== "all" && category.category !== selectedCategory) return false

    if (searchQuery) {
      return category.questions.some(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return true
  })

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send a message to admin",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    setIsSubmitting(true)
    try {
      await FirebaseService.createAdminMessage({
        userId: user.uid,
        subject: contactForm.subject.trim(),
        content: `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message.trim()}`,
        priority: contactForm.priority as "low" | "medium" | "high" | "urgent",
        status: "open",
        type: "support_request",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
      })

      toast({
        title: "Message Sent Successfully",
        description: "Your message has been sent to the admin. We'll get back to you within 24 hours.",
      })

      setContactForm({
        name: "",
        email: "",
        subject: "",
        priority: "medium",
        message: "",
      })
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
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help & Support</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to common questions or get in touch with our support team
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Quick Support Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-muted-foreground mb-4">Get instant help from our support team</p>
              <Button 
                className="mystery-gradient text-white" 
                onClick={() => router.push("/contact-admin")}
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-muted-foreground mb-4">Send us a detailed message</p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/contact-admin")}
              >
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Phone className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
              <p className="text-muted-foreground mb-4">Call us for urgent issues</p>
              <Button variant="outline">+92 316 0973694</Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Hours */}
        <Alert className="mb-8">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Support Hours:</strong> Monday - Friday: 9 AM - 6 PM EST | Saturday - Sunday: 10 AM - 4 PM EST
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Categories
                </Button>
                {faqData.map((category) => (
                  <Button
                    key={category.category}
                    variant={selectedCategory === category.category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.category)}
                    className="flex items-center space-x-2"
                  >
                    {category.icon}
                    <span>{category.category}</span>
                  </Button>
                ))}
              </div>

              {/* FAQ Content */}
              {filteredFAQs.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {category.icon}
                      <span>{category.category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {category.questions
                        .filter(
                          (q) =>
                            !searchQuery ||
                            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                        .map((faq, index) => (
                          <AccordionItem key={index} value={`${category.category}-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}

              {filteredFAQs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or browse all categories</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={contactForm.priority}
                        onValueChange={(value) => setContactForm((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Low - General inquiry</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span>Medium - Account issue</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>High - Urgent problem</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Please provide as much detail as possible..."
                        rows={5}
                        required
                      />
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
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Other ways to reach us</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">uzairxdev223@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">+92 316 0973694</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">Available during business hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Live Chat</span>
                      <Badge variant="secondary">Instant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Priority</span>
                      <Badge variant="destructive">2-4 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Priority</span>
                      <Badge variant="secondary">12-24 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Priority</span>
                      <Badge variant="outline">24-48 hours</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Book className="h-8 w-8 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">User Guide</h3>
                  <p className="text-muted-foreground mb-4">Complete guide to using Mystery Mart</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Safety Guidelines</h3>
                  <p className="text-muted-foreground mb-4">Stay safe while buying and selling</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    View Guidelines
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-purple-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Community Forum</h3>
                  <p className="text-muted-foreground mb-4">Connect with other users</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Package className="h-8 w-8 text-orange-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Seller Resources</h3>
                  <p className="text-muted-foreground mb-4">Tools and tips for sellers</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Explore Resources
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Truck className="h-8 w-8 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Shipping Info</h3>
                  <p className="text-muted-foreground mb-4">Shipping policies and tracking</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Learn More
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <CheckCircle className="h-8 w-8 text-teal-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Platform Updates</h3>
                  <p className="text-muted-foreground mb-4">Latest features and changes</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    View Updates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
