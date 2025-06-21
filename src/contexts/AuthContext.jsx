// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react'
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
  subscribeToAuthState,
  subscribeToUserProfile,
  resendVerificationEmail,
  incrementAnalysisCount
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
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        // Get user profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          setUserProfile(profile)
          
          // Register/login with backend if available
          try {
            const token = await getCurrentUserToken()
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
            
            const response = await fetch(`${apiUrl}/api/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (!response.ok) {
              console.warn('Backend login failed - continuing with frontend only')
            }
          } catch (backendError) {
            console.warn('Backend not available - continuing with frontend only')
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setError('Failed to load user profile')
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Subscribe to user profile changes
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
        setUserProfile(profile)
      })
      
      return () => unsubscribe()
    }
  }, [user?.uid])

  // Auth functions
  const register = async (email, password, displayName) => {
    try {
      setError(null)
      const firebaseUser = await createUser(email, password, displayName)
      
      // Try to register with backend
      try {
        const token = await firebaseUser.getIdToken()
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
        
        const response = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ displayName })
        })
        
        if (!response.ok) {
          console.warn('Backend registration failed - continuing with frontend only')
        }
      } catch (backendError) {
        console.warn('Backend not available - continuing with frontend only')
      }
      
      return firebaseUser
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      return await signIn(email, password)
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      setError(null)
      return await signInWithGoogle()
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await logOut()
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const forgotPassword = async (email) => {
    try {
      setError(null)
      await resetPassword(email)
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const updateProfile = async (data) => {
    try {
      setError(null)
      
      // Update Firebase profile
      await updateUserProfile(user.uid, data)
      
      // Try to update backend profile
      try {
        const token = await getCurrentUserToken()
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
        
        const response = await fetch(`${apiUrl}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          console.warn('Backend profile update failed')
        }
      } catch (backendError) {
        console.warn('Backend not available for profile update')
      }
      
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const resendVerification = async () => {
    try {
      setError(null)
      const sent = await resendVerificationEmail()
      return sent
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const checkUsernameAvailability = async (username) => {
    try {
      // First check Firebase
      const firebaseAvailable = await import('@/lib/firebase').then(
        module => module.checkUsernameAvailability(username)
      )
      
      if (!firebaseAvailable) {
        return false
      }

      // Then check backend if available
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
        const response = await fetch(`${apiUrl}/api/auth/check-username`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        })
        
        if (response.ok) {
          const data = await response.json()
          return data.available
        }
      } catch (backendError) {
        console.warn('Backend username check not available')
      }
      
      return firebaseAvailable
    } catch (error) {
      throw error
    }
  }

  const getAuthHeader = async () => {
    if (user) {
      const token = await getCurrentUserToken()
      return {
        'Authorization': `Bearer ${token}`
      }
    }
    return {}
  }

  const trackAnalysis = async () => {
    if (user?.uid) {
      try {
        await incrementAnalysisCount(user.uid)
      } catch (error) {
        console.error('Failed to track analysis:', error)
      }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    updateProfile,
    resendVerification,
    checkUsernameAvailability,
    getAuthHeader,
    trackAnalysis,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    isPro: userProfile?.subscription === 'pro' || userProfile?.subscription === 'enterprise',
    isAdmin: userProfile?.role === 'admin',
    isModerator: userProfile?.role === 'moderator' || userProfile?.role === 'admin',
    analysisCount: userProfile?.analysisCount || 0,
    analysisLimit: userProfile?.subscription === 'free' ? 5 : Infinity
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
