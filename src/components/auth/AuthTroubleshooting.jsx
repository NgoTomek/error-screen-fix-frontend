// src/components/auth/AuthTroubleshooting.jsx - Comprehensive troubleshooting guide

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  AlertCircle, CheckCircle, XCircle, RefreshCw,
  Settings, Wifi, Shield, Bug, ExternalLink,
  Copy, Mail, Key, Globe, Database, 
  HelpCircle, Lightbulb, AlertTriangle
} from 'lucide-react'

export const AuthTroubleshooting = () => {
  const { 
    user, 
    userProfile,
    isAuthenticated, 
    isEmailVerified,
    error: authError,
    loading,
    authReady 
  } = useAuth()

  const [diagnostics, setDiagnostics] = useState(null)
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Run diagnostics
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true)
    
    const results = {
      environment: {},
      firebase: {},
      authentication: {},
      network: {},
      browser: {}
    }

    try {
      // Environment checks
      results.environment = {
        nodeEnv: import.meta.env.MODE,
        apiUrl: import.meta.env.VITE_API_URL,
        hasFirebaseConfig: !!(
          import.meta.env.VITE_FIREBASE_API_KEY &&
          import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
          import.meta.env.VITE_FIREBASE_PROJECT_ID
        ),
        configVars: {
          apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: !!import.meta.env.VITE_FIREBASE_APP_ID
        }
      }

      // Firebase checks
      results.firebase = {
        initialized: authReady,
        authReady,
        loading,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
      }

      // Authentication checks
      results.authentication = {
        isAuthenticated,
        hasUser: !!user,
        hasProfile: !!userProfile,
        isEmailVerified,
        userEmail: user?.email,
        userUid: user?.uid,
        creationTime: user?.metadata?.creationTime,
        lastSignInTime: user?.metadata?.lastSignInTime,
        authError: authError || null
      }

      // Network checks
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          timeout: 5000 
        })
        results.network.backendReachable = response.ok
        results.network.backendStatus = response.status
      } catch (error) {
        results.network.backendReachable = false
        results.network.backendError = error.message
      }

      // Test Firebase connectivity
      try {
        // This would test actual Firebase connection
        results.network.firebaseReachable = true
      } catch (error) {
        results.network.firebaseReachable = false
        results.network.firebaseError = error.message
      }

      // Browser checks
      results.browser = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        localStorage: typeof Storage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        webCrypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
      }

    } catch (error) {
      console.error('Diagnostics failed:', error)
    }

    setDiagnostics(results)
    setIsRunningDiagnostics(false)
  }

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === false) return <XCircle className="h-4 w-4 text-red-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  const getStatusBadge = (status, trueText = 'OK', falseText = 'Error') => {
    if (status === true) return <Badge className="bg-green-100 text-green-800">{trueText}</Badge>
    if (status === false) return <Badge variant="destructive">{falseText}</Badge>
    return <Badge variant="secondary">Unknown</Badge>
  }

  const copyDiagnostics = async () => {
    if (!diagnostics) return
    
    const diagnosticsText = JSON.stringify({
      ...diagnostics,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }, null, 2)

    try {
      await navigator.clipboard.writeText(diagnosticsText)
      // Could show success toast
    } catch (error) {
      console.error('Failed to copy diagnostics:', error)
    }
  }

  const commonIssues = [
    {
      title: 'auth/operation-not-allowed',
      description: 'Authentication method not enabled in Firebase Console',
      icon: <Shield className="h-5 w-5 text-red-500" />,
      solutions: [
        'Go to Firebase Console → Authentication → Sign-in method',
        'Enable Email/Password authentication',
        'Enable Google authentication if using Google sign-in',
        'Add your domain to Authorized domains list'
      ]
    },
    {
      title: 'auth/unauthorized-domain',
      description: 'Current domain not authorized in Firebase',
      icon: <Globe className="h-5 w-5 text-red-500" />,
      solutions: [
        'Go to Firebase Console → Authentication → Settings',
        'Add your domain to Authorized domains',
        'For development: add "localhost"',
        'For production: add your actual domain'
      ]
    },
    {
      title: 'auth/invalid-api-key',
      description: 'Firebase API key is missing or incorrect',
      icon: <Key className="h-5 w-5 text-red-500" />,
      solutions: [
        'Check your .env file has VITE_FIREBASE_API_KEY',
        'Verify the API key in Firebase Console → Project Settings',
        'Ensure the API key is correctly copied',
        'Restart your development server after changing .env'
      ]
    },
    {
      title: 'Network/Connection Issues',
      description: 'Unable to connect to Firebase or backend',
      icon: <Wifi className="h-5 w-5 text-red-500" />,
      solutions: [
        'Check your internet connection',
        'Verify Firebase project is active',
        'Check for ad blockers or firewall blocking requests',
        'Try in incognito mode to rule out extensions'
      ]
    },
    {
      title: 'Email Verification Problems',
      description: 'Email verification not working properly',
      icon: <Mail className="h-5 w-5 text-red-500" />,
      solutions: [
        'Check spam/junk folder for verification emails',
        'Verify email templates are configured in Firebase',
        'Check if email quota is exceeded in Firebase',
        'Ensure SMTP settings are correct (if using custom SMTP)'
      ]
    },
    {
      title: 'Profile Loading Issues',
      description: 'User profile not loading from Firestore',
      icon: <Database className="h-5 w-5 text-red-500" />,
      solutions: [
        'Check Firestore security rules allow user to read their profile',
        'Verify the users collection exists in Firestore',
        'Check browser console for Firestore errors',
        'Ensure user document was created during registration'
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Authentication Troubleshooting
          </CardTitle>
          <p className="text-gray-600">
            Diagnose and resolve authentication issues with this comprehensive guide.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              className="flex items-center gap-2"
            >
              {isRunningDiagnostics ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              {isRunningDiagnostics ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </Button>
            
            {diagnostics && (
              <Button 
                onClick={copyDiagnostics}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Authentication</span>
              {getStatusBadge(isAuthenticated, 'Signed In', 'Signed Out')}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Email Verified</span>
              {getStatusBadge(isEmailVerified, 'Verified', 'Unverified')}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Profile Loaded</span>
              {getStatusBadge(!!userProfile, 'Loaded', 'Missing')}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Firebase Ready</span>
              {getStatusBadge(authReady, 'Ready', 'Loading')}
            </div>
          </div>
          
          {authError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Current Error:</strong> {authError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="common-issues">Common Issues</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Quick Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Authentication Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(authReady)}
                      <span>Firebase Initialized: {authReady ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(isAuthenticated)}
                      <span>User Signed In: {isAuthenticated ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(isEmailVerified)}
                      <span>Email Verified: {isEmailVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(!!userProfile)}
                      <span>Profile Loaded: {userProfile ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(!!import.meta.env.VITE_FIREBASE_API_KEY)}
                      <span>Firebase API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(!!import.meta.env.VITE_FIREBASE_PROJECT_ID)}
                      <span>Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(navigator.onLine)}
                      <span>Internet Connection: {navigator.onLine ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(navigator.cookieEnabled)}
                      <span>Cookies Enabled: {navigator.cookieEnabled ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          {!diagnostics ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Click "Run Diagnostics" to analyze your authentication setup</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Environment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Environment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Environment: <Badge variant="outline">{diagnostics.environment.nodeEnv}</Badge></div>
                    <div>Firebase Config: {getStatusBadge(diagnostics.environment.hasFirebaseConfig)}</div>
                    <div>API URL: <code className="bg-gray-100 px-2 py-1 rounded">{diagnostics.environment.apiUrl || 'Not set'}</code></div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-semibold mb-2">Configuration Variables:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(diagnostics.environment.configVars).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{key}:</span>
                          {getStatusBadge(value, 'Set', 'Missing')}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Authentication Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Authenticated: {getStatusBadge(diagnostics.authentication.isAuthenticated)}</div>
                    <div>Email Verified: {getStatusBadge(diagnostics.authentication.isEmailVerified)}</div>
                    <div>Has Profile: {getStatusBadge(diagnostics.authentication.hasProfile)}</div>
                    <div>User UID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{diagnostics.authentication.userUid || 'None'}</code></div>
                  </div>
                  {diagnostics.authentication.authError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{diagnostics.authentication.authError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Network */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Network Connectivity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Backend Reachable:</span>
                      {getStatusBadge(diagnostics.network.backendReachable)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Firebase Reachable:</span>
                      {getStatusBadge(diagnostics.network.firebaseReachable)}
                    </div>
                    {diagnostics.network.backendError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{diagnostics.network.backendError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Browser */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Browser Compatibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Cookies Enabled: {getStatusBadge(diagnostics.browser.cookiesEnabled)}</div>
                    <div>Local Storage: {getStatusBadge(diagnostics.browser.localStorage)}</div>
                    <div>Online Status: {getStatusBadge(diagnostics.browser.onLine)}</div>
                    <div>Web Crypto: {getStatusBadge(diagnostics.browser.webCrypto)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="common-issues" className="space-y-4">
          <div className="grid gap-4">
            {commonIssues.map((issue, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {issue.icon}
                    {issue.title}
                  </CardTitle>
                  <p className="text-gray-600">{issue.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h5 className="font-semibold flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Solutions:
                    </h5>
                    <ul className="space-y-1">
                      {issue.solutions.map((solution, sIndex) => (
                        <li key={sIndex} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {sIndex + 1}
                          </span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Setup Guide</CardTitle>
              <p className="text-gray-600">Follow these steps to properly configure Firebase authentication</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h4 className="font-semibold text-lg">Firebase Console Setup</h4>
                </div>
                <div className="ml-10 space-y-2 text-sm">
                  <p>• Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 hover:underline" rel="noopener noreferrer">Firebase Console <ExternalLink className="inline h-3 w-3" /></a></p>
                  <p>• Navigate to Authentication → Sign-in method</p>
                  <p>• Enable Email/Password authentication</p>
                  <p>• Enable Google authentication (optional)</p>
                  <p>• Add your domain to Authorized domains</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h4 className="font-semibold text-lg">Environment Configuration</h4>
                </div>
                <div className="ml-10 space-y-2 text-sm">
                  <p>• Create a <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file in your project root</p>
                  <p>• Add all required Firebase configuration variables</p>
                  <p>• Get values from Firebase Console → Project Settings → General</p>
                  <p>• Restart your development server after adding variables</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <h4 className="font-semibold text-lg">Firestore Setup</h4>
                </div>
                <div className="ml-10 space-y-2 text-sm">
                  <p>• Enable Firestore Database in Firebase Console</p>
                  <p>• Set up proper security rules for user documents</p>
                  <p>• Test read/write permissions for authenticated users</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  <h4 className="font-semibold text-lg">Test Authentication</h4>
                </div>
                <div className="ml-10 space-y-2 text-sm">
                  <p>• Run diagnostics using the button above</p>
                  <p>• Test sign up with email/password</p>
                  <p>• Test sign in with existing account</p>
                  <p>• Verify email verification flow works</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}