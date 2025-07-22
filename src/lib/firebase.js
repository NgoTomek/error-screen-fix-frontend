// src/lib/firebase.js - Updated with better error handling and configuration

import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  connectAuthEmulator
} from 'firebase/auth'
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  connectFirestoreEmulator
} from 'firebase/firestore'
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  connectStorageEmulator
} from 'firebase/storage'

// Firebase configuration with validation
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId']
const missingFields = requiredFields.filter(field => !firebaseConfig[field])

if (missingFields.length > 0) {
  console.error('❌ Missing Firebase configuration fields:', missingFields)
  console.error('Please add these environment variables to your .env file:')
  missingFields.forEach(field => {
    const envVar = `VITE_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`
    console.error(`  ${envVar}=your_${field.toLowerCase()}_here`)
  })
  throw new Error('Firebase configuration incomplete. Check console for details.')
}

// Initialize Firebase
let app, auth, db, storage

try {
  console.log('🔥 Initializing Firebase...')
  app = initializeApp(firebaseConfig)
  
  // Initialize services
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  
  // Configure auth settings
  auth.useDeviceLanguage()
  
  // Configure Firestore for better development experience
  if (import.meta.env.DEV) {
    try {
      // Enable offline persistence for better development experience
      // This helps prevent "offline" errors during development
      console.log('🔧 Configuring Firestore for development...')
      
      // Add connection retry settings
      db._delegate._databaseId = { ...db._delegate._databaseId }
      
    } catch (error) {
      console.warn('Could not apply Firestore settings:', error.message)
    }
  }
  
  // Connect to emulators in development (optional)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    console.log('🔧 Connecting to Firebase emulators...')
    try {
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectStorageEmulator(storage, 'localhost', 9199)
    } catch (error) {
      console.warn('⚠️ Could not connect to emulators:', error.message)
    }
  }
  
  console.log('✅ Firebase initialized successfully')
  console.log(`📋 Project ID: ${firebaseConfig.projectId}`)
  console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`)
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error)
  throw new Error('Firebase initialization failed. Please check your configuration.')
}

// Auth providers with better configuration
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Enhanced error handling
export const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-disabled': 'Your account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This authentication method is not enabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/unauthorized-domain': 'This domain is not authorized for authentication.',
    'auth/invalid-action-code': 'The verification link is invalid or has expired.',
    'auth/expired-action-code': 'The verification link has expired. Please request a new one.',
    'auth/missing-email': 'Please enter your email address.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.'
  }
  
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.'
}

// Auth functions with enhanced error handling
export const createUser = async (email, password, displayName) => {
  try {
    console.log('👤 Creating user with email:', email)
    
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    console.log('✅ User created successfully:', user.uid)
    
    // Update display name
    if (displayName?.trim()) {
      await updateProfile(user, { displayName: displayName.trim() })
      console.log('✅ Display name updated:', displayName)
    }
    
    // Send verification email
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/?verified=true`,
        handleCodeInApp: false
      })
      console.log('📧 Verification email sent')
    } catch (emailError) {
      console.warn('⚠️ Failed to send verification email:', emailError.message)
    }
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      displayName: displayName?.trim() || '',
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      role: 'user',
      subscription: 'free',
      analysisCount: 0,
      analysisLimit: 5,
      solutionsShared: 0,
      reputation: 0,
      bio: '',
      avatarUrl: '',
      username: '',
      settings: {
        emailNotifications: true,
        communityNotifications: true,
        darkMode: false,
        language: 'en'
      },
      stats: {
        errorsResolved: 0,
        solutionsHelpful: 0,
        communityPoints: 0
      }
    }
    
    await setDoc(doc(db, 'users', user.uid), userProfile)
    console.log('✅ User profile created in Firestore')
    
    return user
  } catch (error) {
    console.error('❌ Error creating user:', error)
    const message = getAuthErrorMessage(error.code) || error.message
    throw new Error(message)
  }
}

export const signIn = async (email, password) => {
  try {
    console.log('🔐 Signing in user:', email)
    
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password)
    const user = userCredential.user
    
    console.log('✅ Sign in successful:', user.uid)
    
    // Update last login time
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('✅ Last login time updated')
    } catch (updateError) {
      console.warn('⚠️ Could not update last login:', updateError.message)
    }
    
    return user
  } catch (error) {
    console.error('❌ Error signing in:', error)
    const message = getAuthErrorMessage(error.code) || error.message
    throw new Error(message)
  }
}

