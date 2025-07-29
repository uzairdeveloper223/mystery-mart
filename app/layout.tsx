import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { MaintenanceCheck } from "@/components/maintenance-check"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mystery Mart - Discover Amazing Mystery Boxes",
  description:
    "Discover amazing mystery boxes filled with surprises. Buy, sell, and trade mystery boxes with our community.",
  keywords: "mystery boxes, surprise boxes, collectibles, trading, marketplace",
  authors: [{ name: "Mystery Mart Team" }],
  creator: "Mystery Mart",
  publisher: "Mystery Mart",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mysterymart.com",
    title: "Mystery Mart - Discover Amazing Mystery Boxes",
    description:
      "Discover amazing mystery boxes filled with surprises. Buy, sell, and trade mystery boxes with our community.",
    siteName: "Mystery Mart",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mystery Mart - Discover Amazing Mystery Boxes",
    description:
      "Discover amazing mystery boxes filled with surprises. Buy, sell, and trade mystery boxes with our community.",
    creator: "@mysterymart",
  },
    generator: 'v0.dev'
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
            <MaintenanceCheck>{children}</MaintenanceCheck>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
