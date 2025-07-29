"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Cookie, Shield, Settings, Info, AlertCircle } from "lucide-react"

export default function CookiePolicyPage() {
  const cookieTypes = [
    {
      name: "Essential Cookies",
      purpose: "Required for basic website functionality",
      duration: "Session/1 year",
      canDisable: false,
      description: "These cookies are necessary for the website to function and cannot be switched off in our systems.",
      examples: ["Authentication tokens", "Shopping cart data", "Security tokens"]
    },
    {
      name: "Analytics Cookies",
      purpose: "Help us understand how visitors use our website",
      duration: "2 years",
      canDisable: true,
      description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.",
      examples: ["Google Analytics", "Page views", "User behavior tracking"]
    },
    {
      name: "Functional Cookies",
      purpose: "Enable enhanced functionality and personalization",
      duration: "1 year",
      canDisable: true,
      description: "These cookies enable the website to provide enhanced functionality and personalization.",
      examples: ["Language preferences", "Theme settings", "Remembered login"]
    },
    {
      name: "Marketing Cookies",
      purpose: "Used to track visitors across websites for advertising",
      duration: "30 days - 2 years",
      canDisable: true,
      description: "These cookies may be set through our site by our advertising partners to build a profile of your interests.",
      examples: ["Ad targeting", "Social media pixels", "Conversion tracking"]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <Cookie className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn about how Mystery Mart uses cookies and similar technologies to improve your experience
          </p>
          <div className="mt-6">
            <Badge variant="outline">Last updated: {new Date().toLocaleDateString()}</Badge>
          </div>
        </motion.div>

        {/* Quick Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Quick Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                We use cookies to ensure you get the best experience on Mystery Mart. Some cookies are essential 
                for the site to work, while others help us improve your experience, provide personalized content, 
                and measure performance. You can control non-essential cookies through your browser settings.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* What are Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>What are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
              <p>
                Cookies allow websites to remember your actions and preferences (such as login, language, font size, 
                and other display preferences) over a period of time, so you don't have to keep re-entering them 
                whenever you come back to the site or browse from one page to another.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Types of Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {cookieTypes.map((cookie, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>{cookie.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={cookie.canDisable ? "secondary" : "destructive"}>
                        {cookie.canDisable ? "Optional" : "Required"}
                      </Badge>
                      <Badge variant="outline">{cookie.duration}</Badge>
                    </div>
                  </div>
                  <CardDescription>{cookie.purpose}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{cookie.description}</p>
                  <div>
                    <h4 className="font-semibold mb-2">Examples:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {cookie.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Third-Party Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                In addition to our own cookies, we may also use various third-party cookies to report usage 
                statistics of the service and deliver advertisements on and through the service.
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Google Analytics</h4>
                  <p className="text-muted-foreground">
                    We use Google Analytics to analyze how visitors use our website. This helps us improve 
                    our service and user experience.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Social Media Platforms</h4>
                  <p className="text-muted-foreground">
                    We may use cookies from social media platforms (Facebook, Twitter, Instagram) to enable 
                    social sharing and embedded content.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Payment Processors</h4>
                  <p className="text-muted-foreground">
                    Our payment partners may use cookies to secure transactions and prevent fraud.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Managing Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Managing Your Cookie Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie 
                rights by setting your preferences in your browser settings.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Browser Settings</h4>
                  <p className="text-muted-foreground">
                    Most web browsers allow you to control cookies through their settings. You can:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>View what cookies you have and delete them individually</li>
                    <li>Block third-party cookies</li>
                    <li>Block cookies from particular sites</li>
                    <li>Block all cookies from being set</li>
                    <li>Delete all cookies when you close your browser</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">Opt-Out Links</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      <a 
                        href="https://tools.google.com/dlpage/gaoptout" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Analytics Opt-out Browser Add-on
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://www.facebook.com/settings/?tab=ads" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Facebook Ad Preferences
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mb-12"
        >
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Important Notice</h4>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Please note that disabling cookies may affect the functionality of Mystery Mart. 
                    Some features may not work properly without certain cookies enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Questions About Cookies?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>Email: uzairxdev223@gmail.com</p>
                <p>Address: Mirpur, AJK</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
