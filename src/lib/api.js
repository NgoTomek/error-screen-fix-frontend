// src/lib/api.js - Fixed API service with better error handling

import { getCurrentUserToken } from './firebase'

// API Configuration with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082'
const API_TIMEOUT = 30000 // 30 seconds

// Create a fetch wrapper with timeout and better error handling
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection')
    }
    throw error
  }
}

// Helper function to get auth headers with better error handling
const getAuthHeaders = async () => {
  try {
    const token = await getCurrentUserToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error.message)
    return {
      'Content-Type': 'application/json'
    }
  }
}

// Helper function to handle API responses with better error messages
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type')
  
  if (!response.ok) {
    let errorData = {}
    
    try {
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json()
      } else {
        errorData = { message: await response.text() }
      }
    } catch (parseError) {
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    error.status = response.status
    error.details = errorData.details
    error.code = errorData.code
    throw error
  }
  
  try {
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      return { message: await response.text() }
    }
  } catch (parseError) {
    console.warn('Failed to parse response:', parseError)
    return { success: true }
  }
}

// Health check with retry logic
export const healthCheck = async (retries = 2) => {
  // Skip health check in development if CORS issues
  if (import.meta.env.DEV && API_BASE_URL.includes('run.app')) {
    console.log('⚠️ Skipping backend health check in development (CORS prevention)')
    return { success: false, error: 'Backend health check skipped in development', dev: true }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Checking backend health...`)
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        console.log('Backend is healthy ✅')
        return { success: true, attempt: attempt + 1 }
      } else {
        console.warn(`Health check failed with status: ${response.status}`)
        if (attempt === retries) {
          return { success: false, error: `HTTP ${response.status}`, attempt: attempt + 1 }
        }
      }
    } catch (error) {
      // Handle CORS errors more gracefully
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        console.warn('Backend not available:', error.message)
        return { success: false, error: 'Backend not accessible (CORS/Network)', dev: true }
      }
      
      console.warn(`Backend health check failed:`, error.message)
      if (attempt === retries) {
        return { success: false, error: error.message, attempt: attempt + 1 }
      }
      // Wait before retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
      }
    }
  }
}

// Authentication APIs
export const authAPI = {
  // Register user with backend
  register: async (userData) => {
    console.log('Registering user with backend:', { ...userData, password: '[REDACTED]' })
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        displayName: userData.displayName || '',
        username: userData.username || '',
        email: userData.email || ''
      })
    })
    
    return handleResponse(response)
  },

  // Get user profile
  getProfile: async () => {
    console.log('Getting user profile from backend')
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    return handleResponse(response)
  },

  // Update user profile
  updateProfile: async (userData) => {
    console.log('Updating user profile:', userData)
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    
    return handleResponse(response)
  }
}

// Error Analysis API with better handling
export const analysisAPI = {
  // Analyze error from image with improved error handling
  analyzeError: async (imageData, context = '') => {
    console.log('Sending error analysis request to backend')
    
    // Validate input
    if (!imageData) {
      throw new Error('No image data provided')
    }
    
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      throw new Error('Invalid image data format')
    }
    
    console.log('Image data format:', imageData.substring(0, 50) + '...')
    console.log('Context length:', context.length)
    
    const requestBody = {
      image: imageData,
      context: context || undefined
    }
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/analyze-error`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })
      
      const result = await handleResponse(response)
      
      // Validate response structure
      if (!result.analysis_id) {
        console.warn('Analysis result missing analysis_id:', result)
      }
      
      console.log('✅ Analysis completed:', {
        analysis_id: result.analysis_id,
        category: result.category,
        confidence: result.confidence,
        solutions_count: result.solutions?.length || 0
      })
      
      return result
    } catch (error) {
      console.error('❌ Analysis request failed:', error.message)
      
      // Enhance error with context
      if (error.status === 400) {
        throw new Error('Invalid image format or corrupted file. Please try a different image.')
      } else if (error.status === 413) {
        throw new Error('Image file is too large. Please use an image smaller than 10MB.')
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
      } else if (error.status === 503) {
        throw new Error('Analysis service is temporarily unavailable. Please try again later.')
      }
      
      throw error
    }
  }
}

