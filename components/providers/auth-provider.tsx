"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { FirebaseService } from "@/lib/firebase-service"
import type { UserProfile } from "@/lib/types"

interface AuthContextType {
  user: UserProfile | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  checkUsernameAvailability: (username: string) => Promise<boolean>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshUser: () => Promise<void>
  updateUsername: (newUsername: string) => Promise<boolean>
  hasTemporaryUsername: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.email === "uzairxdev223@gmail.com"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        try {
          const userProfile = await FirebaseService.getUser(firebaseUser.uid)
          if (userProfile) {
            setUser(userProfile)
          } else {
            // User exists in Firebase Auth but not in database, create profile
            // Generate a unique temporary username to avoid conflicts
            const baseUsername = firebaseUser.email!.split("@")[0]
            const timestamp = Date.now().toString().slice(-6) // Last 6 digits
            const tempUsername = `${baseUsername}_${timestamp}`
            
            const newProfile: Partial<UserProfile> = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              username: tempUsername,
              fullName: firebaseUser.displayName || "User",
              isVerified: false,
              isEmailVerified: true,
              loyaltyTier: "bronze",
              rating: 0,
              totalSales: 0,
              totalPurchases: 0,
              preferences: {
                emailNotifications: true,
                pushNotifications: true,
                marketingEmails: false,
                theme: "system",
              },
              stats: {
                totalRevenue: 0,
                averageRating: 0,
                responseTime: 0,
                fulfillmentRate: 0,
                returnRate: 0,
              },
            }

            await FirebaseService.createUser(firebaseUser.uid, newProfile)
            await FirebaseService.reserveUsername(tempUsername, firebaseUser.uid)
            const createdProfile = await FirebaseService.getUser(firebaseUser.uid)
            setUser(createdProfile)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, username: string, fullName: string) => {
    // Check username availability
    const isAvailable = await FirebaseService.checkUsernameAvailability(username)
    if (!isAvailable) {
      throw new Error("Username is already taken")
    }

    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

    // Create user profile
    const userProfile: Partial<UserProfile> = {
      uid: firebaseUser.uid,
      email,
      username,
      fullName,
      profilePicture: generateProfilePicture(fullName),
      isVerified: false,
      isEmailVerified: true,
      loyaltyTier: "bronze",
      rating: 0,
      totalSales: 0,
      totalPurchases: 0,
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        theme: "system",
      },
      stats: {
        totalRevenue: 0,
        averageRating: 0,
        responseTime: 0,
        fulfillmentRate: 0,
        returnRate: 0,
      },
    }

    await FirebaseService.createUser(firebaseUser.uid, userProfile)
    await FirebaseService.reserveUsername(username, firebaseUser.uid)
    
    // Fetch the created user profile and set it in state to auto-login
    const createdProfile = await FirebaseService.getUser(firebaseUser.uid)
    if (createdProfile) {
      setUser(createdProfile)
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    return FirebaseService.checkUsernameAvailability(username)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    await FirebaseService.updateUser(user.uid, updates)
    const updatedUser = await FirebaseService.getUser(user.uid)
    if (updatedUser) {
      setUser(updatedUser)
    }
  }

  const refreshUser = async () => {
    if (!firebaseUser) return

    const updatedUser = await FirebaseService.getUser(firebaseUser.uid)
    if (updatedUser) {
      setUser(updatedUser)
    }
  }

  const updateUsername = async (newUsername: string): Promise<boolean> => {
    if (!user) return false

    try {
      // Use the new updateUsername method that handles both profile and usernames collection
      await FirebaseService.updateUsername(user.uid, user.username, newUsername)
      
      // Refresh user data to get updated info
      await refreshUser()
      
      return true
    } catch (error) {
      console.error("Failed to update username:", error)
      return false
    }
  }

  const hasTemporaryUsername = (): boolean => {
    if (!user) return false
    // Check if username contains timestamp pattern (ends with _xxxxxx)
    return /_\d{6}$/.test(user.username)
  }

  const generateProfilePicture = (fullName: string): string => {
    const colors = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#43e97b"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const initial = fullName.charAt(0).toUpperCase()

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${randomColor}"/>
        <text x="50" y="50" fontFamily="Arial" fontSize="40" fill="white" textAnchor="middle" dy="0.35em">${initial}</text>
      </svg>
    `)}`
  }

  const value = {
    user,
    firebaseUser,
    loading,
    isAdmin,
    login,
    register,
    logout,
    resetPassword,
    checkUsernameAvailability,
    updateProfile,
    refreshUser,
    updateUsername,
    hasTemporaryUsername,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
