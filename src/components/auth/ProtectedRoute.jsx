// src/components/auth/ProtectedRoute.jsx - Route protection with authentication

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Lock, User, Mail, Crown, Shield, 
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react'

/**
 * ProtectedRoute Component
 * Handles different levels of access protection
 */
export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireEmailVerification = false,
  requirePro = false,
  requireAdmin = false,
  fallback = null,
  showSignInButton = true,
  customMessage = null 
}) => {
  const { 
    isAuthenticated, 
    user,
    isEmailVerified, 
    isPro, 
    isAdmin,
    loading,
    authReady
  } = useAuth()

  // Show loading state while auth is initializing
  if (loading || !authReady) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Checking authentication status
          </p>
        </div>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return (
      <AccessDenied
        icon={<User className="h-12 w-12 text-blue-600" />}
        title="Sign In Required"
        message={customMessage || "You need to sign in to access this page."}
        showSignInButton={showSignInButton}
        actionText="Sign In"
        actionVariant="default"
      />
    )
  }

  // Check email verification requirement
  if (requireEmailVerification && !isEmailVerified) {
    return (
      <AccessDenied
        icon={<Mail className="h-12 w-12 text-yellow-600" />}
        title="Email Verification Required"
        message={customMessage || "Please verify your email address to access this feature."}
        showSignInButton={false}
        showEmailVerification={true}
        actionText="Resend Verification"
        actionVariant="outline"
      />
    )
  }

  // Check Pro subscription requirement
  if (requirePro && !isPro) {
    return (
      <AccessDenied
        icon={<Crown className="h-12 w-12 text-purple-600" />}
        title="Pro Subscription Required"
        message={customMessage || "This feature is only available to Pro subscribers."}
        showSignInButton={false}
        showUpgrade={true}
        actionText="Upgrade to Pro"
        actionVariant="default"
        actionClass="bg-purple-600 hover:bg-purple-700"
      />
    )
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      <AccessDenied
        icon={<Shield className="h-12 w-12 text-red-600" />}
        title="Admin Access Required"
        message={customMessage || "You don't have permission to access this page."}
        showSignInButton={false}
        actionText="Contact Support"
        actionVariant="outline"
      />
    )
  }

  // All checks passed, render children
  return children
}

/**
 * AccessDenied Component
 * Standardized access denied screen
 */