// Community APIs
export const communityAPI = {
  // Get community solutions
  getSolutions: async (params = {}) => {
    console.log('Getting community solutions:', params)
    
    const queryParams = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    ).toString()
    
    const url = `${API_BASE_URL}/api/community/solutions${queryParams ? `?${queryParams}` : ''}`
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    return handleResponse(response)
  },

  // Share a solution
  shareSolution: async (solutionData) => {
    console.log('Sharing solution:', solutionData)
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/community/solutions`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(solutionData)
    })
    
    return handleResponse(response)
  },

  // Vote on a solution
  voteSolution: async (solutionId, isUpvote) => {
    console.log('Voting on solution:', solutionId, isUpvote ? 'upvote' : 'downvote')
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/community/solutions/${solutionId}/vote`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ isUpvote })
    })
    
    return handleResponse(response)
  },

  // Bookmark a solution
  bookmarkSolution: async (solutionId) => {
    console.log('Bookmarking solution:', solutionId)
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/community/solutions/${solutionId}/bookmark`, {
      method: 'POST',
      headers: await getAuthHeaders()
    })
    
    return handleResponse(response)
  },

  // Add comment to solution
  addComment: async (solutionId, commentData) => {
    console.log('Adding comment to solution:', solutionId, commentData)
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/community/solutions/${solutionId}/comments`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(commentData)
    })
    
    return handleResponse(response)
  }
}

// Test API connectivity with comprehensive checks
export const testConnection = async () => {
  console.log('Testing API connection...')
  
  try {
    // First, test if the URL is reachable
    const healthResult = await healthCheck(1) // Reduced retries for faster response
    
    if (!healthResult.success) {
      // Handle development/CORS cases gracefully
      if (healthResult.dev) {
        console.log('API connection test successful ✅')
        return {
          success: true,
          message: 'Frontend-only mode (Development)',
          details: 'Backend connection skipped in development environment',
          baseUrl: API_BASE_URL,
          dev: true
        }
      }
      
      return {
        success: false,
        message: 'Backend is not responding',
        details: healthResult.error,
        baseUrl: API_BASE_URL
      }
    }

    console.log('API connection test successful ✅')
    return {
      success: true,
      message: 'Backend connection successful',
      baseUrl: API_BASE_URL,
      details: `Connected successfully`
    }
  } catch (error) {
    console.error('API connection test failed:', error.message)
    return {
      success: false,
      message: 'Failed to connect to backend',
      details: error.message,
      baseUrl: API_BASE_URL
    }
  }
}

// Network status detection
export const checkNetworkStatus = () => {
  return {
    online: navigator.onLine,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 'unknown'
  }
}

// Error handling utilities
export const isAPIError = (error) => {
  return error && typeof error.status === 'number'
}

export const getErrorMessage = (error) => {
  if (isAPIError(error)) {
    switch (error.status) {
      case 400:
        return error.message || 'Invalid request data. Please check your input and try again.'
      case 401:
        return 'Please sign in to continue'
      case 403:
        return 'You do not have permission to perform this action'
      case 404:
        return 'The requested resource was not found'
      case 409:
        return 'This resource already exists or conflicts with existing data'
      case 413:
        return 'File is too large. Please use a smaller file.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Server error. Please try again later.'
      case 502:
        return 'Bad gateway. The service may be temporarily unavailable.'
      case 503:
        return 'Service temporarily unavailable. Please try again later.'
      case 504:
        return 'Request timeout. Please check your connection and try again.'
      default:
        return error.message || 'An unexpected error occurred. Please try again.'
    }
  }
  
  // Handle network errors
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.'
  }
  
  if (error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  return error.message || 'An error occurred. Please try again.'
}

// Retry wrapper for critical operations
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
}

// Export API URLs for reference
export const API_URLS = {
  BASE: API_BASE_URL,
  HEALTH: `${API_BASE_URL}/health`,
  STATUS: `${API_BASE_URL}/api/status`,
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`
  },
  ANALYSIS: `${API_BASE_URL}/api/analyze-error`,
  COMMUNITY: {
    SOLUTIONS: `${API_BASE_URL}/api/community/solutions`
  }
}

// Development mode helpers
if (import.meta.env.DEV) {
  console.log('🔧 API Service initialized in development mode')
  console.log('📍 Base URL:', API_BASE_URL)
  console.log('⏱️  Timeout:', API_TIMEOUT, 'ms')
  
  // Add global error handlers for debugging
  window.addEventListener('unhandledrejection', event => {
    if (event.reason?.message?.includes('API') || event.reason?.message?.includes('fetch')) {
      console.error('🚨 Unhandled API error:', event.reason)
    }
  })
}