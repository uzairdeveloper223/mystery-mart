"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  RefreshCw, 
  Clock, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  CreditCard,
  MessageCircle,
  FileText,
  Info
} from "lucide-react"
import Link from "next/link"

export default function RefundPolicyPage() {
  const refundTimeframes = [
    {
      condition: "Unopened Mystery Box",
      timeframe: "7 days",
      eligibility: "100% refund",
      description: "If you haven't opened your mystery box and are not satisfied"
    },
    {
      condition: "Damaged/Defective Items",
      timeframe: "30 days",
      eligibility: "Full refund or replacement",
      description: "Items that arrive damaged or are defective"
    },
    {
      condition: "Significantly Misrepresented",
      timeframe: "14 days",
      eligibility: "Partial or full refund",
      description: "When box contents don't match description significantly"
    },
    {
      condition: "Seller Cancellation",
      timeframe: "Immediate",
      eligibility: "Full refund",
      description: "If seller cancels order after payment"
    }
  ]

  const refundProcess = [
    {
      step: 1,
      title: "Submit Refund Request",
      description: "Contact our support team with your order details and reason for refund",
      icon: MessageCircle
    },
    {
      step: 2,
      title: "Review Process",
      description: "Our team reviews your request within 24-48 hours",
      icon: FileText
    },
    {
      step: 3,
      title: "Decision & Processing",
      description: "Once approved, refunds are processed to your original payment method",
      icon: CheckCircle
    },
    {
      step: 4,
      title: "Refund Completion",
      description: "Refunds typically appear in 3-5 business days",
      icon: CreditCard
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
            <RefreshCw className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your satisfaction is our priority. Learn about our hassle-free refund process and buyer protection program.
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
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <Shield className="h-5 w-5" />
                <span>Buyer Protection Guarantee</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300 text-lg">
                We offer a comprehensive buyer protection program. If you're not satisfied with your mystery box 
                purchase, we'll work with you to make it right through our refund or replacement policy.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refund Eligibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Refund Eligibility & Timeframes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {refundTimeframes.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.condition}</CardTitle>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.timeframe}</span>
                    </Badge>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      {item.eligibility}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* What's Refundable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <span>What's Refundable</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Unopened mystery boxes (within 7 days)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Damaged or defective items</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Significantly misrepresented contents</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Orders cancelled by seller</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Lost or undelivered packages</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <XCircle className="h-5 w-5" />
                  <span>What's Not Refundable</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Opened boxes where contents match description</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Personal preference or buyer's remorse</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Items damaged after delivery</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Digital downloads (if applicable)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Requests made after time limit</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Refund Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">How to Request a Refund</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {refundProcess.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="mb-2">Step {item.step}</Badge>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Refund Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Refund Methods & Processing Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Payment Method</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Credit/Debit Cards</span>
                      <Badge variant="outline">3-5 business days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>PayPal</span>
                      <Badge variant="outline">1-2 business days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bank Transfer</span>
                      <Badge variant="outline">5-7 business days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Digital Wallets</span>
                      <Badge variant="outline">1-3 business days</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">What Gets Refunded</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Mystery box price</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Taxes paid</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Shipping costs (if defective/damaged)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Return shipping costs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Special Circumstances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Special Circumstances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">High-Value Items</h4>
                <p className="text-muted-foreground">
                  For mystery boxes valued over $500, additional verification may be required and processing 
                  times may be extended to 7-10 business days.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">International Orders</h4>
                <p className="text-muted-foreground">
                  International refunds may take additional time due to banking regulations and currency 
                  conversion processes. Additional fees may apply.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Partial Refunds</h4>
                <p className="text-muted-foreground">
                  In some cases, we may offer partial refunds when only some items in a mystery box are 
                  problematic or when a compromise is reached.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mb-12"
        >
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Notes</h4>
                  <ul className="space-y-2 text-yellow-700 dark:text-yellow-300">
                    <li>• All refund requests must be submitted through our official support channels</li>
                    <li>• Photos or videos may be required for damage/defect claims</li>
                    <li>• Refunds are processed to the original payment method only</li>
                    <li>• Processing times may vary during high-volume periods</li>
                    <li>• Fraudulent refund requests will result in account suspension</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Need Help with a Refund?</CardTitle>
              <CardDescription>
                Our support team is here to help you with any refund questions or requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you need to request a refund or have questions about our refund policy, 
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
                    <Info className="h-4 w-4" />
                    <span>Submit Refund Request</span>
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
