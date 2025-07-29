import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { CartProvider } from "@/hooks/use-cart"
import { WishlistProvider } from "@/hooks/use-wishlist"
import { MaintenanceCheck } from "@/components/maintenance-check"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mystery Mart - Discover Amazing Mystery Boxes",
  description:
    "Discover amazing mystery boxes filled with surprises. Buy, sell, and trade mystery boxes with our community.",
  keywords: "mystery boxes, surprise boxes, collectibles, trading, marketplace",
  authors: [{ name: "Uzair Developer" }],
  creator: "Mystery Mart",
  publisher: "Mystery Mart",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/logo.svg", type: "image/svg+xml" }
    ]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mystery-mart-app.vercel.app",
    title: "Mystery Mart - Discover Amazing Mystery Boxes",
    description:
      "Discover amazing mystery boxes filled with surprises. Buy, sell, and trade mystery boxes with our community.",
    siteName: "Mystery Mart",
    images: [
      {
        url: "/logo.svg",
        width: 120,
        height: 120,
        alt: "Mystery Mart Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mystery Mart - Discover Amazing Mystery Boxes",
    description:
      "Discover amazing mystery boxes filled with surprises. Buy, sell, and trade mystery boxes with our community.",
    creator: "@mughal_x22",
    images: ["/logo.svg"]
  },
    generator: 'Uzair'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <MaintenanceCheck>{children}</MaintenanceCheck>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
