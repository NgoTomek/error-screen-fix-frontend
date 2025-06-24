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
      console.log('Auth state changed:', firebaseUser?.email || 'signed out')
      
      if (firebaseUser) {
        setUser(firebaseUser)
        
        // Get user profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          console.log('User profile:', profile)
          setUserProfile(profile)
          
          // Register/login with backend if available
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
            
            if (!response.ok) {
              console.warn('Backend registration failed - continuing with frontend only')
            } else {
              const backendData = await response.json()
              console.log('Backend user registered/logged in:', backendData)
            }
          } catch (backendError) {
            console.warn('Backend not available - continuing with frontend only:', backendError.message)
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
        console.log('Profile updated:', profile)
        setUserProfile(profile)
      })
      
      return () => unsubscribe()
    }
  }, [user?.uid])

  // Auth functions
  const register = async (email, password, displayName) => {
    try {
      setError(null)
      setLoading(true)
      console.log('Registering user:', email)
      
      const firebaseUser = await createUser(email, password, displayName)
      console.log('User created successfully:', firebaseUser.email)
      
      // Try to register with backend
      try {
        const token = await firebaseUser.getIdToken()
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
        
        const response = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            displayName,
            username: '' // Optional username
          })
        })
        
        if (!response.ok) {
          console.warn('Backend registration failed - continuing with frontend only')
        }
      } catch (backendError) {
        console.warn('Backend not available - continuing with frontend only:', backendError.message)
      }
      
      return firebaseUser
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      console.log('Signing in user:', email)
      
      const firebaseUser = await signIn(email, password)
      console.log('Sign in successful:', firebaseUser.email)
      
      return firebaseUser
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log('Signing in with Google')
      
      const firebaseUser = await signInWithGoogle()
      console.log('Google sign in successful:', firebaseUser.email)
      
      return firebaseUser
    } catch (error) {
      console.error('Google login error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      console.log('Signing out user')
      await logOut()
      console.log('Sign out successful')
    } catch (error) {
      console.error('Logout error:', error)
      setError(error.message)
      throw error
    }
  }

  const forgotPassword = async (email) => {
    try {
      setError(null)
      console.log('Sending password reset to:', email)
      await resetPassword(email)
      console.log('Password reset email sent')
    } catch (error) {
      console.error('Password reset error:', error)
      setError(error.message)
      throw error
    }
  }

  const updateProfile = async (data) => {
    try {
      setError(null)
      console.log('Updating profile:', data)
      
      // Update Firebase profile
      await updateUserProfile(user.uid, data)
      
      // Try to update backend profile
      try {
        const token = await getCurrentUserToken()
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
        
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
        console.warn('Backend not available for profile update:', backendError.message)
      }
      
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Profile update error:', error)
      setError(error.message)
      throw error
    }
  }

  const resendVerification = async () => {
    try {
      setError(null)
      console.log('Resending verification email')
      const sent = await resendVerificationEmail()
      console.log('Verification email sent:', sent)
      return sent
    } catch (error) {
      console.error('Resend verification error:', error)
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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
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
        console.warn('Backend username check not available:', backendError.message)
      }
      
      return firebaseAvailable
    } catch (error) {
      console.error('Username check error:', error)
      throw error
    }
  }

  const getAuthHeader = async () => {
    if (user) {
      try {
        const token = await getCurrentUserToken()
        return {
          'Authorization': `Bearer ${token}`
        }
      } catch (error) {
        console.error('Error getting auth token:', error)
        return {}
      }
    }
    return {}
  }

  const trackAnalysis = async () => {
    if (user?.uid) {
      try {
        await incrementAnalysisCount(user.uid)
        console.log('Analysis count incremented')
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
    analysisLimit: userProfile?.subscription === 'free' ? 5 : (userProfile?.subscription === 'pro' || userProfile?.subscription === 'enterprise') ? Infinity : 5
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}