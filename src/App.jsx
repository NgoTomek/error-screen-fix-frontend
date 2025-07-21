// src/App.jsx - Updated with enhanced authentication system

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { SignInModal } from './components/auth/SignInModal'
import { UserMenu } from './components/auth/UserMenu'
import { AuthTest } from './components/AuthTest'
import { useAuth } from './contexts/AuthContext'
import { testConnection } from './lib/api'
import UploadPage from './components/UploadPage'
import { 
  Zap, Shield, Users, BookOpen, User, CheckCircle,
  Menu, X, Home, Upload, Crown, Wifi, WifiOff,
  AlertTriangle, Clock, TrendingUp, Star, Sparkles,
  Loader2, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { 
    user, 
    userProfile,
    isAuthenticated, 
    analysisCount, 
    analysisLimit, 
    isPro,
    loading: authLoading,
    authReady,
    needsEmailVerification,
    shouldUpgrade,
    canAnalyze,
    error: authError,
    clearError
  } = useAuth()
  
  const [currentPage, setCurrentPage] = useState('home')
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState(null)
  const [showAuthTest, setShowAuthTest] = useState(false)

  // Test backend connection on load
  useEffect(() => {
    const checkBackend = async () => {
      const result = await testConnection()
      setBackendStatus(result.success ? 'online' : 'offline')
    }
    checkBackend()
  }, [])

  // Handle navigation
  const handleNavigation = useCallback((page) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
    
    // Clear any auth errors when navigating
    if (authError) {
      clearError()
    }
  }, [authError, clearError])

  // Handle sign in modal
  const handleSignInClick = useCallback(() => {
    setShowSignInModal(true)
  }, [])

  const handleSignInModalClose = useCallback(() => {
    setShowSignInModal(false)
  }, [])

  // Email verification banner
  const EmailVerificationBanner = useMemo(() => {
    if (!needsEmailVerification) return null

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
            onClick={() => {
              // This would trigger resend verification
              console.log('Resend verification')
            }}
          >
            Resend Email
          </Button>
        </div>
      </div>
    )
  }, [needsEmailVerification])

  // Header component
  const Header = useMemo(() => (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Status */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNavigation('home')}
              className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Zap className="h-6 w-6" />
              <span>Error Screen Fix</span>
            </button>
            
            {/* System Status Indicators */}
            <div className="flex items-center space-x-2">
              {/* Backend Status */}
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
                  <span>{backendStatus === 'online' ? 'API Online' : 'API Offline'}</span>
                </div>
              )}
              
              {/* Auth Status */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                authReady 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <CheckCircle className="h-3 w-3" />
                <span>{authReady ? 'Auth Ready' : 'Loading'}</span>
              </div>
              
              {/* Debug Toggle - Dev Only */}
              {import.meta.env.DEV && (
                <button
                  onClick={() => setShowAuthTest(!showAuthTest)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                >
                  Debug
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'community', label: 'Community', icon: Users },
              { id: 'how-it-works', label: 'How it Works', icon: BookOpen },
              { id: 'pricing', label: 'Pricing', icon: Crown }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Upgrade Button for Free Users */}
                {shouldUpgrade && (
                  <Button
                    size="sm"
                    onClick={() => handleNavigation('pricing')}
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
                onClick={handleSignInClick}
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
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'upload', label: 'Upload' },
                  { id: 'community', label: 'Community' },
                  { id: 'how-it-works', label: 'How it Works' },
                  { id: 'pricing', label: 'Pricing' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      currentPage === item.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.label}
                  </button>
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
  ), [currentPage, mobileMenuOpen, isAuthenticated, isPro, analysisCount, analysisLimit, shouldUpgrade, backendStatus, authReady, authLoading, userProfile, user, handleNavigation, handleSignInClick])

  // Loading state check - after all hooks are defined
  if (!authReady && authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Error Screen Fix
          </h2>
          <p className="text-gray-600">
            Initializing authentication system...
          </p>
        </div>
      </div>
    )
  }

  // HomePage Component
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Backend Status Alert */}
      {backendStatus === 'offline' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">
              Backend service is currently offline. Some features may not work properly.
            </span>
          </div>
        </div>
      )}

      {/* Auth Error Alert */}
      {authError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{authError}</span>
            </div>
            <Button size="sm" variant="outline" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Fix Any Error with <span className="text-blue-600">AI Power</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload a screenshot of any error and get instant, comprehensive solutions 
              powered by advanced AI. From blue screens to app crashes, we've got you covered.
            </p>
            
            {/* Usage Indicator for Authenticated Users */}
            {isAuthenticated && (
              <div className="mb-6">
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Analyses used this month:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{analysisCount}/{isPro ? '∞' : analysisLimit}</span>
                        {isPro && <Crown className="h-4 w-4 text-blue-600" />}
                      </div>
                    </div>
                    {!isPro && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            analysisCount >= analysisLimit ? 'bg-red-500' : 
                            analysisCount >= analysisLimit * 0.8 ? 'bg-yellow-500' : 
                            'bg-blue-600'
                          }`}
                          style={{ 
                            width: `${Math.min((analysisCount / analysisLimit) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    )}
                    {!canAnalyze && (
                      <p className="text-red-600 font-medium text-sm mt-2">
                        Analysis limit reached! Upgrade for unlimited access.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleNavigation('upload')}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!canAnalyze}
              >
                <Zap className="h-5 w-5 mr-2" />
                {canAnalyze ? 'Start Fixing Errors' : 'Upgrade to Continue'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigation('how-it-works')}
                className="border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50,000+", label: "Errors Analyzed", color: "text-blue-600" },
              { value: "95%", label: "Success Rate", color: "text-green-600" },
              { value: "10,000+", label: "Happy Users", color: "text-purple-600" },
              { value: "24/7", label: "AI Support", color: "text-orange-600" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Error Fixer?
            </h2>
            <p className="text-xl text-gray-600">Advanced AI technology meets user-friendly design</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Analysis",
                description: "Get comprehensive error analysis and multiple solutions in under 30 seconds using advanced AI",
                color: "from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200",
                iconBg: "bg-blue-600"
              },
              {
                icon: Shield,
                title: "95% Success Rate",
                description: "Our AI has successfully resolved over 95% of submitted error cases with expert-level accuracy",
                color: "from-green-50 to-green-100 hover:from-green-100 hover:to-green-200",
                iconBg: "bg-green-600"
              },
              {
                icon: Users,
                title: "Expert Solutions",
                description: "Solutions backed by credible sources, expert knowledge bases, and community validation",
                color: "from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200",
                iconBg: "bg-purple-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`text-center p-8 rounded-xl bg-gradient-to-br ${feature.color} transition-all duration-300`}
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Fix Your Errors?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust our AI to solve their technical problems
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => handleNavigation('upload')}
                className="bg-white text-blue-600 hover:bg-gray-100"
                disabled={!canAnalyze}
              >
                {canAnalyze ? 'Start Free Analysis' : 'Upgrade to Continue'}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleSignInClick}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Get Started Free
              </Button>
            )}
            {!isPro && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigation('pricing')}
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  // Community Page Placeholder
  const CommunityPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Solutions</h1>
          <p className="text-xl text-gray-600">Share and discover solutions from the community</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            The community feature is being developed. Soon you'll be able to share your solutions 
            and learn from others in the community.
          </p>
          {isAuthenticated ? (
            <p className="text-sm text-blue-600">
              You'll be notified when this feature becomes available.
            </p>
          ) : (
            <Button
              onClick={handleSignInClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign in to be notified
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // How It Works Page (keeping the original implementation)
  const HowItWorksPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-xl text-gray-600">Get your errors fixed in 3 simple steps</p>
        </div>

        <div className="space-y-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. Upload Your Error Screenshot</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Simply drag and drop or click to upload a screenshot of any error message, blue screen, 
                or application crash. Our system supports all major image formats and can analyze 
                errors from any platform or application.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. AI Analyzes the Problem</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our advanced AI examines your error using computer vision and natural language processing. 
                It identifies the root cause, categorizes the error type, and cross-references with 
                our extensive knowledge base of known solutions.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8"
          >
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">3. Get Comprehensive Solutions</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Receive multiple detailed solutions ranked by success probability. Each solution includes 
                step-by-step instructions, difficulty ratings, estimated time to fix, and links to 
                official documentation or trusted sources.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => handleNavigation('upload')}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!canAnalyze}
          >
            {canAnalyze ? 'Try It Now' : 'Sign Up to Try'}
          </Button>
        </div>
      </div>
    </div>
  )

  // Pricing Page (keeping the original implementation with auth enhancements)
  const PricingPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that works best for you</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white rounded-lg shadow-lg p-8 border-2 relative ${
              !isAuthenticated || !isPro ? 'border-blue-200' : 'border-gray-200'
            }`}
          >
            {!isPro && isAuthenticated && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <p className="text-gray-600 mb-6">Perfect for occasional use</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>5 error analyses per month</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Basic AI solutions</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Community support</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Basic export options</span>
              </li>
            </ul>
            
            <Button
              onClick={() => {
                if (!isAuthenticated) {
                  handleSignInClick()
                } else {
                  handleNavigation('upload')
                }
              }}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              {isAuthenticated ? 'Current Plan' : 'Get Started'}
            </Button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-white rounded-lg shadow-lg p-8 border-2 relative transform scale-105 ${
              isPro ? 'border-blue-500' : 'border-blue-500'
            }`}
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                {isPro ? 'Current Plan' : 'Most Popular'}
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$19</div>
              <p className="text-gray-600 mb-6">per month</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Unlimited error analyses</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Advanced AI solutions</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Advanced export & sharing</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Solution bookmarking</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Analysis history</span>
              </li>
            </ul>
            
            <Button
              onClick={() => {
                if (!isAuthenticated) {
                  handleSignInClick()
                } else {
                  alert('Pro upgrade coming soon! Contact support for early access.')
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="h-5 w-5 mr-2" />
              {isPro ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 relative"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$99</div>
              <p className="text-gray-600 mb-6">per month</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Dedicated support</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>API access</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Custom training</span>
              </li>
            </ul>
            
            <Button
              onClick={() => {
                alert('Contact our sales team for enterprise pricing and features!')
              }}
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              <Shield className="h-5 w-5 mr-2" />
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Verification Banner */}
      {EmailVerificationBanner}
      
      {/* Header */}
      {Header}
      
      {/* Auth Test Component - Dev Only */}
      {import.meta.env.DEV && showAuthTest && (
        <div className="border-b bg-gray-100">
          <AuthTest />
        </div>
      )}
      
      {/* Main Content */}
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'upload' && <UploadPage />}
        {currentPage === 'community' && <CommunityPage />}
        {currentPage === 'how-it-works' && <HowItWorksPage />}
        {currentPage === 'pricing' && <PricingPage />}
      </main>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={handleSignInModalClose} 
      />
    </div>
  )
}

export default App