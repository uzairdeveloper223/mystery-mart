"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { FirebaseService } from "@/lib/firebase-service"
import type { UserProfile } from "@/lib/types"

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Get user profile from database
          const userProfile = await FirebaseService.getUser(firebaseUser.uid)

          if (userProfile) {
            setUser(userProfile)
            // Check if user is admin (only uzairxdev223@gmail.com)
            setIsAdmin(firebaseUser.email === "uzairxdev223@gmail.com")
          } else {
            // Create user profile if it doesn't exist
            const newUserProfile: Partial<UserProfile> = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              username: firebaseUser.email?.split("@")[0] || "",
              fullName: firebaseUser.displayName || "",
              profilePicture: firebaseUser.photoURL || undefined,
              isVerified: false,
              isEmailVerified: firebaseUser.emailVerified,
              isApprovedSeller: false,
              canSell: false,
              isBanned: false,
              sellerApplicationStatus: "none",
              verificationStatus: "none",
              loyaltyTier: "bronze",
              rating: 5.0,
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
                averageRating: 5.0,
                responseTime: 24,
                fulfillmentRate: 100,
                returnRate: 0,
              },
            }

            await FirebaseService.createUser(firebaseUser.uid, newUserProfile)
            const createdProfile = await FirebaseService.getUser(firebaseUser.uid)
            setUser(createdProfile)
            setIsAdmin(firebaseUser.email === "uzairxdev223@gmail.com")
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUser(null)
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    firebaseUser,
    loading,
    isAdmin,
  }
}
