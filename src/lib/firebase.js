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

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Auth providers
export const googleProvider = new GoogleAuthProvider()

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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'user',
      subscription: 'free',
      analysisCount: 0,
      solutionsShared: 0,
      reputation: 0,
      bio: '',
      avatarUrl: '',
      settings: {
        emailNotifications: true,
        communityNotifications: true,
        darkMode: false
      }
    })
    
    return user
  } catch (error) {
    throw error
  }
}

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
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
      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'user',
        subscription: 'free',
        analysisCount: 0,
        solutionsShared: 0,
        reputation: 0,
        bio: '',
        avatarUrl: user.photoURL || '',
        settings: {
          emailNotifications: true,
          communityNotifications: true,
          darkMode: false
        }
      })
    }
    
    return user
  } catch (error) {
    throw error
  }
}

export const logOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    throw error
  }
}

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw error
  }
}

// User profile functions
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
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
    throw error
  }
}

// Community functions
export const createCommunityPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'community-posts'), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewCount: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      commentCount: 0,
      bookmarkCount: 0
    })
    return docRef.id
  } catch (error) {
    throw error
  }
}

export const getCommunityPosts = async (filters = {}) => {
  try {
    let q = collection(db, 'community-posts')
    
    // Apply filters
    if (filters.category) {
      q = query(q, where('category', '==', filters.category))
    }
    
    if (filters.authorId) {
      q = query(q, where('authorId', '==', filters.authorId))
    }
    
    // Apply sorting
    if (filters.sortBy === 'popular') {
      q = query(q, orderBy('viewCount', 'desc'))
    } else if (filters.sortBy === 'top') {
      q = query(q, orderBy('upvoteCount', 'desc'))
    } else {
      q = query(q, orderBy('createdAt', 'desc'))
    }
    
    // Apply limit
    if (filters.limit) {
      q = query(q, limit(filters.limit))
    }
    
    const querySnapshot = await getDocs(q)
    const posts = []
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return posts
  } catch (error) {
    throw error
  }
}

// Real-time listeners
export const subscribeToUserProfile = (uid, callback) => {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data())
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

