'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Link, ArrowLeft, Shield } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { ref, get } from 'firebase/database'
import { onAuthStateChanged, User } from 'firebase/auth'

export default function AutoLinkFiregramPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const requestId = searchParams.get('requestId')

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [businessData, setBusinessData] = useState<any>(null)
  const [autoLinkAttempted, setAutoLinkAttempted] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user && token && requestId && !autoLinkAttempted) {
      loadBusinessData()
      // Automatically attempt linking after a short delay
      setTimeout(() => {
        handleAutoLinking()
      }, 1500)
    }
  }, [user, token, requestId, autoLinkAttempted])

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

  const handleAutoLinking = async () => {
    if (!user || !token || !requestId || autoLinkAttempted) {
      return
    }

    setAutoLinkAttempted(true)
    setLinking(true)
    setStatus('idle')
    setMessage('')

    try {
      // Get the user's ID token
      const idToken = await user.getIdToken()
      
      const response = await fetch('https://firegram-social-app.vercel.app/api/auto-complete-linking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secureToken: token,
          requestId: requestId,
          mysteryMartUid: user.uid,
          mysteryMartToken: idToken || null
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage('Your accounts have been linked successfully! Redirecting to Firegram...')

        // Redirect to Firegram completion page after 2 seconds
        setTimeout(() => {
          window.location.href = `https://firegram-social-app.vercel.app/linking-complete?success=true&mysteryMartUid=${user.uid}`
        }, 2000)
      } else {
        setStatus('error')
        let errorMessage = data.error || 'Failed to link accounts automatically'
        
        // Provide more helpful error messages
        if (errorMessage.includes('expired')) {
          errorMessage = 'The linking request has expired. Please generate a new link from Firegram.'
        } else if (errorMessage.includes('not found')) {
          errorMessage = 'Linking request not found. Please generate a new link from Firegram.'
        } else if (errorMessage.includes('authentication')) {
          errorMessage = 'Authentication issue. Please try the manual code method instead.'
        }
        
        setMessage(errorMessage)
      }
    } catch (error) {
      console.error('Error auto-linking accounts:', error)
      setStatus('error')
      setMessage('Network error occurred during automatic linking. Please try again.')
    } finally {
      setLinking(false)
    }
  }

  const handleManualRetry = () => {
    setAutoLinkAttempted(false)
    setStatus('idle')
    setMessage('')
    handleAutoLinking()
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

  if (!token || !requestId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              This linking link is invalid or missing required parameters
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
            <Shield className="w-5 h-5 mr-2" />
            Secure Account Linking
          </CardTitle>
          <CardDescription>
            Automatically connecting your MysteryMart and Firegram accounts
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

          {linking && (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-medium">Linking your accounts...</p>
              <p className="text-sm text-gray-600 mt-2">This will only take a moment</p>
            </div>
          )}

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
            {status === 'error' && (
              <div className="space-y-2">
                <Button
                  onClick={handleManualRetry}
                  disabled={linking}
                  className="w-full"
                >
                  {linking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Retry Auto-Link
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => router.push('/link-firegram')}
                  variant="outline"
                  className="w-full"
                  disabled={linking}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Try Manual Code Method
                </Button>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center text-sm text-gray-600">
                Redirecting to dashboard in a few seconds...
              </div>
            )}

            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
              disabled={linking}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            Secure linking powered by encrypted tokens
          </div>
        </CardContent>
      </Card>
    </div>
  )
}