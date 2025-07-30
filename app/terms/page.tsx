import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, ShoppingCart, Shield, AlertTriangle, Gavel } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  By accessing and using Mystery Mart ("the Platform"), you accept and agree to be bound by the terms
                  and provision of this agreement. If you do not agree to abide by the above, please do not use this
                  service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Accounts and Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Account Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>You must be at least 18 years old to create an account</li>
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>One account per person is allowed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Account Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Keep your login credentials secure and confidential</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>You are liable for all activities under your account</li>
                    <li>Update your information to keep it current and accurate</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Seller Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Must apply and be approved to become a seller</li>
                    <li>Provide accurate business information and documentation</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Maintain good standing and positive ratings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Platform Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Permitted Uses</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Browse and purchase mystery boxes from approved sellers</li>
                    <li>Create and sell mystery boxes (with seller approval)</li>
                    <li>Communicate with other users through our messaging system</li>
                    <li>Leave reviews and ratings for completed transactions</li>
                    <li>Participate in community features and discussions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prohibited Activities</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Selling counterfeit, illegal, or prohibited items</li>
                    <li>Manipulating reviews, ratings, or platform algorithms</li>
                    <li>Harassing, threatening, or abusing other users</li>
                    <li>Attempting to circumvent platform fees or policies</li>
                    <li>Using automated tools or bots without permission</li>
                    <li>Sharing false or misleading information</li>
                    <li>Violating intellectual property rights</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mystery Box Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Seller Obligations</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Provide accurate descriptions and estimated values</li>
                    <li>Include only legal and safe items</li>
                    <li>Ship items within specified timeframes</li>
                    <li>Respond to buyer inquiries promptly</li>
                    <li>Honor refund and return policies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Buyer Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Read descriptions and terms carefully before purchasing</li>
                    <li>Provide accurate shipping information</li>
                    <li>Pay for purchases promptly</li>
                    <li>Leave honest reviews and ratings</li>
                    <li>Report any issues or disputes promptly</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Content Moderation</h3>
                  <p className="text-muted-foreground">
                    All mystery box listings are subject to review and approval by our moderation team. We reserve the
                    right to remove any content that violates our guidelines or terms.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment and Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Platform Fees</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>5% platform fee on all successful sales</li>
                    <li>Payment processing fees as applicable</li>
                    <li>Additional fees for premium features (if applicable)</li>
                    <li>Fees are automatically deducted from seller payments</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Payment Processing</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Payments are processed through secure third-party providers</li>
                    <li>We do not store payment card information</li>
                    <li>Refunds are processed according to our refund policy</li>
                    <li>Sellers receive payments after successful delivery confirmation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Taxes</h3>
                  <p className="text-muted-foreground">
                    Users are responsible for determining and paying any applicable taxes on their transactions. Sellers
                    must comply with all tax obligations in their jurisdiction.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Platform Content</h3>
                  <p className="text-muted-foreground">
                    All content on the Mystery Mart platform, including but not limited to text, graphics, logos,
                    images, and software, is the property of Mystery Mart or its licensors and is protected by copyright
                    and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">User Content</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>You retain ownership of content you create and upload</li>
                    <li>You grant us a license to use your content on the platform</li>
                    <li>You must have rights to all content you upload</li>
                    <li>You are responsible for respecting others' intellectual property</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">DMCA Policy</h3>
                  <p className="text-muted-foreground">
                    We respond to valid DMCA takedown notices. If you believe your copyright has been infringed, please
                    contact us with the required information as specified in the DMCA.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Disclaimers and Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Platform Availability</h3>
                  <p className="text-muted-foreground">
                    We strive to maintain platform availability but do not guarantee uninterrupted service. We may
                    suspend or terminate services for maintenance, updates, or other reasons.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Third-Party Content</h3>
                  <p className="text-muted-foreground">
                    We are not responsible for the accuracy, completeness, or reliability of user-generated content,
                    including mystery box descriptions, reviews, and communications between users.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    To the maximum extent permitted by law, Mystery Mart shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages, including but not limited to loss of
                    profits, data, or use.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Internal Resolution</h3>
                  <p className="text-muted-foreground">
                    We encourage users to resolve disputes directly through our messaging system. Our support team is
                    available to mediate disputes and provide assistance.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Refund Policy</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Refunds are available for undelivered or significantly misrepresented items</li>
                    <li>Refund requests must be made within 30 days of delivery</li>
                    <li>Items must be returned in original condition when applicable</li>
                    <li>Platform fees are non-refundable except in cases of platform error</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Arbitration</h3>
                  <p className="text-muted-foreground">
                    Any disputes that cannot be resolved through our internal process may be subject to binding
                    arbitration in accordance with the rules of the American Arbitration Association.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Enforcement and Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Violations</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to investigate violations of these terms and take appropriate action, including
                    warnings, content removal, account suspension, or termination.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Account Termination</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>We may terminate accounts for violations of these terms</li>
                    <li>You may terminate your account at any time</li>
                    <li>Termination does not affect completed transactions</li>
                    <li>Some provisions survive account termination</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Appeals Process</h3>
                  <p className="text-muted-foreground">
                    If your account is suspended or terminated, you may appeal the decision by contacting our support
                    team with relevant information and evidence.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governing Law</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  These Terms of Service are governed by and construed in accordance with the laws of the United States
                  and the State of California, without regard to conflict of law principles. Any legal action or
                  proceeding shall be brought exclusively in the courts of California.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. We will notify users of material changes via
                  email or platform notification. Continued use of the platform after changes constitutes acceptance of
                  the new terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>

                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> uzairxdev223@gmail.com
                  </p>
                  <p>
                    <strong>Support:</strong> uzairxdev223@gmail.com
                  </p>
                  <p>
                    <strong>Address:</strong> Mirpur , AJK
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
