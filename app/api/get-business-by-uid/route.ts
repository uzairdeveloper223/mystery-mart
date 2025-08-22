import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { ref, get } from 'firebase/database'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const uid = searchParams.get('uid')

  if (!uid) {
    return NextResponse.json(
      { verified: false, error: 'UID parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Get user data from MysteryMart's Realtime Database
    const userRef = ref(db, `users/${uid}`)
    const userSnapshot = await get(userRef)

    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { verified: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userSnapshot.val()

    // Check if user is verified and can sell
    const isVerified = userData.isEmailVerified === true
    const canSell = userData.canSell === true

    if (!isVerified) {
      return NextResponse.json({
        verified: false,
        error: 'User email not verified'
      })
    }

    // Return business information
    return NextResponse.json({
      verified: true,
      uid: uid,
      businessName: userData.fullName || userData.businessName || "Unknown Business",
      businessType: canSell ? (userData.isApprovedSeller ? "Approved Seller" : "Pending Seller") : "User",
      username: userData.username,
      isApprovedSeller: userData.isApprovedSeller || false,
      canSell: canSell,
      loyaltyTier: userData.loyaltyTier,
      rating: userData.rating || 0,
      stats: userData.stats || {},
      profilePicture: userData.profilePicture,
      bio: userData.bio,
      location: userData.location,
      socialLinks: userData.socialLinks || {},
      totalSales: userData.totalSales || 0,
      verificationStatus: userData.verificationStatus || "verified",
      email: userData.email // Include email for reference
    })

  } catch (error) {
    console.error('Error fetching business data:', error)
    return NextResponse.json(
      { verified: false, error: 'Failed to fetch business data' },
      { status: 500 }
    )
  }
}