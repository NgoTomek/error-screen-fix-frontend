// src/lib/firebase.js

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
  sendEmailVerification
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
  onSnapshot
} from 'firebase/firestore'
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'

// Firebase configuration - IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Check if required Firebase config is present
const requiredFields = ['apiKey', 'authDomain', 'projectId']
const missingFields = requiredFields.filter(field => !firebaseConfig[field])

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration:', missingFields)
  console.error('Please add these environment variables to your .env file:')
  missingFields.forEach(field => {
    console.error(`VITE_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
  })
}

// Initialize Firebase
let app, auth, db, storage

try {
  app = initializeApp(firebaseConfig)
  
  // Initialize services
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  
  // Configure auth settings
  auth.useDeviceLanguage()
  
  console.log('Firebase initialized successfully')
} catch (error) {
  console.error('Failed to initialize Firebase:', error)
  throw new Error('Firebase initialization failed. Please check your configuration.')
}

// Auth providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

// Auth functions
export const createUser = async (email, password, displayName) => {
  try {
    console.log('Creating user with email:', email)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName })
      console.log('Display name updated:', displayName)
    }
    
    // Send verification email
    try {
      await sendEmailVerification(user)
      console.log('Verification email sent')
    } catch (emailError) {
      console.warn('Failed to send verification email:', emailError.message)
    }
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || '',
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'user',
      subscription: 'free',
      analysisCount: 0,
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
    })
    
    console.log('User profile created in Firestore')
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export const signIn = async (email, password) => {
  try {
    console.log('Signing in user:', email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log('Sign in successful')
    return userCredential.user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign in')
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    console.log('Google sign in successful:', user.email)
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists()) {
      console.log('Creating new user profile for Google user')
      // Create user profile for new Google users
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'user',
        subscription: 'free',
        analysisCount: 0,
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
      })
      console.log('New Google user profile created')
    } else {
      console.log('Updating existing user login time')
      // Update last login for existing users
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    
    return user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

export const logOut = async () => {
  try {
    console.log('Signing out user')
    await signOut(auth)
    console.log('Sign out successful')
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export const resetPassword = async (email) => {
  try {
    console.log('Sending password reset email to:', email)
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}`,
      handleCodeInApp: false
    })
    console.log('Password reset email sent')
  } catch (error) {
    console.error('Error sending password reset:', error)
    throw error
  }
}

export const resendVerificationEmail = async () => {
  try {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      console.log('Resending verification email')
      await sendEmailVerification(auth.currentUser)
      console.log('Verification email sent')
      return true
    }
    console.log('User already verified or not signed in')
    return false
  } catch (error) {
    console.error('Error resending verification email:', error)
    throw error
  }
}

// User profile functions
export const getUserProfile = async (uid) => {
  try {
    console.log('Getting user profile for:', uid)
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      const profile = { id: userDoc.id, ...userDoc.data() }
      console.log('User profile retrieved')
      return profile
    }
    console.log('User profile not found')
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

export const updateUserProfile = async (uid, data) => {
  try {
    console.log('Updating user profile:', uid, data)
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp()
    })
    console.log('User profile updated successfully')
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

export const checkUsernameAvailability = async (username) => {
  try {
    console.log('Checking username availability:', username)
    const q = query(
      collection(db, 'users'), 
      where('username', '==', username),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    const available = querySnapshot.empty
    console.log('Username available:', available)
    return available
  } catch (error) {
    console.error('Error checking username:', error)
    throw error
  }
}

// Storage functions
export const uploadAvatar = async (uid, file) => {
  try {
    console.log('Uploading avatar for user:', uid)
    const storageRef = ref(storage, `avatars/${uid}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    // Update user profile with avatar URL
    await updateUserProfile(uid, { avatarUrl: downloadURL })
    
    console.log('Avatar uploaded successfully')
    return downloadURL
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }
}

export const uploadErrorScreenshot = async (file, analysisId) => {
  try {
    console.log('Uploading error screenshot:', analysisId)
    const storageRef = ref(storage, `error-screenshots/${analysisId}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('Screenshot uploaded successfully')
    return downloadURL
  } catch (error) {
    console.error('Error uploading screenshot:', error)
    throw error
  }
}

// Real-time listeners
export const subscribeToUserProfile = (uid, callback) => {
  console.log('Subscribing to user profile changes:', uid)
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('Error in user profile subscription:', error)
  })
}

export const subscribeToAuthState = (callback) => {
  console.log('Subscribing to auth state changes')
  return onAuthStateChanged(auth, callback, (error) => {
    console.error('Error in auth state subscription:', error)
  })
}

// Helper function to get current user token
export const getCurrentUserToken = async () => {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken()
      console.log('Got current user token')
      return token
    } catch (error) {
      console.error('Error getting current user token:', error)
      throw error
    }
  }
  return null
}

// Analytics and user activity
export const incrementAnalysisCount = async (uid) => {
  try {
    console.log('Incrementing analysis count for user:', uid)
    const userRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const currentCount = userDoc.data().analysisCount || 0
      await updateDoc(userRef, {
        analysisCount: currentCount + 1,
        updatedAt: serverTimestamp()
      })
      console.log('Analysis count incremented to:', currentCount + 1)
    }
  } catch (error) {
    console.error('Error incrementing analysis count:', error)
  }
}

export const updateUserActivity = async (uid, activity) => {
  try {
    console.log('Logging user activity:', uid, activity)
    await addDoc(collection(db, 'user-activity'), {
      uid,
      activity,
      timestamp: serverTimestamp()
    })
    console.log('User activity logged')
  } catch (error) {
    console.error('Error logging user activity:', error)
  }
}

// Export the initialized instances
export { auth, db, storage }