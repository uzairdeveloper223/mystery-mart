import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { mysteryMartUid, firegramData } = await request.json()

    if (!mysteryMartUid || !firegramData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get Mystery Mart user data using Firebase Admin
    const db = admin.database()
    const userRef = db.ref(`users/${mysteryMartUid}`)
    const userSnapshot = await userRef.once('value')

    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Mystery Mart user not found' },
        { status: 404 }
      )
    }

    const userData = userSnapshot.val()

    // Update user profile with Firegram linking information using Firebase Admin
    await userRef.set({
      ...userData,
      firegramLinked: true,
      firegramUsername: firegramData.username,
      firegramData: firegramData,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Mystery Mart profile updated with Firegram link'
    })

  } catch (error) {
    console.error('Error updating Mystery Mart profile with Firegram link:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}