import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Zap, Shield, Users, CheckCircle, 
  BookOpen, User, LogOut, Download, 
  Share2, Bookmark, Copy, ThumbsUp, ThumbsDown, 
  ExternalLink, AlertTriangle, Menu, X, Home
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import './App.css'

const API_BASE_URL = 'https://8081-insb5rm9i3jxrls3xlp4a-be9ed442.manusvm.computer'

function App() {
  // State management
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedFile, setSelectedFile] = useState(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [bookmarkedSolutions, setBookmarkedSolutions] = useState(new Set())
  const [solutionFeedback, setSolutionFeedback] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const fileInputRef = useRef(null)

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
    console.log('Upload area clicked, triggering file input...')
    if (fileInputRef.current) {
      fileInputRef.current.click()
      console.log('File input click triggered')
    } else {
      console.error('File input ref not found')
    }
  }, [])

  const handleFileSelect = useCallback((event) => {
    console.log('File select event triggered:', event.target.files)
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      console.log('Valid image file selected:', file.name)
      setSelectedFile(file)
    } else {
      console.log('Invalid file type or no file selected')
    }
  }, [])

  const handleDrop = useCallback((event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
    }
  }, [])

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
  }, [])

  const handleAdditionalInfoChange = useCallback((event) => {
    setAdditionalInfo(event.target.value)
  }, [])

  const analyzeError = useCallback(async (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!selectedFile) return

    setIsAnalyzing(true)
    try {
      const base64Image = await convertToBase64(selectedFile)
      
      const response = await fetch(`${API_BASE_URL}/api/analyze-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          context: additionalInfo
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      setAnalysisResult(result)
    } catch (error) {
      console.error('Error analyzing image:', error)
      setAnalysisResult({
        error_detected: 'Failed to analyze the error. Please try again.',
        analysis_id: 'error_' + Date.now(),
        timestamp: new Date().toISOString(),
        category: 'Analysis Error',
        confidence: 0,
        severity: 'Medium',
        estimated_impact: 'Unable to process the image',
        solutions: []
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedFile, additionalInfo, convertToBase64])

  const resetAnalysis = useCallback((event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    setSelectedFile(null)
    setAdditionalInfo('')
    setAnalysisResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const toggleBookmark = useCallback((solutionIndex) => {
    setBookmarkedSolutions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(solutionIndex)) {
        newSet.delete(solutionIndex)
      } else {
        newSet.add(solutionIndex)
      }
      return newSet
    })
  }, [])

  const handleFeedback = useCallback((solutionIndex, type, value) => {
    setSolutionFeedback(prev => ({
      ...prev,
      [solutionIndex]: {
        ...prev[solutionIndex],
        [type]: value
      }
    }))
  }, [])

  const exportResults = useCallback((format) => {
    if (!analysisResult) return

    const data = {
      timestamp: new Date().toISOString(),
      problem_description: analysisResult.error_detected,
      solutions: analysisResult.solutions,
      additional_info: additionalInfo
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'error-analysis.json'
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'text') {
      let text = `Error Analysis Report\n`
      text += `Generated: ${new Date().toLocaleString()}\n\n`
      text += `Problem Description:\n${analysisResult.error_detected}\n\n`
      text += `Solutions:\n`
      analysisResult.solutions.forEach((solution, index) => {
        text += `${index + 1}. ${solution.title}\n`
        text += `   ${solution.description}\n\n`
      })
      
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'error-analysis.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowExportModal(false)
  }, [analysisResult, additionalInfo])

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const shareResults = useCallback(async () => {
    if (!analysisResult) return

    const shareData = {
      title: 'Error Analysis Results',
      text: `Problem: ${analysisResult.error_detected}\n\nFound ${analysisResult.solutions.length} solutions.`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await copyToClipboard(shareData.text)
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }, [analysisResult, copyToClipboard])

  // Navigation handlers with proper event handling
  const handleNavigation = useCallback((page, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }, [])

  const handleSignIn = useCallback((event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setShowSignInModal(true)
  }, [])

  const handleSignInSubmit = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsSignedIn(true)
    setShowSignInModal(false)
  }, [])

  const handleSignOut = useCallback((event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setIsSignedIn(false)
  }, [])

  const handleModalClose = useCallback((event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setShowSignInModal(false)
    setShowExportModal(false)
  }, [])

  // Header Component
  const Header = () => (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={(e) => handleNavigation('home', e)}
              className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Zap className="h-6 w-6" />
              <span>Error Screen Fix</span>
            </button>
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
            <button
              onClick={(e) => handleNavigation('help', e)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'help' 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:text-teal-600'
              }`}
            >
              Help
            </button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Welcome back!</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMobileMenuOpen(!mobileMenuOpen)
              }}
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
                <button
                  onClick={(e) => handleNavigation('help', e)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === 'help' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-gray-700 hover:text-teal-600'
                  }`}
                >
                  Help
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )

  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Error Fixer?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Analysis</h3>
              <p className="text-gray-600">
                Get comprehensive error analysis and multiple solutions in under 30 seconds
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">95% Success Rate</h3>
              <p className="text-gray-600">
                Our AI has successfully resolved over 95% of submitted error cases
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Solutions</h3>
              <p className="text-gray-600">
                Solutions backed by credible sources and expert knowledge bases
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )

  // Upload Page Component
  const UploadPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Error Screenshot</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {!analysisResult ? (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={handleUploadClick}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">
                  {selectedFile ? selectedFile.name : 'Drop your error screenshot here'}
                </p>
                <p className="text-sm text-gray-500">or click to browse files</p>
                <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG, GIF, WebP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Additional Information */}
              <div>
                <label htmlFor="additional-info" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additional-info"
                  value={additionalInfo}
                  onChange={handleAdditionalInfoChange}
                  placeholder="Describe what you were doing when the error occurred, any error codes, or other relevant details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={analyzeError}
                  disabled={!selectedFile || isAnalyzing}
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
            </div>
          ) : (
            <AnalysisResults />
          )}
        </div>
      </div>
    </div>
  )

  // Analysis Results Component
  const AnalysisResults = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
          <p className="text-gray-600">
            Found {analysisResult.solutions?.length || 0} potential solutions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowExportModal(true)
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              shareResults()
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <button
            onClick={(e) => handleNavigation('upload', e)}
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
            <AlertTriangle className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Problem Analysis</h3>
              <p className="text-blue-800">{analysisResult.error_detected}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {analysisResult.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Error</h3>
              <p className="text-red-800">{analysisResult.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Solutions */}
      {analysisResult.solutions && analysisResult.solutions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Recommended Solutions</h3>
          {analysisResult.solutions.map((solution, index) => (
            <SolutionCard key={index} solution={solution} index={index} />
          ))}
        </div>
      )}
    </div>
  )

  // Solution Card Component
  const SolutionCard = ({ solution, index }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{solution.title}</h4>
          <p className="text-gray-600 mb-3">{solution.description}</p>
          
          {solution.steps && solution.steps.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2">Steps:</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {solution.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {solution.difficulty && (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-500">Difficulty:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                solution.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                solution.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {solution.difficulty}
              </span>
            </div>
          )}

          {solution.success_probability && (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-500">Success Rate:</span>
              <span className="text-sm font-medium text-green-600">{solution.success_probability}</span>
            </div>
          )}

          {solution.source && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Source:</span>
              <a
                href={solution.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>{solution.source}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleBookmark(index)
            }}
            className={`p-2 rounded-lg transition-colors ${
              bookmarkedSolutions.has(index)
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              copyToClipboard(solution.description)
            }}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
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
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleFeedback(index, 'helpful', true)
              }}
              className={`p-2 rounded-lg transition-colors ${
                solutionFeedback[index]?.helpful === true
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleFeedback(index, 'helpful', false)
              }}
              className={`p-2 rounded-lg transition-colors ${
                solutionFeedback[index]?.helpful === false
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // How It Works Page
  const HowItWorksPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-xl text-gray-600">Get your errors fixed in 3 simple steps</p>
        </div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-8"
          >
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">1. Upload Your Error Screenshot</h3>
              <p className="text-gray-600 text-lg">
                Simply drag and drop or click to upload a screenshot of any error message, blue screen, or application crash.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-8"
          >
            <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">2. AI Analyzes the Problem</h3>
              <p className="text-gray-600 text-lg">
                Our advanced AI examines your error, identifies the root cause, and generates multiple solution approaches tailored to your specific issue.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center space-x-8"
          >
            <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">3. Get Comprehensive Solutions</h3>
              <p className="text-gray-600 text-lg">
                Receive 3-8 detailed solutions with step-by-step instructions, difficulty ratings, and links to official documentation.
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

  // Pricing Page
  const PricingPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that works best for you</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
            <p className="text-gray-600 mb-6">Perfect for occasional use</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>5 error analyses per month</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Basic AI solutions</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Community support</span>
              </li>
            </ul>
            
            <button
              onClick={(e) => handleNavigation('upload', e)}
              className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">$19</div>
            <p className="text-gray-600 mb-6">per month</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Unlimited error analyses</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Advanced AI solutions</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Export & sharing features</span>
              </li>
            </ul>
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                alert('Pro upgrade coming soon!')
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">$99</div>
            <p className="text-gray-600 mb-6">per month</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Dedicated support</span>
              </li>
            </ul>
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                alert('Contact our sales team for enterprise pricing!')
              }}
              className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Help Page
  const HelpPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600">Find answers to common questions</p>
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
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

  // Sign In Modal
  const SignInModal = () => (
    <AnimatePresence>
      {showSignInModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleModalClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600 mb-6">Access your account to save solutions and track progress</p>
            
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  alert('Sign up coming soon!')
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Sign up
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
          onClick={handleModalClose}
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  exportResults('json')
                }}
                className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">JSON Format</div>
                <div className="text-sm text-gray-600">Machine-readable format for developers</div>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  exportResults('text')
                }}
                className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Text Format</div>
                <div className="text-sm text-gray-600">Human-readable format for sharing</div>
              </button>
            </div>
            
            <button
              onClick={handleModalClose}
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
        {currentPage === 'how-it-works' && <HowItWorksPage />}
        {currentPage === 'pricing' && <PricingPage />}
        {currentPage === 'help' && <HelpPage />}
      </main>

      <SignInModal />
      <ExportModal />
    </div>
  )
}

export default App

