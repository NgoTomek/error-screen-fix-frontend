// src/components/auth/EmailVerificationFlow.jsx - Complete email verification flow

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Mail, CheckCircle, AlertCircle, RefreshCw, 
  Clock, Send, ExternalLink, Loader2,
  Shield, Sparkles
} from 'lucide-react'

/**
 * EmailVerificationFlow Component
 * Handles the complete email verification process
 */
export const EmailVerificationFlow = ({ 
  mode = 'banner', // 'banner', 'modal', 'page'
  onVerificationComplete,
  onDismiss,
  autoCheck = true,
  showProgress = true
}) => {
  const { 
    user, 
    isEmailVerified, 
    resendVerification, 
    refreshAuth 
  } = useAuth()

  const [step, setStep] = useState('initial') // initial, sending, sent, checking, verified, error
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(true)
  const [checkAttempts, setCheckAttempts] = useState(0)
  const [isChecking, setIsChecking] = useState(false)

  // Auto-check verification status
  useEffect(() => {
    if (autoCheck && user && !isEmailVerified && step === 'sent') {
      const checkInterval = setInterval(async () => {
        if (checkAttempts < 20) { // Stop after 20 attempts (10 minutes)
          setIsChecking(true)
          await refreshAuth()
          setCheckAttempts(prev => prev + 1)
          setIsChecking(false)
        } else {
          clearInterval(checkInterval)
        }
      }, 30000) // Check every 30 seconds

      return () => clearInterval(checkInterval)
    }
  }, [user, isEmailVerified, step, checkAttempts, autoCheck, refreshAuth])

  // Countdown timer for resend button
  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
      setCountdown(60)
    }
  }, [canResend, countdown])

  // Handle verification status changes
  useEffect(() => {
    if (isEmailVerified && step !== 'verified') {
      setStep('verified')
      setMessage('Email successfully verified!')
      if (onVerificationComplete) {
        setTimeout(() => {
          onVerificationComplete()
        }, 2000)
      }
    }
  }, [isEmailVerified, step, onVerificationComplete])

  const handleResendVerification = async () => {
    if (!canResend) return

    setStep('sending')
    setMessage('')

    try {
      const result = await resendVerification()
      
      if (result.success) {
        setStep('sent')
        setMessage('Verification email sent successfully!')
        setCanResend(false)
        setCheckAttempts(0)
      } else {
        setStep('error')
        setMessage(result.message || 'Failed to send verification email')
      }
    } catch (error) {
      setStep('error')
      setMessage(error.message || 'Failed to send verification email')
    }
  }

  const handleManualCheck = async () => {
    setIsChecking(true)
    await refreshAuth()
    setIsChecking(false)
    
    if (!isEmailVerified) {
      setMessage('Email not yet verified. Please check your inbox and click the verification link.')
    }
  }

  const getProgressValue = () => {
    switch (step) {
      case 'initial': return 0
      case 'sending': return 25
      case 'sent': return 50
      case 'checking': return 75
      case 'verified': return 100
      default: return 0
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case 'initial':
        return <Mail className="h-6 w-6 text-blue-600" />
      case 'sending':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      case 'sent':
        return <Send className="h-6 w-6 text-green-600" />
      case 'checking':
        return <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
      case 'verified':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      default:
        return <Mail className="h-6 w-6 text-blue-600" />
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'initial':
        return 'Verify Your Email'
      case 'sending':
        return 'Sending Verification Email...'
      case 'sent':
        return 'Check Your Email'
      case 'checking':
        return 'Checking Verification Status...'
      case 'verified':
        return 'Email Verified!'
      case 'error':
        return 'Verification Failed'
      default:
        return 'Verify Your Email'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 'initial':
        return `Please verify your email address (${user?.email}) to access all features.`
      case 'sending':
        return 'Please wait while we send the verification email...'
      case 'sent':
        return 'We\'ve sent a verification link to your email. Click the link to verify your account.'
      case 'checking':
        return 'Checking if you\'ve clicked the verification link...'
      case 'verified':
        return 'Your email has been successfully verified! You now have access to all features.'
      case 'error':
        return message || 'There was a problem sending the verification email.'
      default:
        return 'Please verify your email address to continue.'
    }
  }

  // Don't render if email is already verified
  if (isEmailVerified) {
    return null
  }

  const content = (
    <div className="space-y-4">
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Verification Progress</span>
            <span>{getProgressValue()}%</span>
          </div>
          <Progress value={getProgressValue()} className="h-2" />
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {getStepIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {getStepTitle()}
          </h3>
          <p className="text-gray-600 mt-1">
            {getStepDescription()}
          </p>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <Alert className={
          step === 'error' ? 'border-red-200 bg-red-50' :
          step === 'verified' ? 'border-green-200 bg-green-50' :
          'border-blue-200 bg-blue-50'
        }>
          {step === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : step === 'verified' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Mail className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription className={
            step === 'error' ? 'text-red-800' :
            step === 'verified' ? 'text-green-800' :
            'text-blue-800'
          }>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {(step === 'initial' || step === 'error') && (
          <Button
            onClick={handleResendVerification}
            disabled={!canResend}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            {step === 'initial' ? 'Send Verification Email' : 'Resend Email'}
          </Button>
        )}

        {step === 'sent' && (
          <>
            <Button
              onClick={handleManualCheck}
              disabled={isChecking}
              variant="outline"
              className="flex-1"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>

            <Button
              onClick={handleResendVerification}
              disabled={!canResend}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Email
              {!canResend && countdown > 0 && (
                <span className="ml-2 text-sm">({countdown}s)</span>
              )}
            </Button>
          </>
        )}

        {step === 'verified' && onVerificationComplete && (
          <Button
            onClick={onVerificationComplete}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue
          </Button>
        )}
      </div>

      {/* Additional Help */}
      {(step === 'sent' || step === 'error') && (
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>It may take a few minutes for the email to arrive.</p>
          </div>
          
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Check your spam/junk folder if you don't see the email.</p>
          </div>

          <div className="flex items-start space-x-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>Need help? Contact our support team:</p>
              <button
                onClick={() => window.open('mailto:support@errorscreenfix.com', '_blank')}
                className="text-blue-600 hover:underline font-medium"
              >
                support@errorscreenfix.com
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefits of Verification */}
      {step === 'initial' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            Benefits of Email Verification
          </h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Access to all features and tools</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Secure account recovery options</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Important notifications and updates</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Enhanced account security</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )

  // Render based on mode
  if (mode === 'banner') {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 text-sm font-medium">
                Please verify your email address to access all features.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleResendVerification}
                disabled={!canResend}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {step === 'sending' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Send Email'
                )}
              </Button>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-yellow-800 hover:text-yellow-900"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Email Verification</h2>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            )}
          </div>
          {content}
        </motion.div>
      </div>
    )
  }

  // Page mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Hook for managing email verification state
export const useEmailVerification = () => {
  const { user, isEmailVerified, resendVerification } = useAuth()
  const [isVerifying, setIsVerifying] = useState(false)

  const startVerification = async () => {
    if (isEmailVerified) return { success: true, message: 'Email already verified' }

    setIsVerifying(true)
    try {
      const result = await resendVerification()
      return result
    } catch (error) {
      return { success: false, message: error.message }
    } finally {
      setIsVerifying(false)
    }
  }

  return {
    needsVerification: !isEmailVerified && !!user,
    isVerifying,
    startVerification,
    userEmail: user?.email
  }
}

// Usage examples:
/*
// Banner mode (top of page)
<EmailVerificationFlow 
  mode="banner" 
  onDismiss={() => setShowBanner(false)}
/>

// Modal mode
<EmailVerificationFlow 
  mode="modal" 
  onVerificationComplete={() => setShowModal(false)}
  onDismiss={() => setShowModal(false)}
/>

// Full page mode
<EmailVerificationFlow 
  mode="page" 
  onVerificationComplete={() => navigate('/dashboard')}
/>

// Using the hook
const MyComponent = () => {
  const { needsVerification, startVerification } = useEmailVerification()
  
  if (needsVerification) {
    return <EmailVerificationFlow mode="page" />
  }
  
  return <YourMainComponent />
}
*/