// src/contexts/AuthContext.jsx - Enhanced with better error handling and user experience

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { 
  auth, 
  db,
  createUser, 
  signIn, 
  signInWithGoogle, 
  logOut,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getCurrentUserToken,
  refreshUserToken,
  subscribeToAuthState,
  subscribeToUserProfile,
  resendVerificationEmail,
  incrementAnalysisCount,
  getAuthErrorMessage
} from '@/lib/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000) // Clear after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [error])

  // Subscribe to auth state changes
  useEffect(() => {
    console.log('🔄 Setting up auth state listener')
    
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser?.email || 'signed out')
      
      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          
          // Get user profile from Firestore
          try {
            const profile = await getUserProfile(firebaseUser.uid)
            console.log('👤 User profile loaded:', profile?.displayName)
            setUserProfile(profile)
            
            // Update email verification status if it changed
            if (profile && firebaseUser.emailVerified !== profile.emailVerified) {
              console.log('📧 Updating email verification status')
              await updateUserProfile(firebaseUser.uid, {
                emailVerified: firebaseUser.emailVerified
              })
            }
            
            // Register/sync with backend if available
            await syncWithBackend(firebaseUser, profile)
          } catch (profileError) {
            console.error('❌ Error fetching user profile:', profileError)
            setError('Failed to load user profile')
          }
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error)
        setError('Authentication error occurred')
      } finally {
        setLoading(false)
        setAuthReady(true)
      }
    })

    return () => {
      console.log('🛑 Cleaning up auth state listener')
      unsubscribe()
    }
  }, [])

  // Subscribe to user profile changes
  useEffect(() => {
    if (user?.uid) {
      console.log('👂 Setting up profile listener for:', user.uid)
      
      const unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
        console.log('🔄 Profile updated:', profile?.displayName)
        setUserProfile(profile)
      })
      
      return () => {
        console.log('🛑 Cleaning up profile listener')
        unsubscribe()
      }
    }
  }, [user?.uid])

  // Sync with backend (optional)
  const syncWithBackend = async (firebaseUser, profile) => {
    try {
      const token = await getCurrentUserToken()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
      
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: profile?.username || '',
          displayName: profile?.displayName || firebaseUser.displayName || ''
        })
      })
      
      if (response.ok) {
        const backendData = await response.json()
        console.log('✅ Backend sync successful:', backendData.user?.id)
      } else {
        console.warn('⚠️ Backend sync failed - continuing with frontend only')
      }
    } catch (backendError) {
      console.warn('⚠️ Backend not available:', backendError.message)
    }
  }

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auth functions with enhanced error handling
  const register = async (email, password, displayName) => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('📝 Registering user:', email)
      
      // Validate inputs
      if (!email?.trim()) {
        throw new Error('Email address is required')
      }
      
      if (!password) {
        throw new Error('Password is required')
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }
      
      if (!displayName?.trim()) {
        throw new Error('Display name is required')
      }
      
      const firebaseUser = await createUser(email.trim(), password, displayName.trim())
      console.log('✅ User registration successful:', firebaseUser.email)
      
      return {
        success: true,
        user: firebaseUser,
        message: 'Account created successfully! Please check your email to verify your account.'
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
      const message = getAuthErrorMessage(error.code) || error.message
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('🔐 Signing in user:', email)
      
      // Validate inputs
      if (!email?.trim()) {
        throw new Error('Email address is required')
      }
      
      if (!password) {
        throw new Error('Password is required')
      }
      
      const firebaseUser = await signIn(email.trim(), password)
      console.log('✅ Sign in successful:', firebaseUser.email)
      
      return {
        success: true,
        user: firebaseUser,
        message: 'Welcome back!'
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      const message = getAuthErrorMessage(error.code) || error.message
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('🔍 Starting Google sign in')
      
      const firebaseUser = await signInWithGoogle()
      console.log('✅ Google sign in successful:', firebaseUser.email)
      
      return {
        success: true,
        user: firebaseUser,
        message: 'Welcome!'
      }
    } catch (error) {
      console.error('❌ Google login error:', error)
      const message = getAuthErrorMessage(error.code) || error.message
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      console.log('👋 Signing out user')
      
      await logOut()
      console.log('✅ Sign out successful')
      
      return {
        success: true,
        message: 'You have been signed out successfully'
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
      const message = 'Failed to sign out. Please try again.'
      setError(message)
      throw new Error(message)
    }
  }

  const forgotPassword = async (email) => {
    try {
      setError(null)
      
      console.log('📧 Sending password reset for:', email)
      
      if (!email?.trim()) {
        throw new Error('Email address is required')
      }
      
      await resetPassword(email.trim())
      console.log('✅ Password reset email sent')
      
      return {
        success: true,
        message: 'Password reset email sent! Check your inbox and follow the instructions.'
      }
    } catch (error) {
      console.error('❌ Password reset error:', error)
      const message = getAuthErrorMessage(error.code) || error.message
      setError(message)
      throw new Error(message)
    }
  }

  const updateProfile = async (data) => {
    try {
      setError(null)
      
      if (!user?.uid) {
        throw new Error('No user is currently signed in')
      }
      
      console.log('🔄 Updating profile:', data)
      
      // Validate data
      if (data.displayName !== undefined && !data.displayName?.trim()) {
        throw new Error('Display name cannot be empty')
      }
      
      // Clean up data
      const updateData = {}
      Object.keys(data).forEach(key => {
        const value = data[key]
        if (value !== undefined && value !== null) {
          updateData[key] = typeof value === 'string' ? value.trim() : value
        }
      })
      
      await updateUserProfile(user.uid, updateData)
      
      console.log('✅ Profile updated successfully')
      
      return {
        success: true,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      const message = error.message || 'Failed to update profile'
      setError(message)
      throw new Error(message)
    }
  }

  const resendVerification = async () => {
    try {
      setError(null)
      
      if (!user) {
        throw new Error('No user is currently signed in')
      }
      
      if (user.emailVerified) {
        return {
          success: false,
          message: 'Your email is already verified'
        }
      }
      
      console.log('📧 Resending verification email')
      const result = await resendVerificationEmail()
      
      console.log('✅ Verification email sent')
      
      return {
        success: result.success,
        message: result.message || 'Verification email sent! Please check your inbox.'
      }
    } catch (error) {
      console.error('❌ Resend verification error:', error)
      const message = getAuthErrorMessage(error.code) || error.message
      setError(message)
      throw new Error(message)
    }
  }

  const getAuthHeader = async () => {
    try {
      if (user) {
        const token = await getCurrentUserToken()
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
      return {
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.error('❌ Error getting auth header:', error)
      return {
        'Content-Type': 'application/json'
      }
    }
  }

  const trackAnalysis = async () => {
    try {
      if (user?.uid) {
        console.log('📊 Tracking analysis')
        const newCount = await incrementAnalysisCount(user.uid)
        console.log('✅ Analysis tracked, new count:', newCount)
        return newCount
      }
    } catch (error) {
      console.error('❌ Failed to track analysis:', error)
      // Don't throw error for analytics
    }
  }

  const refreshAuth = async () => {
    try {
      if (user) {
        console.log('🔄 Refreshing authentication token')
        await refreshUserToken()
        console.log('✅ Authentication token refreshed')
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Failed to refresh auth:', error)
      return false
    }
  }

  // Computed values
  const isAuthenticated = !!user
  const isEmailVerified = user?.emailVerified || false
  const isPro = userProfile?.subscription === 'pro' || userProfile?.subscription === 'enterprise'
  const isAdmin = userProfile?.role === 'admin'
  const isModerator = userProfile?.role === 'moderator' || userProfile?.role === 'admin'
  const analysisCount = userProfile?.analysisCount || 0
  const analysisLimit = userProfile?.subscription === 'free' ? 5 : 
                       (userProfile?.subscription === 'pro' || userProfile?.subscription === 'enterprise') ? 
                       Infinity : 5

  // Context value
  const value = {
    // State
    user,
    userProfile,
    loading,
    error,
    authReady,
    
    // Actions
    register,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    updateProfile,
    resendVerification,
    getAuthHeader,
    trackAnalysis,
    refreshAuth,
    clearError,
    
    // Computed
    isAuthenticated,
    isEmailVerified,
    isPro,
    isAdmin,
    isModerator,
    analysisCount,
    analysisLimit,
    
    // Helper flags
    canAnalyze: !isAuthenticated ? analysisCount < 5 : (isPro ? true : analysisCount < analysisLimit),
    needsEmailVerification: isAuthenticated && !isEmailVerified,
    shouldUpgrade: isAuthenticated && !isPro && analysisCount >= analysisLimit
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}