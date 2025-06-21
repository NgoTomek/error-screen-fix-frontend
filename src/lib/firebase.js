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

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "error-screen-fix.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "error-screen-fix",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "error-screen-fix.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Configure auth settings
auth.useDeviceLanguage()

// Auth providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

// Auth functions
export const createUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update display name
    await updateProfile(user, { displayName })
    
    // Send verification email
    await sendEmailVerification(user)
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
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
    
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists()) {
      // Create user profile for new Google users
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
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
    } else {
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
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/signin`,
      handleCodeInApp: false
    })
  } catch (error) {
    console.error('Error sending password reset:', error)
    throw error
  }
}

export const resendVerificationEmail = async () => {
  try {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser)
      return true
    }
    return false
  } catch (error) {
    console.error('Error resending verification email:', error)
    throw error
  }
}

// User profile functions
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

export const updateUserProfile = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

export const checkUsernameAvailability = async (username) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('username', '==', username),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.empty
  } catch (error) {
    console.error('Error checking username:', error)
    throw error
  }
}

// Storage functions
export const uploadAvatar = async (uid, file) => {
  try {
    const storageRef = ref(storage, `avatars/${uid}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    // Update user profile with avatar URL
    await updateUserProfile(uid, { avatarUrl: downloadURL })
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }
}

export const uploadErrorScreenshot = async (file, analysisId) => {
  try {
    const storageRef = ref(storage, `error-screenshots/${analysisId}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading screenshot:', error)
    throw error
  }
}

// Real-time listeners
export const subscribeToUserProfile = (uid, callback) => {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    } else {
      callback(null)
    }
  })
}

export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Helper function to get current user token
export const getCurrentUserToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken()
  }
  return null
}

// Analytics and user activity
export const incrementAnalysisCount = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const currentCount = userDoc.data().analysisCount || 0
      await updateDoc(userRef, {
        analysisCount: currentCount + 1,
        updatedAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error incrementing analysis count:', error)
  }
}

export const updateUserActivity = async (uid, activity) => {
  try {
    await addDoc(collection(db, 'user-activity'), {
      uid,
      activity,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error logging user activity:', error)
  }
}