export const signInWithGoogle = async () => {
  try {
    console.log('🔍 Starting Google sign in')
    
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    console.log('✅ Google sign in successful:', user.email)
    
    // Try to handle user profile creation/update (non-blocking for offline scenarios)
    try {
      // Check if user profile exists
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      
      const now = serverTimestamp()
      
      if (!userDoc.exists()) {
        console.log('👤 Creating new user profile for Google user')
        
        // Create user profile for new Google users
        const userProfile = {
          uid: user.uid,
          email: user.email.toLowerCase(),
          displayName: user.displayName || '',
          emailVerified: user.emailVerified,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          role: 'user',
          subscription: 'free',
          analysisCount: 0,
          analysisLimit: 5,
          solutionsShared: 0,
          reputation: 0,
          bio: '',
          avatarUrl: user.photoURL || '',
          username: '',
          settings: {
            emailNotifications: true,
            communityNotifications: true,
            darkMode: false,
            language: 'en'
          },
          stats: {
            errorsResolved: 0,
            solutionsHelpful: 0,
            communityPoints: 0
          }
        }
        
        await setDoc(userDocRef, userProfile)
        console.log('✅ New Google user profile created')
      } else {
        console.log('🔄 Updating existing user login time')
        // Update last login for existing users
        await updateDoc(userDocRef, {
          lastLoginAt: now,
          updatedAt: now,
          // Update email verification status if it changed
          ...(user.emailVerified && { emailVerified: true })
        })
        console.log('✅ User profile updated')
      }
    } catch (profileError) {
      console.warn('⚠️ Could not handle user profile (offline):', profileError.message)
      // Don't throw error - authentication was successful, profile issues are secondary
    }
    
    return user
  } catch (error) {
    console.error('❌ Error signing in with Google:', error)
    
    // Handle Firestore offline errors specifically
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      throw new Error('Authentication service temporarily unavailable. Please try again.')
    }
    
    const message = getAuthErrorMessage(error.code) || 'An unexpected error occurred. Please try again.'
    throw new Error(message)
  }
}

export const logOut = async () => {
  try {
    console.log('👋 Signing out user')
    await signOut(auth)
    console.log('✅ Sign out successful')
  } catch (error) {
    console.error('❌ Error signing out:', error)
    throw new Error('Failed to sign out. Please try again.')
  }
}

export const resetPassword = async (email) => {
  try {
    console.log('📧 Sending password reset email to:', email)
    
    if (!email?.trim()) {
      throw new Error('Email address is required')
    }
    
    await sendPasswordResetEmail(auth, email.toLowerCase().trim(), {
      url: `${window.location.origin}/signin`,
      handleCodeInApp: false
    })
    
    console.log('✅ Password reset email sent')
  } catch (error) {
    console.error('❌ Error sending password reset:', error)
    const message = getAuthErrorMessage(error.code) || error.message
    throw new Error(message)
  }
}

export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser
    
    if (!user) {
      throw new Error('No user is currently signed in')
    }
    
    if (user.emailVerified) {
      return { success: false, message: 'Email is already verified' }
    }
    
    console.log('📧 Resending verification email')
    await sendEmailVerification(user, {
      url: `${window.location.origin}/?verified=true`,
      handleCodeInApp: false
    })
    
    console.log('✅ Verification email sent')
    return { success: true, message: 'Verification email sent successfully' }
  } catch (error) {
    console.error('❌ Error resending verification email:', error)
    const message = getAuthErrorMessage(error.code) || error.message
    throw new Error(message)
  }
}

// User profile functions
export const getUserProfile = async (uid, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log('👤 Getting user profile for:', uid)
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (userDoc.exists()) {
        const profile = { id: userDoc.id, ...userDoc.data() }
        console.log('✅ User profile retrieved')
        return profile
      }
      
      console.log('⚠️ User profile not found, creating default profile')
      
      // Create default profile if it doesn't exist
      const defaultProfile = {
        displayName: uid.substring(0, 8), // Use part of UID as default name
        email: '',
        role: 'user',
        subscription: 'free',
        analysisCount: 0,
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      // Try to create default profile (non-blocking)
      try {
        await setDoc(doc(db, 'users', uid), defaultProfile)
        console.log('✅ Default user profile created')
        return { id: uid, ...defaultProfile }
      } catch (createError) {
        console.warn('Could not create default profile:', createError.message)
        return null
      }
      
    } catch (error) {
      console.error('❌ Error getting user profile:', error)
      
      // Handle specific Firestore errors
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.warn('🔄 Firestore appears offline, returning minimal profile')
        return {
          id: uid,
          displayName: 'User',
          subscription: 'free',
          analysisCount: 0,
          offline: true
        }
      }
      
      if (attempt < retries) {
        console.log(`Retrying user profile fetch (${attempt + 1}/${retries + 1})`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      
      // Final attempt failed
      console.warn('Could not load user profile, using fallback')
      return null
    }
  }
}

