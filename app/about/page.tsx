"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Package, 
  Users, 
  Shield, 
  Trophy, 
  Heart, 
  Star,
  CheckCircle,
  Target,
  Zap,
  Globe
} from "lucide-react"

export default function AboutPage() {
  const stats = [
    { label: "Happy Customers", value: "10,000+", icon: Users },
    { label: "Mystery Boxes Sold", value: "25,000+", icon: Package },
    { label: "Verified Sellers", value: "500+", icon: Shield },
    { label: "Customer Satisfaction", value: "98%", icon: Star },
  ]

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "We prioritize customer satisfaction and ensure every mystery box delivers value and excitement."
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "All sellers are verified and every transaction is protected by our buyer protection program."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously innovate to bring you the best mystery box experience with cutting-edge technology."
    },
    {
      icon: Globe,
      title: "Community",
      description: "We're building a global community of collectors, treasure hunters, and mystery box enthusiasts."
    }
  ]

  const team = [
    {
      name: "Uzair Dev",
      role: "Founder & CEO",
      description: "Full-stack developer passionate about creating amazing user experiences and building platforms that bring people together."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 mystery-gradient bg-clip-text text-transparent">
            About Mystery Mart
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're revolutionizing the way people discover and collect amazing items through the excitement 
            of mystery boxes. Join thousands of collectors and treasure hunters in the ultimate surprise shopping experience.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center mb-4">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-lg">
              <p>
                Mystery Mart was born from a simple idea: what if shopping could be an adventure? 
                As avid collectors ourselves, we noticed that the thrill of discovery was missing 
                from traditional e-commerce platforms.
              </p>
              <p>
                We wanted to create a platform where every purchase is a surprise, where collectors 
                could find rare and unique items, and where sellers could showcase their creativity 
                through carefully curated mystery boxes.
              </p>
              <p>
                Today, Mystery Mart has grown into a thriving community of over 10,000 collectors 
                and 500 verified sellers from around the world. Every day, we help people discover 
                amazing treasures they never knew they needed.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <value.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-16"
        >
          <Card className="mystery-gradient-bg text-white">
            <CardContent className="p-12 text-center">
              <Target className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl leading-relaxed max-w-3xl mx-auto">
                To bring the joy of discovery back to online shopping by creating the world's 
                most trusted and exciting mystery box marketplace, where every purchase is an 
                adventure and every collector finds their next treasure.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {team.map((member, index) => (
              <Card key={index}>
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">U</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <Badge variant="secondary" className="mb-4">{member.role}</Badge>
                  <p className="text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* What Makes Us Different */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center">What Makes Us Different</CardTitle>
              <CardDescription className="text-center text-lg">
                We're not just another marketplace - we're a community-driven platform built for collectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Verified Sellers Only</h4>
                      <p className="text-muted-foreground">All sellers go through our rigorous verification process</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Buyer Protection</h4>
                      <p className="text-muted-foreground">100% money-back guarantee if you're not satisfied</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Community-Driven</h4>
                      <p className="text-muted-foreground">Built by collectors, for collectors</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Transparent Ratings</h4>
                      <p className="text-muted-foreground">Real reviews and ratings from verified buyers</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Secure Payments</h4>
                      <p className="text-muted-foreground">Multiple payment options with bank-level security</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">24/7 Support</h4>
                      <p className="text-muted-foreground">Our support team is always here to help</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