const AccessDenied = ({ 
  icon, 
  title, 
  message, 
  showSignInButton = false,
  showEmailVerification = false,
  showUpgrade = false,
  actionText,
  actionVariant = "default",
  actionClass = ""
}) => {
  const { resendVerification } = useAuth()
  const [isResending, setIsResending] = React.useState(false)
  const [verificationMessage, setVerificationMessage] = React.useState('')

  const handleSignIn = () => {
    // Trigger sign in modal - you can customize this based on your app's structure
    window.dispatchEvent(new CustomEvent('showSignInModal'))
  }

  const handleUpgrade = () => {
    // Navigate to pricing page
    window.location.href = '/pricing'
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true)
      const result = await resendVerification()
      
      if (result.success) {
        setVerificationMessage('Verification email sent! Check your inbox.')
      } else {
        setVerificationMessage(result.message || 'Failed to send verification email')
      }
      
      setTimeout(() => {
        setVerificationMessage('')
      }, 5000)
    } catch (error) {
      setVerificationMessage('Failed to send verification email')
      setTimeout(() => {
        setVerificationMessage('')
      }, 5000)
    } finally {
      setIsResending(false)
    }
  }

  const handleContactSupport = () => {
    // You can customize this to your support system
    window.open('mailto:support@errorscreenfix.com', '_blank')
  }

  const handleAction = () => {
    if (showSignInButton) return handleSignIn()
    if (showEmailVerification) return handleResendVerification()
    if (showUpgrade) return handleUpgrade()
    return handleContactSupport()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              {icon}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {message}
            </p>

            {/* Verification Message */}
            {verificationMessage && (
              <Alert className={verificationMessage.includes('Failed') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                {verificationMessage.includes('Failed') ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={verificationMessage.includes('Failed') ? 'text-red-800' : 'text-green-800'}>
                  {verificationMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Button */}
            <Button
              onClick={handleAction}
              variant={actionVariant}
              className={`w-full ${actionClass}`}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  {showSignInButton && <User className="h-4 w-4 mr-2" />}
                  {showEmailVerification && <Mail className="h-4 w-4 mr-2" />}
                  {showUpgrade && <Crown className="h-4 w-4 mr-2" />}
                  {!showSignInButton && !showEmailVerification && !showUpgrade && (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {actionText}
                </>
              )}
            </Button>

            {/* Additional Help */}
            <div className="text-sm text-gray-500">
              {showSignInButton && (
                <p>
                  Don't have an account?{' '}
                  <button 
                    onClick={handleSignIn}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign up here
                  </button>
                </p>
              )}
              
              {showEmailVerification && (
                <div className="space-y-2">
                  <p>Check your spam folder if you don't see the email.</p>
                  <p>
                    Need help?{' '}
                    <button 
                      onClick={handleContactSupport}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Contact support
                    </button>
                  </p>
                </div>
              )}
              
              {showUpgrade && (
                <p>
                  Have questions about Pro?{' '}
                  <button 
                    onClick={handleContactSupport}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Contact sales
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/**
 * Higher-order component for protecting components
 */
export const withAuthProtection = (WrappedComponent, protectionOptions = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...protectionOptions}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Hook for checking access permissions
 */
export const useAccessControl = () => {
  const { 
    isAuthenticated, 
    isEmailVerified, 
    isPro, 
    isAdmin,
    isModerator 
  } = useAuth()

  const canAccess = React.useCallback((requirements = {}) => {
    const {
      requireAuth = false,
      requireEmailVerification = false,
      requirePro = false,
      requireAdmin = false,
      requireModerator = false
    } = requirements

    if (requireAuth && !isAuthenticated) return false
    if (requireEmailVerification && !isEmailVerified) return false
    if (requirePro && !isPro) return false
    if (requireAdmin && !isAdmin) return false
    if (requireModerator && !isModerator) return false

    return true
  }, [isAuthenticated, isEmailVerified, isPro, isAdmin, isModerator])

  return {
    canAccess,
    isAuthenticated,
    isEmailVerified,
    isPro,
    isAdmin,
    isModerator
  }
}

// Usage examples:
/*
// Basic authentication protection
<ProtectedRoute requireAuth={true}>
  <DashboardComponent />
</ProtectedRoute>

// Pro subscription protection
<ProtectedRoute requireAuth={true} requirePro={true}>
  <ProFeatureComponent />
</ProtectedRoute>

// Email verification protection
<ProtectedRoute requireAuth={true} requireEmailVerification={true}>
  <SensitiveFeatureComponent />
</ProtectedRoute>

// Admin protection
<ProtectedRoute requireAuth={true} requireAdmin={true}>
  <AdminPanelComponent />
</ProtectedRoute>

// Custom message
<ProtectedRoute 
  requireAuth={true} 
  customMessage="You need to sign in to upload error screenshots."
>
  <UploadComponent />
</ProtectedRoute>

// Using HOC
const ProtectedUpload = withAuthProtection(UploadComponent, {
  requireAuth: true,
  customMessage: "Sign in to start analyzing errors"
})

// Using access control hook
const MyComponent = () => {
  const { canAccess } = useAccessControl()
  
  const canUpload = canAccess({ requireAuth: true })
  const canUsePro = canAccess({ requireAuth: true, requirePro: true })
  
  return (
    <div>
      {canUpload && <UploadButton />}
      {canUsePro && <ProFeature />}
    </div>
  )
}
*/