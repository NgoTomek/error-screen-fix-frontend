import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { SignInModal } from './components/auth/SignInModal'
import { UserMenu } from './components/auth/UserMenu'
import { useAuth } from './contexts/AuthContext'
import { analysisAPI, testConnection, getErrorMessage } from './lib/api'
import { 
  Upload, Zap, Shield, Users, CheckCircle, 
  BookOpen, User, LogOut, Download, 
  Share2, Bookmark, Copy, ThumbsUp, ThumbsDown, 
  ExternalLink, AlertTriangle, Menu, X, Home,
  Crown, Sparkles, Clock, Star, Wifi, WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
    isAuthenticated, 
    analysisCount, 
    analysisLimit, 
    isPro,
    trackAnalysis,
    getAuthHeader
  } = useAuth()
  
  // State management
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedFile, setSelectedFile] = useState(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [bookmarkedSolutions, setBookmarkedSolutions] = useState(new Set())
  const [solutionFeedback, setSolutionFeedback] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [backendStatus, setBackendStatus] = useState(null) // 'online' | 'offline' | null
  
  const fileInputRef = useRef(null)

  // Test backend connection on app load
  useEffect(() => {
    const checkBackend = async () => {
      const result = await testConnection()
      setBackendStatus(result.success ? 'online' : 'offline')
      if (result.success) {
        console.log('✅ Backend connected:', result.baseUrl)
      } else {
        console.warn('❌ Backend offline:', result.message)
      }
    }
    
    checkBackend()
  }, [])

  // Utility functions
  const convertToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }, [])

  const handleUploadClick = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    
    // Check analysis limit for free users
    if (!isPro && analysisCount >= analysisLimit) {
      alert('You have reached your analysis limit. Please upgrade to Pro for unlimited analyses.')
      setCurrentPage('pricing')
      return
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [isPro, analysisCount, analysisLimit])

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a valid image file (JPG, PNG, GIF, WebP)')
    }
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }
    
    return true
  }

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        validateFile(file)
        setSelectedFile(file)
        if (currentPage !== 'upload') {
          setCurrentPage('upload')
        }
      } catch (error) {
        alert(error.message)
      }
    }
  }, [currentPage])

  const handleDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      try {
        validateFile(file)
        setSelectedFile(file)
        if (currentPage !== 'upload') {
          setCurrentPage('upload')
        }
      } catch (error) {
        alert(error.message)
      }
    }
  }, [currentPage])

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
  }, [])

  const analyzeError = useCallback(async (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    // Check if user needs to sign in for authenticated features
    if (!isAuthenticated && analysisCount >= 5) {
      setShowSignInModal(true)
      return
    }

    // Check analysis limit
    if (!isPro && analysisCount >= analysisLimit) {
      alert('You have reached your analysis limit. Please upgrade to Pro for unlimited analyses.')
      setCurrentPage('pricing')
      return
    }

    setIsAnalyzing(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Convert file to base64
      const base64Image = await convertToBase64(selectedFile)
      setUploadProgress(95)

      // Call backend API using the new API service
      const result = await analysisAPI.analyzeError(base64Image, additionalInfo)
      
      setUploadProgress(100)
      setAnalysisResult(result)
      
      // Track the analysis if user is authenticated
      if (isAuthenticated) {
        await trackAnalysis()
      }
      
      console.log('✅ Analysis successful:', result.analysis_id)
      
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      
      // Create a fallback error result with proper error handling
      setAnalysisResult({
        error_detected: getErrorMessage(error),
        analysis_id: 'error_' + Date.now(),
        timestamp: new Date().toISOString(),
        category: 'Analysis Error',
        confidence: 0,
        severity: 'Medium',
        estimated_impact: 'Unable to process the image',
        solutions: backendStatus === 'offline' ? [
          {
            title: "Backend Connection Issue",
            description: "The analysis service is currently unavailable. This might be because the backend is not running or there's a network connectivity issue.",
            steps: [
              "Check if the backend service is running on the correct port",
              "Verify your internet connection",
              "Try refreshing the page and analyzing again",
              "Contact support if the issue persists"
            ],
            difficulty: "Easy",
            success_rate: "N/A",
            estimated_time: "2-5 minutes"
          }
        ] : []
      })
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(0)
    }
  }, [selectedFile, additionalInfo, isAuthenticated, isPro, analysisCount, analysisLimit, trackAnalysis, backendStatus, convertToBase64])

  const resetAnalysis = useCallback((event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    setSelectedFile(null)
    setAdditionalInfo('')
    setAnalysisResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Navigation handlers
  const handleNavigation = useCallback((page, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }, [])

  // Header Component with backend status indicator
  const Header = () => (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => handleNavigation('home', e)}
              className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Zap className="h-6 w-6" />
              <span>Error Screen Fix</span>
            </button>
            
            {/* Backend Status Indicator */}
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
                <span>{backendStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={(e) => handleNavigation('home', e)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'home' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <Home className="h-4 w-4 inline mr-1" />
              Home
            </button>
            <button
              onClick={(e) => handleNavigation('upload', e)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'upload' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-1" />
              Upload
            </button>
            <button
              onClick={(e) => handleNavigation('community', e)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'community' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              Community
            </button>
            <button
              onClick={(e) => handleNavigation('how-it-works', e)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'how-it-works' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              How it works
            </button>
            <button
              onClick={(e) => handleNavigation('pricing', e)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'pricing' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Pricing
            </button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {!isPro && (
                  <Button
                    size="sm"
                    onClick={(e) => handleNavigation('pricing', e)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                )}
                <UserMenu />
              </div>
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu button */}
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
                <button
                  onClick={(e) => handleNavigation('home', e)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === 'home' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={(e) => handleNavigation('upload', e)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === 'upload' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={(e) => handleNavigation('community', e)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === 'community' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={(e) => handleNavigation('how-it-works', e)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === 'how-it-works' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'text-gray-700 hover:text-orange-600'
                  }`}
                >
                  How it works
                </button>
                <button
                  onClick={(e) => handleNavigation('pricing', e)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === 'pricing' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Pricing
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )

  // Enhanced Home Page with backend status
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
            
            {/* Analysis limit indicator for authenticated users */}
            {isAuthenticated && (
              <div className="mb-6">
                <Alert className="max-w-md mx-auto">
                  <AlertDescription>
                    You have used {analysisCount} of {isPro ? '∞' : analysisLimit} analyses this month
                    {!isPro && analysisCount >= analysisLimit && (
                      <span className="text-red-600 font-medium"> - Upgrade for unlimited access!</span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={(e) => handleNavigation('upload', e)}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                <Zap className="h-5 w-5" />
                <span>Start Fixing Errors</span>
              </button>
              <button
                onClick={(e) => handleNavigation('how-it-works', e)}
                className="px-8 py-4 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                <BookOpen className="h-5 w-5" />
                <span>How It Works</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rest of HomePage content stays the same... */}
      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-blue-600">50,000+</div>
              <div className="text-sm text-gray-600">Errors Analyzed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-green-600">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-purple-600">10,000+</div>
              <div className="text-sm text-gray-600">Happy Users</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600">AI Support</div>
            </motion.div>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Instant Analysis</h3>
              <p className="text-gray-600">
                Get comprehensive error analysis and multiple solutions in under 30 seconds using advanced AI
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">95% Success Rate</h3>
              <p className="text-gray-600">
                Our AI has successfully resolved over 95% of submitted error cases with expert-level accuracy
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Expert Solutions</h3>
              <p className="text-gray-600">
                Solutions backed by credible sources, expert knowledge bases, and community validation
              </p>
            </motion.div>
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
            <button
              onClick={(e) => handleNavigation('upload', e)}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Start Free Analysis
            </button>
            {!isPro && (
              <button
                onClick={(e) => handleNavigation('pricing', e)}
                className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg"
              >
                <Crown className="h-5 w-5 inline mr-2" />
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  // Enhanced Upload Page with backend status awareness
  const UploadPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Error Screenshot</h1>
          <p className="text-gray-600">Get instant AI-powered solutions for any technical error</p>
          
          {/* Backend Status Warning */}
          {backendStatus === 'offline' && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                The analysis service is currently offline. You can still upload files, but analysis may not work until the service is restored.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Usage indicator */}
          {isAuthenticated && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center text-sm">
                  <span>Analyses used this month:</span>
                  <span className="font-medium">
                    {analysisCount}/{isPro ? '∞' : analysisLimit}
                  </span>
                </div>
                {!isPro && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((analysisCount / analysisLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {!analysisResult ? (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : selectedFile 
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onClick={handleUploadClick}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-lg text-green-700 font-medium mb-2">
                        File Selected: {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          resetAnalysis(e)
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg text-gray-600 mb-2">
                        Drop your error screenshot here
                      </p>
                      <p className="text-sm text-gray-500">or click to browse files</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Supports: JPG, PNG, GIF, WebP (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Additional Information - FIXED */}
              <div onClick={(e) => e.stopPropagation()}>
                <label htmlFor="additional-info" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additional-info"
                  value={additionalInfo}
                  onChange={(e) => {
                    e.stopPropagation()
                    setAdditionalInfo(e.target.value)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Describe what you were doing when the error occurred, any error codes, or other relevant details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Upload Progress */}
              {isAnalyzing && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analyzing error...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={analyzeError}
                  disabled={!selectedFile || isAnalyzing || (!isPro && !isAuthenticated && analysisCount >= 5)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Analyze Error</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetAnalysis}
                  className="px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Limit warning for free users */}
              {!isAuthenticated && analysisCount >= 5 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    You've reached the free analysis limit. 
                    <button 
                      onClick={() => setShowSignInModal(true)}
                      className="ml-1 font-medium underline hover:no-underline"
                    >
                      Sign in
                    </button> for more analyses or
                    <button 
                      onClick={(e) => handleNavigation('pricing', e)}
                      className="ml-1 font-medium underline hover:no-underline"
                    >
                      upgrade to Pro
                    </button> for unlimited access.
                  </AlertDescription>
                </Alert>
              )}

              {!isPro && isAuthenticated && analysisCount >= analysisLimit && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    You've reached your monthly analysis limit. 
                    <button 
                      onClick={(e) => handleNavigation('pricing', e)}
                      className="ml-1 font-medium underline hover:no-underline"
                    >
                      Upgrade to Pro
                    </button> for unlimited analyses.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <AnalysisResults />
          )}
        </div>
      </div>
    </div>
  )

  // Keep all the other page components the same (AnalysisResults, SolutionCard, etc.)
  // ... (rest of the components remain unchanged)

  // Enhanced Analysis Results Component to match backend response format
  const AnalysisResults = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
          <p className="text-gray-600">
            Found {analysisResult.solutions?.length || 0} potential solutions
          </p>
          {analysisResult.analysis_id && (
            <p className="text-xs text-gray-500 mt-1">
              Analysis ID: {analysisResult.analysis_id}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigator.share && navigator.share({
              title: 'Error Analysis Results',
              text: `Problem: ${analysisResult.error_detected}`,
            })}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <button
            onClick={resetAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Problem Analysis */}
      {analysisResult.error_detected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Problem Analysis</h3>
              <p className="text-blue-800 mb-3">{analysisResult.error_detected}</p>
              
              {/* Analysis metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {analysisResult.category && (
                  <div className="text-center p-3 bg-blue-100 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Category</div>
                    <div className="text-blue-900">{analysisResult.category}</div>
                  </div>
                )}
                {analysisResult.severity && (
                  <div className={`text-center p-3 rounded-lg ${
                    analysisResult.severity === 'Critical' ? 'bg-red-100' :
                    analysisResult.severity === 'High' ? 'bg-orange-100' :
                    analysisResult.severity === 'Medium' ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    <div className={`text-sm font-medium ${
                      analysisResult.severity === 'Critical' ? 'text-red-600' :
                      analysisResult.severity === 'High' ? 'text-orange-600' :
                      analysisResult.severity === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>Severity</div>
                    <div className={`${
                      analysisResult.severity === 'Critical' ? 'text-red-900' :
                      analysisResult.severity === 'High' ? 'text-orange-900' :
                      analysisResult.severity === 'Medium' ? 'text-yellow-900' :
                      'text-green-900'
                    }`}>{analysisResult.severity}</div>
                  </div>
                )}
                {analysisResult.confidence && (
                  <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">Confidence</div>
                    <div className="text-gray-900">{analysisResult.confidence}%</div>
                  </div>
                )}
                {analysisResult.estimated_impact && (
                  <div className="text-center p-3 bg-purple-100 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Impact</div>
                    <div className="text-purple-900 text-sm">{analysisResult.estimated_impact}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solutions */}
      {analysisResult.solutions && analysisResult.solutions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Recommended Solutions</h3>
          <div className="grid gap-4">
            {analysisResult.solutions.map((solution, index) => (
              <SolutionCard key={index} solution={solution} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Prevention Tips and Related Issues */}
      <div className="grid md:grid-cols-2 gap-6">
        {analysisResult.prevention_tips && analysisResult.prevention_tips.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Prevention Tips
            </h4>
            <ul className="space-y-2">
              {analysisResult.prevention_tips.map((tip, index) => (
                <li key={index} className="text-green-800 flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysisResult.related_issues && analysisResult.related_issues.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Related Issues
            </h4>
            <ul className="space-y-2">
              {analysisResult.related_issues.map((issue, index) => (
                <li key={index} className="text-yellow-800">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )

  // Enhanced Solution Card Component to match backend format
  const SolutionCard = ({ solution, index }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">{solution.title}</h4>
            {solution.difficulty && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                solution.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                solution.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {solution.difficulty}
              </span>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">{solution.description}</p>
          
          {solution.steps && solution.steps.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">
                  {solution.steps.length}
                </span>
                Step-by-step Instructions:
              </h5>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                {solution.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Solution metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
            {solution.success_rate && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Success Rate:</span>
                <span className="font-medium text-green-600 flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  {solution.success_rate}
                </span>
              </div>
            )}

            {solution.estimated_time && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Est. Time:</span>
                <span className="font-medium text-blue-600 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {solution.estimated_time}
                </span>
              </div>
            )}

            {solution.requirements && solution.requirements.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Requirements:</span>
                <span className="text-sm text-gray-700">
                  {solution.requirements.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {solution.warnings && solution.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h6 className="text-sm font-medium text-yellow-800 mb-1">Warnings:</h6>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {solution.warnings.map((warning, wIndex) => (
                      <li key={wIndex}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sources */}
          {solution.sources && solution.sources.length > 0 && (
            <div className="mt-3">
              <h6 className="text-sm font-medium text-gray-900 mb-2">Sources:</h6>
              <div className="space-y-1">
                {solution.sources.map((source, sIndex) => (
                  <a
                    key={sIndex}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>{source.title}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      source.type === 'official' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {source.type}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => {
              setBookmarkedSolutions(prev => {
                const newSet = new Set(prev)
                if (newSet.has(index)) {
                  newSet.delete(index)
                } else {
                  newSet.add(index)
                }
                return newSet
              })
            }}
            className={`p-2 rounded-lg transition-colors ${
              bookmarkedSolutions.has(index)
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Bookmark solution"
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(solution.description)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Copy solution"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Feedback */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Was this solution helpful?</span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSolutionFeedback(prev => ({
                  ...prev,
                  [index]: { ...prev[index], helpful: true }
                }))
              }}
              className={`p-2 rounded-lg transition-colors ${
                solutionFeedback[index]?.helpful === true
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
              }`}
              title="Mark as helpful"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setSolutionFeedback(prev => ({
                  ...prev,
                  [index]: { ...prev[index], helpful: false }
                }))
              }}
              className={`p-2 rounded-lg transition-colors ${
                solutionFeedback[index]?.helpful === false
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
              }`}
              title="Mark as not helpful"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Keeping all other page components the same...
  // Community Page placeholder (ready for integration)
  const CommunityPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in to be notified
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // Keep existing HowItWorksPage, PricingPage, and HelpPage implementations...
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
          <button
            onClick={(e) => handleNavigation('upload', e)}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Try It Now
          </button>
        </div>
      </div>
    </div>
  )

  // Enhanced Pricing Page
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
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 relative"
          >
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
            
            <button
              onClick={(e) => {
                if (!isAuthenticated) {
                  setShowSignInModal(true)
                } else {
                  handleNavigation('upload', e)
                }
              }}
              className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
            >
              Get Started
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative transform scale-105"
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
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
            
            <button
              onClick={() => {
                alert('Pro upgrade coming soon! Contact support for early access.')
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Crown className="h-5 w-5" />
              <span>Upgrade to Pro</span>
            </button>
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
            
            <button
              onClick={() => {
                alert('Contact our sales team for enterprise pricing and features!')
              }}
              className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Contact Sales</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )

  // Enhanced Help Page
  const HelpPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600">Find answers to common questions and get support</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What types of errors can you analyze?</h3>
              <p className="text-gray-600">
                Our AI can analyze virtually any type of error including Windows blue screens, application crashes, 
                browser errors, mobile app issues, and more. Simply upload a screenshot and we'll do the rest.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How accurate are the solutions?</h3>
              <p className="text-gray-600">
                Our AI has a 95% success rate in providing helpful solutions. Each solution includes difficulty 
                ratings and success probabilities to help you choose the best approach.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is my data secure?</h3>
              <p className="text-gray-600">
                Yes, we take privacy seriously. Your uploaded images are processed securely and are not stored 
                permanently on our servers. All analysis is done in real-time.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I save my analysis results?</h3>
              <p className="text-gray-600">
                With a Pro account, you can export your analysis results in multiple formats and bookmark 
                solutions for future reference.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Need more help?</h3>
              <p className="text-gray-600 mb-4">
                If you can't find the answer you're looking for, our support team is here to help.
              </p>
              <button
                onClick={() => {
                  alert('Support contact form coming soon!')
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Export Modal
  const ExportModal = () => (
    <AnimatePresence>
      {showExportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowExportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Export Results</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!analysisResult) return
                  const data = {
                    analysis_id: analysisResult.analysis_id,
                    timestamp: analysisResult.timestamp || new Date().toISOString(),
                    problem: analysisResult.error_detected,
                    category: analysisResult.category,
                    confidence: analysisResult.confidence,
                    severity: analysisResult.severity,
                    solutions: analysisResult.solutions,
                    prevention_tips: analysisResult.prevention_tips,
                    related_issues: analysisResult.related_issues,
                    context: additionalInfo
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `error-analysis-${analysisResult.analysis_id || Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  setShowExportModal(false)
                }}
                className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">JSON Format</div>
                <div className="text-sm text-gray-600">Machine-readable format for developers</div>
              </button>
              
              <button
                onClick={() => {
                  if (!analysisResult) return
                  let text = `Error Analysis Report\n`
                  text += `Generated: ${new Date().toLocaleString()}\n`
                  if (analysisResult.analysis_id) text += `Analysis ID: ${analysisResult.analysis_id}\n`
                  text += `\nProblem: ${analysisResult.error_detected}\n`
                  if (analysisResult.category) text += `Category: ${analysisResult.category}\n`
                  if (analysisResult.severity) text += `Severity: ${analysisResult.severity}\n`
                  if (analysisResult.confidence) text += `Confidence: ${analysisResult.confidence}%\n`
                  text += `\nSolutions:\n`
                  analysisResult.solutions?.forEach((solution, index) => {
                    text += `${index + 1}. ${solution.title}\n`
                    text += `   Description: ${solution.description}\n`
                    if (solution.difficulty) text += `   Difficulty: ${solution.difficulty}\n`
                    if (solution.success_rate) text += `   Success Rate: ${solution.success_rate}\n`
                    if (solution.estimated_time) text += `   Estimated Time: ${solution.estimated_time}\n`
                    text += `\n`
                  })
                  
                  if (analysisResult.prevention_tips?.length > 0) {
                    text += `Prevention Tips:\n`
                    analysisResult.prevention_tips.forEach((tip, index) => {
                      text += `${index + 1}. ${tip}\n`
                    })
                    text += `\n`
                  }
                  
                  const blob = new Blob([text], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `error-analysis-${analysisResult.analysis_id || Date.now()}.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                  setShowExportModal(false)
                }}
                className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Text Format</div>
                <div className="text-sm text-gray-600">Human-readable format for sharing</div>
              </button>
            </div>
            
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'upload' && <UploadPage />}
        {currentPage === 'community' && <CommunityPage />}
        {currentPage === 'how-it-works' && <HowItWorksPage />}
        {currentPage === 'pricing' && <PricingPage />}
        {currentPage === 'help' && <HelpPage />}
      </main>

      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
      <ExportModal />
    </div>
  )
}

export default App