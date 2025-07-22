// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { SignInModal } from '@/components/auth/SignInModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { DevelopmentBanner } from '@/components/common/DevelopmentBanner'
import { testConnection } from '@/lib/api'
import { 
  Zap, Menu, X, Home, Upload, Crown, Wifi, WifiOff,
  User, Mail, CheckCircle, AlertCircle, Loader2,
  BookOpen, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { 
    user, 
    userProfile,
    isAuthenticated, 
    isEmailVerified,
    isPro,
    analysisCount,
    analysisLimit,
    needsEmailVerification,
    shouldUpgrade,
    loading: authLoading,
    authReady,
    error: authError,
    clearError
  } = useAuth()

  const [showSignInModal, setShowSignInModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState(null)

  // Test backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      const result = await testConnection()
      setBackendStatus(result.success ? 'online' : 'offline')
    }
    checkBackend()
  }, [])

  // Listen for sign in modal events
  useEffect(() => {
    const handleShowSignIn = () => setShowSignInModal(true)
    window.addEventListener('showSignInModal', handleShowSignIn)
    return () => window.removeEventListener('showSignInModal', handleShowSignIn)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: Home },
    { id: 'upload', label: 'Upload', path: '/upload', icon: Upload },
    { id: 'community', label: 'Community', path: '/community', icon: Users },
    { id: 'how-it-works', label: 'How it Works', path: '/how-it-works', icon: BookOpen },
    { id: 'pricing', label: 'Pricing', path: '/pricing', icon: Crown }
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Development Banner */}
      <DevelopmentBanner />
      
      {/* Email Verification Banner */}
      {needsEmailVerification && (
        <EmailVerificationBanner />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Status */}
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Zap className="h-6 w-6" />
                <span>Error Screen Fix</span>
              </Link>
              
              {/* System Status Indicators */}
              <SystemStatusIndicators 
                backendStatus={backendStatus}
                authReady={authReady}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {/* Upgrade Button */}
                  {shouldUpgrade && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/pricing')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                    >
                      <Crown className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  )}
                  
                  {/* Usage Indicator */}
                  {!isPro && (
                    <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-600">
                      <span>{analysisCount}/{analysisLimit}</span>
                    </div>
                  )}
                  
                  <UserMenu />
                </div>
              ) : (
                <Button
                  onClick={() => setShowSignInModal(true)}
                  className="flex items-center space-x-1"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>Sign In</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t bg-white"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  {/* Mobile User Info */}
                  {isAuthenticated && (
                    <div className="pt-4 border-t mt-4">
                      <div className="px-3 py-2">
                        <div className="text-sm text-gray-600">
                          Signed in as {userProfile?.displayName || user?.email}
                        </div>
                        {!isPro && (
                          <div className="text-xs text-gray-500 mt-1">
                            {analysisCount}/{analysisLimit} analyses used
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Backend Status Alert */}
      {backendStatus === 'offline' && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Backend service is currently offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}

      {/* Auth Error Alert */}
      {authError && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{authError}</span>
            <Button size="sm" variant="outline" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
    </div>
  )
}

// Sub-components
const SystemStatusIndicators = ({ backendStatus, authReady }) => {
  if (!import.meta.env.DEV) return null

  return (
    <div className="flex items-center space-x-2">
      {backendStatus && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
          backendStatus === 'online' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {backendStatus === 'online' ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>API {backendStatus}</span>
        </div>
      )}
      
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
        authReady 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        <CheckCircle className="h-3 w-3" />
        <span>{authReady ? 'Auth Ready' : 'Loading'}</span>
      </div>
    </div>
  )
}

const EmailVerificationBanner = () => {
  const { resendVerification } = useAuth()
  const [isResending, setIsResending] = useState(false)

  const handleResend = async () => {
    try {
      setIsResending(true)
      await resendVerification()
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 text-sm">
            Please verify your email address to access all features.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Resend Email'
          )}
        </Button>
      </div>
    </div>
  )
}