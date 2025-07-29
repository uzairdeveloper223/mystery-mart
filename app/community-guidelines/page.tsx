"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  Users, 
  Shield, 
  Heart, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  XCircle,
  Flag,
  MessageCircle,
  Star,
  Gavel,
  Eye,
  Lock
} from "lucide-react"
import Link from "next/link"

export default function CommunityGuidelinesPage() {
  const guidelines = [
    {
      icon: Heart,
      title: "Be Respectful",
      description: "Treat all community members with kindness and respect",
      rules: [
        "Use polite and professional language",
        "Respect different opinions and perspectives",
        "No harassment, bullying, or personal attacks",
        "Be constructive in your criticism"
      ]
    },
    {
      icon: Shield,
      title: "Stay Safe",
      description: "Protect yourself and others in the community",
      rules: [
        "Don't share personal information publicly",
        "Report suspicious activities immediately",
        "Use secure payment methods only",
        "Be cautious with external links and offers"
      ]
    },
    {
      icon: CheckCircle,
      title: "Be Honest",
      description: "Maintain integrity in all your interactions",
      rules: [
        "Provide accurate descriptions of mystery boxes",
        "Use real photos of your products",
        "Be transparent about item conditions",
        "Honor your commitments and agreements"
      ]
    },
    {
      icon: Star,
      title: "Quality Content",
      description: "Contribute meaningfully to the community",
      rules: [
        "Post relevant and helpful content",
        "Use appropriate tags and categories",
        "Avoid spam and excessive self-promotion",
        "Share genuine reviews and experiences"
      ]
    }
  ]

  const prohibitedContent = [
    {
      category: "Illegal Activities",
      items: [
        "Selling stolen or counterfeit goods",
        "Fraud or money laundering",
        "Drug-related items",
        "Weapons or dangerous materials"
      ],
      icon: Ban,
      severity: "severe"
    },
    {
      category: "Harmful Content",
      items: [
        "Adult or explicit content",
        "Violence or gore",
        "Hate speech or discrimination",
        "Self-harm or dangerous activities"
      ],
      icon: AlertTriangle,
      severity: "high"
    },
    {
      category: "Misleading Practices",
      items: [
        "False advertising",
        "Fake reviews or ratings",
        "Misrepresenting item values",
        "Bait and switch tactics"
      ],
      icon: Eye,
      severity: "medium"
    },
    {
      category: "Spam & Abuse",
      items: [
        "Excessive promotional content",
        "Repetitive or irrelevant posts",
        "Manipulating search results",
        "Creating multiple fake accounts"
      ],
      icon: Flag,
      severity: "low"
    }
  ]

  const consequences = [
    {
      level: "Warning",
      description: "First-time minor violations",
      actions: ["Account warning", "Content removal", "Educational notice"],
      color: "yellow"
    },
    {
      level: "Temporary Restriction",
      description: "Repeated or moderate violations",
      actions: ["1-7 day suspension", "Feature restrictions", "Seller privileges removed"],
      color: "orange"
    },
    {
      level: "Account Suspension",
      description: "Serious or repeated violations",
      actions: ["30-90 day suspension", "Loss of ratings/reviews", "Payment holds"],
      color: "red"
    },
    {
      level: "Permanent Ban",
      description: "Severe violations or repeated offenses",
      actions: ["Account permanently banned", "IP address blocked", "Legal action if applicable"],
      color: "red"
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
            <Users className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Guidelines</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Building a safe, respectful, and trustworthy community for all mystery box enthusiasts
          </p>
          <div className="mt-6">
            <Badge variant="outline">Last updated: {new Date().toLocaleDateString()}</Badge>
          </div>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-primary" />
                <span>Welcome to Our Community</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">
                Mystery Mart is more than just a marketplace – we're a community of collectors, treasure hunters, 
                and mystery box enthusiasts from around the world. These guidelines help ensure everyone can 
                enjoy a safe, positive, and exciting experience.
              </p>
              <p>
                By using Mystery Mart, you agree to follow these community guidelines. Violations may result 
                in warnings, account restrictions, or permanent bans depending on the severity.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Core Community Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {guidelines.map((guideline, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <guideline.icon className="h-5 w-5 text-primary" />
                    <span>{guideline.title}</span>
                  </CardTitle>
                  <CardDescription>{guideline.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guideline.rules.map((rule, ruleIndex) => (
                      <li key={ruleIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Prohibited Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Prohibited Content & Behavior</h2>
          <div className="space-y-6">
            {prohibitedContent.map((category, index) => (
              <Card key={index} className={`border-l-4 ${
                category.severity === 'severe' ? 'border-l-red-500' :
                category.severity === 'high' ? 'border-l-orange-500' :
                category.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <category.icon className="h-5 w-5" />
                      <span>{category.category}</span>
                    </CardTitle>
                    <Badge variant={
                      category.severity === 'severe' ? 'destructive' :
                      category.severity === 'high' ? 'destructive' :
                      category.severity === 'medium' ? 'secondary' :
                      'outline'
                    }>
                      {category.severity} violation
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Seller-Specific Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Seller Guidelines</span>
              </CardTitle>
              <CardDescription>Additional guidelines for sellers on Mystery Mart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">✅ Do This</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Provide accurate mystery box descriptions</li>
                    <li>• Use high-quality, authentic photos</li>
                    <li>• Ship items promptly and securely</li>
                    <li>• Respond to buyer messages quickly</li>
                    <li>• Honor estimated delivery times</li>
                    <li>• Maintain accurate inventory levels</li>
                    <li>• Follow all applicable laws and regulations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-red-700 dark:text-red-300">❌ Don't Do This</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Mislead buyers about box contents</li>
                    <li>• Use fake or stolen product images</li>
                    <li>• Inflate estimated values significantly</li>
                    <li>• Ask for payment outside the platform</li>
                    <li>• Create fake reviews or ratings</li>
                    <li>• Refuse legitimate refund requests</li>
                    <li>• Sell expired or damaged goods</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Consequences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Enforcement & Consequences</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {consequences.map((consequence, index) => (
              <Card key={index} className={`border-t-4 ${
                consequence.color === 'yellow' ? 'border-t-yellow-500' :
                consequence.color === 'orange' ? 'border-t-orange-500' :
                'border-t-red-500'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{consequence.level}</CardTitle>
                  <CardDescription className="text-sm">{consequence.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {consequence.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-sm text-muted-foreground">
                        • {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Reporting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5" />
                <span>Reporting Violations</span>
              </CardTitle>
              <CardDescription>Help us keep the community safe by reporting violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">How to Report</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Use the "Report" button on any listing or message</li>
                    <li>• Contact our support team directly</li>
                    <li>• Include screenshots or evidence when possible</li>
                    <li>• Provide detailed descriptions of the violation</li>
                    <li>• Include relevant order or user information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">What Happens Next</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Reports are reviewed within 24 hours</li>
                    <li>• We investigate all reports thoroughly</li>
                    <li>• Actions are taken based on violation severity</li>
                    <li>• You'll be notified of the outcome</li>
                    <li>• Repeat offenders face stricter consequences</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appeal Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gavel className="h-5 w-5" />
                <span>Appeals Process</span>
              </CardTitle>
              <CardDescription>
                If you believe an action was taken in error, you can appeal our decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  We understand that mistakes can happen. If you believe your account was restricted 
                  or content was removed in error, you have the right to appeal our decision.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Submit Appeal</h4>
                    <p className="text-sm text-muted-foreground">
                      Contact support within 30 days with your appeal and supporting evidence.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Review Process</h4>
                    <p className="text-sm text-muted-foreground">
                      Our team will review your appeal and any new evidence within 5-7 business days.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Final Decision</h4>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a final decision. If upheld, the original action stands.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact & Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Questions About Our Guidelines?</CardTitle>
              <CardDescription>
                Our community team is here to help clarify any questions about these guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have questions about these guidelines or need to report a violation, 
                please don't hesitate to contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/help">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Contact Support</span>
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button className="mystery-gradient text-white flex items-center space-x-2">
                    <Flag className="h-4 w-4" />
                    <span>Report Violation</span>
                  </Button>
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Email: uzairxdev223@gmail.com</p>
                <p>Response time: Within 24 hours</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
