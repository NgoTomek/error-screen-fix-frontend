// src/lib/api.js - Centralized API service

import { getCurrentUserToken } from './firebase'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082'

// Helper function to get auth headers
const getAuthHeaders = async () => {
  try {
    const token = await getCurrentUserToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  } catch (error) {
    console.error('Error getting auth headers:', error)
    return {
      'Content-Type': 'application/json'
    }
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    error.status = response.status
    error.details = errorData.details
    throw error
  }
  return response.json()
}

// Health check
export const healthCheck = async () => {
  try {
    console.log('Checking backend health...')
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      console.log('Backend is healthy ✅')
      return true
    } else {
      console.warn('Backend health check failed')
      return false
    }
  } catch (error) {
    console.warn('Backend not available:', error.message)
    return false
  }
}

// Authentication APIs
export const authAPI = {
  // Register user with backend
  register: async (userData) => {
    console.log('Registering user with backend:', userData)
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        displayName: userData.displayName || '',
        username: userData.username || ''
      })
    })
    return handleResponse(response)
  },

  // Get user profile
  getProfile: async () => {
    console.log('Getting user profile from backend')
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Update user profile
  updateProfile: async (userData) => {
    console.log('Updating user profile:', userData)
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  }
}

// Error Analysis API
export const analysisAPI = {
  // Analyze error from image
  analyzeError: async (imageData, context = '') => {
    console.log('Sending error analysis request to backend')
    console.log('Image data length:', imageData.length)
    console.log('Context:', context)
    
    const response = await fetch(`${API_BASE_URL}/api/analyze-error`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        image: imageData, // Base64 image data
        context: context || undefined
      })
    })
    
    const result = await handleResponse(response)
    console.log('Analysis result received:', result)
    return result
  }
}

// Community APIs
export const communityAPI = {
  // Get community solutions
  getSolutions: async (params = {}) => {
    console.log('Getting community solutions:', params)
    const queryParams = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/api/community/solutions${queryParams ? `?${queryParams}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Share a solution
  shareSolution: async (solutionData) => {
    console.log('Sharing solution:', solutionData)
    const response = await fetch(`${API_BASE_URL}/api/community/solutions`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(solutionData)
    })
    return handleResponse(response)
  },

  // Vote on a solution
  voteSolution: async (solutionId, isUpvote) => {
    console.log('Voting on solution:', solutionId, isUpvote ? 'upvote' : 'downvote')
    const response = await fetch(`${API_BASE_URL}/api/community/solutions/${solutionId}/vote`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ isUpvote })
    })
    return handleResponse(response)
  },

  // Bookmark a solution
  bookmarkSolution: async (solutionId) => {
    console.log('Bookmarking solution:', solutionId)
    const response = await fetch(`${API_BASE_URL}/api/community/solutions/${solutionId}/bookmark`, {
      method: 'POST',
      headers: await getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Add comment to solution
  addComment: async (solutionId, commentData) => {
    console.log('Adding comment to solution:', solutionId, commentData)
    const response = await fetch(`${API_BASE_URL}/api/community/solutions/${solutionId}/comments`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(commentData)
    })
    return handleResponse(response)
  }
}

// Test API connectivity
export const testConnection = async () => {
  console.log('Testing API connection...')
  
  try {
    // Test health endpoint
    const isHealthy = await healthCheck()
    
    if (!isHealthy) {
      return {
        success: false,
        message: 'Backend is not responding',
        details: 'Health check failed'
      }
    }

    console.log('API connection test successful ✅')
    return {
      success: true,
      message: 'Backend connection successful',
      baseUrl: API_BASE_URL
    }
  } catch (error) {
    console.error('API connection test failed:', error)
    return {
      success: false,
      message: 'Failed to connect to backend',
      details: error.message
    }
  }
}

// Error handling utility
export const isAPIError = (error) => {
  return error && typeof error.status === 'number'
}

export const getErrorMessage = (error) => {
  if (isAPIError(error)) {
    switch (error.status) {
      case 400:
        return error.details ? `Invalid input: ${JSON.stringify(error.details)}` : 'Invalid request data'
      case 401:
        return 'Please sign in to continue'
      case 403:
        return 'You do not have permission to perform this action'
      case 404:
        return 'Resource not found'
      case 409:
        return 'This resource already exists'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.message || 'An unexpected error occurred'
    }
  }
  return error.message || 'An error occurred'
}

// Export API URLs for reference
export const API_URLS = {
  BASE: API_BASE_URL,
  HEALTH: `${API_BASE_URL}/health`,
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`
  },
  ANALYSIS: `${API_BASE_URL}/api/analyze-error`,
  COMMUNITY: {
    SOLUTIONS: `${API_BASE_URL}/api/community/solutions`
  }
}