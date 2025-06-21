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
  subscribeToUserProfile
} from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

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
          
          // Register/login with backend
          const token = await getCurrentUserToken()
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!response.ok) {
            console.error('Backend login failed')
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
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
      
      // Register with backend
      const token = await firebaseUser.getIdToken()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ displayName })
      })
      
      if (!response.ok) {
        throw new Error('Backend registration failed')
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
      
      // Update backend profile
      const token = await getCurrentUserToken()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const checkUsernameAvailability = async (username) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      })
      
      if (!response.ok) {
        throw new Error('Failed to check username')
      }
      
      const data = await response.json()
      return data.available
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
    checkUsernameAvailability,
    getAuthHeader,
    isAuthenticated: !!user,
    isPro: userProfile?.subscription === 'pro' || userProfile?.subscription === 'enterprise',
    isAdmin: userProfile?.role === 'admin',
    isModerator: userProfile?.role === 'moderator' || userProfile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

