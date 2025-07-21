// src/components/UploadPage.jsx - FIXED VERSION
import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { analysisAPI, getErrorMessage } from '@/lib/api'
import { 
  Upload, CheckCircle, Zap, AlertTriangle, X, 
  Image as ImageIcon, Camera, FileText, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// FIXED: Separate stable component to prevent re-renders
const UploadPage = memo(() => {
  const { 
    user, 
    isAuthenticated, 
    analysisCount, 
    analysisLimit, 
    isPro,
    trackAnalysis
  } = useAuth()

  // FIXED: Proper state management
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [fileValidation, setFileValidation] = useState(null)

  const fileInputRef = useRef(null)
  const dragCounterRef = useRef(0)

  // FIXED: Stable cleanup function
  const cleanupFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setSelectedFile(null)
    setError(null)
    setFileValidation(null)
  }, [previewUrl])

  // FIXED: Enhanced file validation with image checking
  const validateFile = useCallback(async (file) => {
    setError(null)
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    const minSize = 1024 // 1KB minimum

    // Basic checks
    if (!file) throw new Error('No file provided')
    if (file.size < minSize) throw new Error('File is too small. Please select a valid image.')
    if (file.size > maxSize) throw new Error('File is too large. Maximum size is 10MB.')
    if (!validTypes.includes(file.type.toLowerCase())) {
      throw new Error('Invalid file type. Please select JPG, PNG, GIF, or WebP images only.')
    }

    // Check if it's actually an image by trying to load it
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        // Check dimensions
        if (img.width < 50 || img.height < 50) {
          reject(new Error('Image is too small. Minimum dimensions are 50x50 pixels.'))
          return
        }
        
        if (img.width > 8000 || img.height > 8000) {
          reject(new Error('Image is too large. Maximum dimensions are 8000x8000 pixels.'))
          return
        }
        
        resolve({
          isValid: true,
          dimensions: { width: img.width, height: img.height },
          aspectRatio: (img.width / img.height).toFixed(2)
        })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('File appears to be corrupted or is not a valid image.'))
      }
      
      img.src = url
    })
  }, [])

  // FIXED: Non-blocking base64 conversion with progress
  const convertToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        resolve(event.target.result)
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress * 0.3) // 30% for file reading
        }
      }
      
      reader.readAsDataURL(file)
    })
  }, [])

  // FIXED: Comprehensive file processing
  const processFile = useCallback(async (file) => {
    setIsProcessingFile(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      // Step 1: Validate file (20% of progress)
      setUploadProgress(10)
      const validation = await validateFile(file)
      setFileValidation(validation)
      setUploadProgress(20)
      
      // Step 2: Create preview (10% of progress)
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
      setUploadProgress(30)
      
      // Step 3: Set file (final)
      setSelectedFile(file)
      setUploadProgress(100)
      
      console.log('✅ File processed successfully:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        dimensions: `${validation.dimensions.width}x${validation.dimensions.height}`,
        type: file.type
      })
      
    } catch (error) {
      console.error('❌ File processing failed:', error)
      cleanupFile()
      setError(error.message)
    } finally {
      setIsProcessingFile(false)
      setUploadProgress(0)
    }
  }, [validateFile, cleanupFile])

  // FIXED: Simple file selection handler
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }, [processFile])

  // FIXED: Improved drag and drop with proper counter
  const handleDragEnter = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) {
      setDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (event) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current = 0
    setDragOver(false)
    
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      await processFile(file)
    }
  }, [processFile])

  // FIXED: Simple click handler
  const triggerFileUpload = useCallback(() => {
    // Check limits
    if (!isPro && analysisCount >= analysisLimit) {
      setError('You have reached your analysis limit. Please upgrade to Pro for unlimited analyses.')
      return
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [isPro, analysisCount, analysisLimit])

  // FIXED: Stable textarea handler - THIS FIXES THE FOCUS ISSUE
  const handleTextareaChange = useCallback((event) => {
    setAdditionalInfo(event.target.value)
  }, [])

  // FIXED: Analysis function
  const analyzeError = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    if (!isAuthenticated && analysisCount >= 5) {
      setError('Please sign in to continue')
      return
    }

    if (!isPro && analysisCount >= analysisLimit) {
      setError('You have reached your analysis limit. Please upgrade to Pro.')
      return
    }

    setIsAnalyzing(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      // Convert file with progress
      setUploadProgress(20)
      const base64Image = await convertToBase64(selectedFile)
      setUploadProgress(40)

      // Send to API
      setUploadProgress(60)
      const result = await analysisAPI.analyzeError(base64Image, additionalInfo)
      setUploadProgress(90)
      
      setAnalysisResult(result)
      setUploadProgress(100)
      
      // Track analysis
      if (isAuthenticated) {
        await trackAnalysis()
      }
      
      console.log('✅ Analysis completed:', result.analysis_id)
      
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      setError(getErrorMessage(error))
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(0)
    }
  }, [selectedFile, additionalInfo, isAuthenticated, isPro, analysisCount, analysisLimit, trackAnalysis, convertToBase64])

  // FIXED: Reset function with proper cleanup
  const resetAnalysis = useCallback(() => {
    cleanupFile()
    setAdditionalInfo('')
    setAnalysisResult(null)
    setError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [cleanupFile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (analysisResult) {
    return <AnalysisResults result={analysisResult} onReset={resetAnalysis} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Your Error Screenshot
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Get instant AI-powered solutions for any technical error
          </p>
          
          {/* Usage Indicator */}
          {isAuthenticated && (
            <div className="max-w-md mx-auto mb-4">
              <Card className="p-4">
                <div className="flex justify-between items-center text-sm">
                  <span>Analyses used this month:</span>
                  <Badge variant={analysisCount >= analysisLimit && !isPro ? "destructive" : "secondary"}>
                    {analysisCount}/{isPro ? '∞' : analysisLimit}
                  </Badge>
                </div>
                {!isPro && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((analysisCount / analysisLimit) * 100, 100)}%` 
                      }}
                    />
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Main Upload Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="space-y-6">
              
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* File Upload Area */}
              <div className="relative">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="sr-only"
                  aria-describedby="file-upload-description"
                />

                {/* Upload Zone */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 sm:p-12 transition-all duration-200
                    ${dragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : selectedFile 
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    ${isProcessingFile ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
                  `}
                >
                  
                  {isProcessingFile ? (
                    // Processing State
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Processing File...
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Validating and preparing your image
                      </p>
                      {uploadProgress > 0 && (
                        <div className="max-w-xs mx-auto">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  ) : selectedFile ? (
                    // File Selected State
                    <div className="text-center">
                      <div className="grid md:grid-cols-2 gap-6 items-center">
                        {/* Image Preview */}
                        <div className="space-y-4">
                          {previewUrl && (
                            <div className="relative inline-block">
                              <img 
                                src={previewUrl}
                                alt="Selected image preview"
                                className="max-w-full max-h-48 rounded-lg shadow-md mx-auto"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  resetAnalysis()
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                aria-label="Remove selected file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* File Info */}
                        <div className="space-y-3 text-left">
                          <div className="flex items-center text-green-700">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span className="font-medium">File Ready</span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Name:</span> {selectedFile.name}</p>
                            <p><span className="font-medium">Size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p><span className="font-medium">Type:</span> {selectedFile.type}</p>
                            {fileValidation?.dimensions && (
                              <p>
                                <span className="font-medium">Dimensions:</span> {' '}
                                {fileValidation.dimensions.width} × {fileValidation.dimensions.height}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              triggerFileUpload()
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Choose Different File
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Empty State
                    <button
                      onClick={triggerFileUpload}
                      className="w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                      aria-describedby="file-upload-description"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-center space-x-4">
                          <Upload className="h-12 w-12 text-gray-400" />
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                          <Camera className="h-12 w-12 text-gray-400" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Drop your error screenshot here
                          </h3>
                          <p className="text-gray-600 mb-2">
                            or click to browse your files
                          </p>
                          <p className="text-sm text-gray-500" id="file-upload-description">
                            Supports JPG, PNG, GIF, WebP • Max 10MB • Min 50×50px
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Additional Information - FIXED TEXTAREA */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <label 
                    htmlFor="additional-info" 
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
                    <FileText className="h-4 w-4 inline mr-1" />
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additional-info"
                    value={additionalInfo}
                    onChange={handleTextareaChange}
                    placeholder="Describe what you were doing when the error occurred, any error codes, steps to reproduce, or other relevant details that might help with the analysis..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-sm leading-relaxed"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>This helps our AI provide more accurate solutions</span>
                    <span>{additionalInfo.length}/1000</span>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Analyzing Your Error...
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Our AI is examining your screenshot and finding solutions
                        </p>
                      </div>
                      
                      {uploadProgress > 0 && (
                        <div className="max-w-sm mx-auto">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={analyzeError}
                  disabled={!selectedFile || isAnalyzing || isProcessingFile}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze Error
                    </>
                  )}
                </Button>
                
                {selectedFile && (
                  <Button
                    onClick={resetAnalysis}
                    variant="outline"
                    size="lg"
                    disabled={isAnalyzing || isProcessingFile}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Limit Warnings */}
              {!isPro && isAuthenticated && analysisCount >= analysisLimit && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    You've reached your monthly analysis limit. 
                    <Button variant="link" className="ml-1 p-0 h-auto text-orange-800 underline">
                      Upgrade to Pro
                    </Button> for unlimited analyses.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

// Simple Analysis Results Component
const AnalysisResults = memo(({ result, onReset }) => (
  <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
            <Button onClick={onReset} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
          
          {result.error_detected && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Problem Detected:</strong> {result.error_detected}
              </AlertDescription>
            </Alert>
          )}

          {result.solutions && result.solutions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Solutions</h3>
              {result.solutions.map((solution, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-2">{solution.title}</h4>
                    <p className="text-gray-600 mb-4">{solution.description}</p>
                    {solution.steps && (
                      <div>
                        <h5 className="font-medium mb-2">Steps:</h5>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          {solution.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="text-gray-700">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
))

UploadPage.displayName = 'UploadPage'
AnalysisResults.displayName = 'AnalysisResults'

export default UploadPage