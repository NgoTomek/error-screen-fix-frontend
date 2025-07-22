// src/config/environment.js
/**
 * Environment configuration and validation
 */

// Required environment variables
const requiredVars = {
    // Firebase Configuration
    VITE_FIREBASE_API_KEY: {
      description: 'Firebase API Key',
      example: 'AIzaSyAbc...',
      sensitive: true
    },
    VITE_FIREBASE_AUTH_DOMAIN: {
      description: 'Firebase Auth Domain',
      example: 'your-project.firebaseapp.com',
      sensitive: false
    },
    VITE_FIREBASE_PROJECT_ID: {
      description: 'Firebase Project ID',
      example: 'your-project-id',
      sensitive: false
    },
    VITE_FIREBASE_STORAGE_BUCKET: {
      description: 'Firebase Storage Bucket',
      example: 'your-project.appspot.com',
      sensitive: false
    },
    VITE_FIREBASE_MESSAGING_SENDER_ID: {
      description: 'Firebase Messaging Sender ID',
      example: '123456789',
      sensitive: true
    },
    VITE_FIREBASE_APP_ID: {
      description: 'Firebase App ID',
      example: '1:123456789:web:abc...',
      sensitive: true
    },
    
    // API Configuration
    VITE_API_URL: {
      description: 'Backend API URL',
      example: 'http://localhost:8082',
      sensitive: false
    }
  }
  
  // Optional environment variables
  const optionalVars = {
    VITE_FIREBASE_MEASUREMENT_ID: {
      description: 'Firebase Analytics Measurement ID',
      example: 'G-XXXXXXXXXX',
      sensitive: false
    },
    VITE_USE_FIREBASE_EMULATOR: {
      description: 'Use Firebase Emulator in development',
      example: 'true',
      sensitive: false
    },
    VITE_SUPPRESS_DEV_LOGS: {
      description: 'Suppress verbose development logs',
      example: 'true',
      sensitive: false
    }
  }
  
  /**
   * Validate environment variables
   * @throws {Error} If required variables are missing
   */
  export const validateEnvironment = () => {
    const missing = []
    const warnings = []
  
    // Check required variables
    Object.entries(requiredVars).forEach(([key, config]) => {
      if (!import.meta.env[key]) {
        missing.push({ key, ...config })
      }
    })
  
    // Check optional variables
    Object.entries(optionalVars).forEach(([key, config]) => {
      if (!import.meta.env[key]) {
        warnings.push({ key, ...config })
      }
    })
  
    // Log validation results
    if (missing.length > 0 || warnings.length > 0) {
      console.group('🔧 Environment Configuration')
      
      if (missing.length > 0) {
        console.error('\n❌ Missing Required Environment Variables:')
        missing.forEach(({ key, description, example }) => {
          console.error(`\n  ${key}`)
          console.error(`    Description: ${description}`)
          console.error(`    Example: ${example}`)
        })
        
        console.error('\n📝 Add these to your .env file:')
        missing.forEach(({ key, example, sensitive }) => {
          const value = sensitive ? 'your_actual_value_here' : example
          console.error(`${key}=${value}`)
        })
      }
  
      if (warnings.length > 0 && import.meta.env.DEV) {
        console.warn('\n⚠️  Optional Environment Variables Not Set:')
        warnings.forEach(({ key, description }) => {
          console.warn(`  ${key} - ${description}`)
        })
      }
  
      console.groupEnd()
  
      if (missing.length > 0) {
        throw new Error(
          `Missing ${missing.length} required environment variable(s). ` +
          'Please check the console for details and update your .env file.'
        )
      }
    }
  }
  
  /**
   * Get environment configuration
   * @returns {Object} Environment configuration
   */
  export const getEnvConfig = () => {
    return {
      // Firebase
      firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
      },
      
      // API
      api: {
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8082',
        timeout: 30000
      },
      
      // Features
      features: {
        useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
        enableAnalytics: !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
        suppressDevLogs: import.meta.env.VITE_SUPPRESS_DEV_LOGS === 'true'
      },
      
      // App
      app: {
        name: 'Error Screen Fix',
        version: __APP_VERSION__ || '1.0.0',
        buildTime: __BUILD_TIME__ || new Date().toISOString(),
        environment: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD
      }
    }
  }
  
  /**
   * Get public environment info (safe to expose)
   * @returns {Object} Public environment configuration
   */
  export const getPublicEnvInfo = () => {
    const config = getEnvConfig()
    
    return {
      apiUrl: config.api.baseUrl,
      firebaseProject: config.firebase.projectId,
      environment: config.app.environment,
      version: config.app.version,
      buildTime: config.app.buildTime
    }
  }
  
  // Run validation on import (can be disabled in tests)
  if (import.meta.env.MODE !== 'test') {
    try {
      validateEnvironment()
      console.log('✅ Environment configuration validated successfully')
    } catch (error) {
      console.error('❌ Environment validation failed:', error.message)
      
      // In development, show a helpful error page
      if (import.meta.env.DEV) {
        document.body.innerHTML = `
          <div style="padding: 20px; font-family: monospace; background: #f5f5f5; min-height: 100vh;">
            <h1 style="color: #d32f2f;">⚠️ Environment Configuration Error</h1>
            <p style="color: #666;">Missing required environment variables. Check the console for details.</p>
            <pre style="background: #fff; padding: 20px; border-radius: 4px; overflow: auto;">
  ${error.message}
  
  Steps to fix:
  1. Copy .env.example to .env
  2. Fill in the required values
  3. Restart the development server
            </pre>
          </div>
        `
      }
      
      throw error
    }
  }