"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { useNotifications } from "@/hooks/use-notifications"
import { useCart } from "@/hooks/use-cart"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  Package,
  MessageCircle,
  Plus,
  Shield,
  HelpCircle,
} from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const { totalItems } = useCart()
  const router = useRouter()
  const pathname = usePathname()

  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/boxes?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-background"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center space-x-2">
              <div className="mystery-gradient rounded-lg p-2">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Mystery Mart</span>
            </Link>
          </motion.div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search mystery boxes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full focus-ring"
              />
            </form>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href="/boxes"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/boxes") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Browse
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href="/sell"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/sell") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Sell
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href="/help"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/help") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Help
              </Link>
            </motion.div>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <>
                {/* Cart */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/cart")}>
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1">
                        <Badge variant="destructive" className="text-xs px-1 min-w-[1.25rem] h-5">
                          {totalItems}
                        </Badge>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                {/* Wishlist */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" onClick={() => router.push("/wishlist")}>
                    <Heart className="h-5 w-5" />
                  </Button>
                </motion.div>

                {/* Messages */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" onClick={() => router.push("/messages")}>
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </motion.div>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1"
                          >
                            <Badge variant="destructive" className="text-xs px-1 min-w-[1.25rem] h-5">
                              {unreadCount}
                            </Badge>
                          </motion.div>
                        )}
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className="flex flex-col items-start p-3 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium text-sm">{notification.title}</span>
                              {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">{notification.message}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          <span className="text-muted-foreground">No notifications</span>
                        </DropdownMenuItem>
                      )}
                    </div>
                    {notifications.length > 5 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/notifications")}>
                          View all notifications
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.fullName} />
                          <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/sell")}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create Box</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push("/help")}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                    Log in
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => router.push("/auth/register")}
                    className="mystery-gradient text-white btn-press"
                  >
                    Sign up
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Navigate through Mystery Mart</SheetDescription>
                </SheetHeader>

                {/* Mobile Search */}
                <div className="mt-6">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search mystery boxes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </form>
                </div>

                {/* Mobile Navigation */}
                <nav className="mt-6 space-y-4">
                  <Link
                    href="/boxes"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    <span>Browse Boxes</span>
                  </Link>
                  <Link
                    href="/sell"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Sell</span>
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </Link>

                  {user && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-2 text-sm font-medium"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/cart"
                          className="flex items-center space-x-2 text-sm font-medium mt-4"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Cart ({totalItems})</span>
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center space-x-2 text-sm font-medium mt-4"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4" />
                          <span>Wishlist</span>
                        </Link>
                        <Link
                          href="/messages"
                          className="flex items-center space-x-2 text-sm font-medium mt-4"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Messages</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center space-x-2 text-sm font-medium mt-4"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </div>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
