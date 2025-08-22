'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Link, ArrowLeft } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { ref, get } from 'firebase/database'
import { onAuthStateChanged, User } from 'firebase/auth'

export default function LinkFiregramPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const requestId = searchParams.get('requestId')

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [linkingCode, setLinkingCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [businessData, setBusinessData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user && requestId) {
      loadBusinessData()
    }
  }, [user, requestId])

  const loadBusinessData = async () => {
    if (!user) return

    try {
      const userRef = ref(db, `users/${user.uid}`)
      const snapshot = await get(userRef)

      if (snapshot.exists()) {
        const userData = snapshot.val()
        setBusinessData({
          businessName: userData.fullName || userData.businessName || 'Your Business',
          username: userData.username,
          isApprovedSeller: userData.isApprovedSeller || false,
          canSell: userData.canSell || false,
          profilePicture: userData.profilePicture
        })
      }
    } catch (error) {
      console.error('Error loading business data:', error)
    }
  }

  const handleLinking = async () => {
    if (!user || !requestId || !linkingCode.trim()) {
      setStatus('error')
      setMessage('Please enter the linking code')
      return
    }

    setLinking(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('https://firegram-social-app.vercel.app/api/complete-linking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          linkingCode: linkingCode.trim().toUpperCase(),
          mysteryMartUid: user.uid
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage('Your accounts have been linked successfully!')

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to link accounts')
      }
    } catch (error) {
      console.error('Error linking accounts:', error)
      setStatus('error')
      setMessage('Network error. Please try again.')
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Authentication Required</CardTitle>
            <CardDescription>
              Please log in to MysteryMart to link your accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              This linking link is invalid or expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-blue-600">
            <Link className="w-5 h-5 mr-2" />
            Link Your Firegram Account
          </CardTitle>
          <CardDescription>
            Complete the connection between your MysteryMart and Firegram accounts
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {businessData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Business Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Name:</strong> {businessData.businessName}</p>
                {businessData.username && (
                  <p><strong>Username:</strong> @{businessData.username}</p>
                )}
                <p><strong>Status:</strong> {businessData.isApprovedSeller ? 'Approved Seller' : 'Seller'}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="linkingCode">Enter Linking Code</Label>
            <Input
              id="linkingCode"
              value={linkingCode}
              onChange={(e) => setLinkingCode(e.target.value.toUpperCase())}
              placeholder="Enter the 6-digit code from Firegram"
              maxLength={6}
              className="text-center text-lg font-mono tracking-wider"
              disabled={linking}
            />
            <p className="text-xs text-gray-500 text-center">
              Enter the code you received in Firegram
            </p>
          </div>

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleLinking}
              disabled={linking || linkingCode.length !== 6}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking Accounts...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Complete Linking
                </>
              )}
            </Button>

            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
