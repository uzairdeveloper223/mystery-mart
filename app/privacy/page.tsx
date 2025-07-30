import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Lock, UserCheck, Database, Mail } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Name, email address, and contact information</li>
                    <li>Profile information including username and bio</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Shipping addresses for order fulfillment</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>How you interact with our platform and services</li>
                    <li>Pages visited, features used, and time spent on the platform</li>
                    <li>Device information, IP address, and browser type</li>
                    <li>Location information (with your consent)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Transaction Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Purchase and sale history</li>
                    <li>Mystery box listings and descriptions</li>
                    <li>Reviews and ratings</li>
                    <li>Communication between buyers and sellers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Platform Operation:</strong> To provide, maintain, and improve our mystery box marketplace
                      services
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Transaction Processing:</strong> To facilitate purchases, sales, and communications
                      between users
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Customer Support:</strong> To respond to your inquiries and provide technical support
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Safety & Security:</strong> To detect fraud, prevent abuse, and maintain platform security
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Communications:</strong> To send important updates, notifications, and marketing (with
                      consent)
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Analytics:</strong> To understand usage patterns and improve our services
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Information Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. We may share information in
                  the following circumstances:
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">With Other Users</h4>
                    <p className="text-sm text-muted-foreground">
                      Your public profile information, listings, and reviews are visible to other platform users
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Service Providers</h4>
                    <p className="text-sm text-muted-foreground">
                      With trusted third-party services for payment processing, shipping, and platform functionality
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Legal Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      When required by law, court order, or to protect our rights and safety
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Business Transfers</h4>
                    <p className="text-sm text-muted-foreground">
                      In connection with a merger, acquisition, or sale of assets (with user notification)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your information:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Technical Safeguards</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• SSL/TLS encryption for data transmission</li>
                      <li>• Secure database storage with encryption</li>
                      <li>• Regular security audits and updates</li>
                      <li>• Access controls and authentication</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Operational Safeguards</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Limited employee access to personal data</li>
                      <li>• Regular staff training on data protection</li>
                      <li>• Incident response procedures</li>
                      <li>• Data backup and recovery systems</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Account Control</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Update your profile information</li>
                      <li>• Manage privacy settings</li>
                      <li>• Control notification preferences</li>
                      <li>• Delete your account</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Data Rights</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Request access to your data</li>
                      <li>• Request data correction or deletion</li>
                      <li>• Data portability (export your data)</li>
                      <li>• Opt-out of marketing communications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience:
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Required for platform functionality, authentication, and security
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how users interact with our platform to improve services
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Preference Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Remember your settings and preferences for a personalized experience
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our platform is not intended for children under 13 years of age. We do not knowingly collect personal
                  information from children under 13. If you are a parent or guardian and believe your child has
                  provided us with personal information, please contact us immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>International Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  If you are accessing our platform from outside the United States, please note that your information
                  may be transferred to, stored, and processed in the United States where our servers are located. By
                  using our platform, you consent to this transfer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>

                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> uzairxdev223@gmail.com
                  </p>
                  <p>
                    <strong>Support:</strong> uzairxdev223@gmailc.om
                  </p>
                  <p>
                    <strong>Address:</strong> Mirpur, AJK
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by
                  posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to
                  review this Privacy Policy periodically for any changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