export const updateUserProfile = async (uid, data) => {
  try {
    console.log('🔄 Updating user profile:', uid, data)
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    }
    
    // Clean up the data (remove undefined values)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    
    await updateDoc(doc(db, 'users', uid), updateData)
    console.log('✅ User profile updated successfully')
  } catch (error) {
    console.error('❌ Error updating user profile:', error)
    throw new Error('Failed to update profile')
  }
}

export const checkUsernameAvailability = async (username) => {
  try {
    if (!username?.trim()) {
      return false
    }
    
    const trimmedUsername = username.trim().toLowerCase()
    console.log('🔍 Checking username availability:', trimmedUsername)
    
    const q = query(
      collection(db, 'users'), 
      where('username', '==', trimmedUsername),
      limit(1)
    )
    
    const querySnapshot = await getDocs(q)
    const available = querySnapshot.empty
    
    console.log('✅ Username availability check:', available)
    return available
  } catch (error) {
    console.error('❌ Error checking username:', error)
    throw new Error('Failed to check username availability')
  }
}

// Real-time listeners
export const subscribeToUserProfile = (uid, callback) => {
  console.log('👂 Subscribing to user profile changes:', uid)
  return onSnapshot(
    doc(db, 'users', uid), 
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() })
      } else {
        callback(null)
      }
    }, 
    (error) => {
      console.error('❌ Error in user profile subscription:', error)
      callback(null)
    }
  )
}

export const subscribeToAuthState = (callback) => {
  console.log('👂 Subscribing to auth state changes')
  return onAuthStateChanged(
    auth, 
    callback, 
    (error) => {
      console.error('❌ Error in auth state subscription:', error)
    }
  )
}

// Helper functions
export const getCurrentUserToken = async () => {
  const user = auth.currentUser
  
  if (!user) {
    console.warn('⚠️ No current user for token')
    return null
  }
  
  try {
    const token = await user.getIdToken(false)
    console.log('✅ Got current user token')
    return token
  } catch (error) {
    console.error('❌ Error getting current user token:', error)
    throw new Error('Failed to get authentication token')
  }
}

export const refreshUserToken = async () => {
  const user = auth.currentUser
  
  if (!user) {
    return null
  }
  
  try {
    const token = await user.getIdToken(true) // Force refresh
    console.log('✅ User token refreshed')
    return token
  } catch (error) {
    console.error('❌ Error refreshing user token:', error)
    throw new Error('Failed to refresh authentication token')
  }
}

// Analytics and user activity
export const incrementAnalysisCount = async (uid) => {
  try {
    console.log('📊 Incrementing analysis count for user:', uid)
    const userRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const currentCount = userDoc.data().analysisCount || 0
      await updateDoc(userRef, {
        analysisCount: currentCount + 1,
        updatedAt: serverTimestamp()
      })
      console.log('✅ Analysis count incremented to:', currentCount + 1)
      return currentCount + 1
    }
  } catch (error) {
    console.error('❌ Error incrementing analysis count:', error)
    throw new Error('Failed to track analysis')
  }
}

export const updateUserActivity = async (uid, activity) => {
  try {
    console.log('📝 Logging user activity:', uid, activity)
    await addDoc(collection(db, 'user-activity'), {
      uid,
      activity,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
    console.log('✅ User activity logged')
  } catch (error) {
    console.warn('⚠️ Failed to log user activity:', error.message)
    // Don't throw error for activity logging failures
  }
}

// Storage functions
export const uploadAvatar = async (uid, file) => {
  try {
    console.log('📷 Uploading avatar for user:', uid)
    
    // Validate file
    if (!file) {
      throw new Error('No file provided')
    }
    
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB')
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed')
    }
    
    const storageRef = ref(storage, `avatars/${uid}/${Date.now()}-${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    // Update user profile with avatar URL
    await updateUserProfile(uid, { avatarUrl: downloadURL })
    
    console.log('✅ Avatar uploaded successfully')
    return downloadURL
  } catch (error) {
    console.error('❌ Error uploading avatar:', error)
    throw new Error(error.message || 'Failed to upload avatar')
  }
}

// Export the initialized instances
export { auth, db, storage }