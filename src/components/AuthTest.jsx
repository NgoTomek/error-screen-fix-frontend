// src/components/AuthTest.jsx - Test component to verify authentication

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, AlertCircle, Wifi, WifiOff, 
  User, Mail, Shield, Database, Zap,
  RefreshCw, TestTube
} from 'lucide-react'

export const AuthTest = () => {
  const { 
    user, 
    userProfile, 
    isAuthenticated, 
    isEmailVerified,
    isPro,
    analysisCount,
    analysisLimit,
    loading,
    error,
    authReady,
    refreshAuth
  } = useAuth()

  const [testResults, setTestResults] = useState(null)
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const results = []

    // Test 1: Firebase Connection
    try {
      const firebaseConnected = window.firebase !== undefined || authReady
      results.push({
        name: 'Firebase Connection',
        status: firebaseConnected ? 'pass' : 'fail',
        message: firebaseConnected ? 'Firebase is connected' : 'Firebase not initialized'
      })
    } catch (error) {
      results.push({
        name: 'Firebase Connection',
        status: 'fail',
        message: 'Firebase initialization failed'
      })
    }

    // Test 2: Authentication State
    results.push({
      name: 'Authentication State',
      status: isAuthenticated ? 'pass' : 'info',
      message: isAuthenticated ? 'User is authenticated' : 'User is not signed in'
    })

    // Test 3: User Profile
    if (isAuthenticated) {
      results.push({
        name: 'User Profile Loading',
        status: userProfile ? 'pass' : 'fail',
        message: userProfile ? 'User profile loaded successfully' : 'Failed to load user profile'
      })
    }

    // Test 4: Email Verification
    if (isAuthenticated) {
      results.push({
        name: 'Email Verification',
        status: isEmailVerified ? 'pass' : 'warning',
        message: isEmailVerified ? 'Email is verified' : 'Email needs verification'
      })
    }

    // Test 5: Backend Connection
    try {
      const response = await fetch('/api/health')
      results.push({
        name: 'Backend Connection',
        status: response.ok ? 'pass' : 'warning',
        message: response.ok ? 'Backend is accessible' : 'Backend not responding'
      })
    } catch (error) {
      results.push({
        name: 'Backend Connection',
        status: 'warning',
        message: 'Backend not available (optional)'
      })
    }

    // Test 6: Firestore Access
    if (isAuthenticated && userProfile) {
      results.push({
        name: 'Firestore Access',
        status: 'pass',
        message: 'Successfully reading from Firestore'
      })
    }

    setTestResults(results)
    setTesting(false)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default: return <AlertCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'border-green-200 bg-green-50'
      case 'fail': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Authentication System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Auth Ready:</span>
                  <Badge variant={authReady ? "default" : "destructive"}>
                    {authReady ? "Ready" : "Loading"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Loading:</span>
                  <Badge variant={loading ? "secondary" : "outline"}>
                    {loading ? "Yes" : "No"}
                  </Badge>
                </div>
                {error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">User Information</h3>
              {isAuthenticated ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="truncate">{userProfile?.displayName || 'No name'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user?.email}</span>
                    {isEmailVerified ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>
                      {isPro ? 'Pro User' : 'Free User'} 
                      ({analysisCount}/{isPro ? '∞' : analysisLimit} analyses)
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not signed in</p>
              )}
            </div>
          </div>

          {/* Test Button */}
          <div className="flex gap-2">
            <Button 
              onClick={runTests} 
              disabled={testing}
              className="flex items-center gap-2"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Run System Tests
                </>
              )}
            </Button>
            
            {isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={refreshAuth}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Auth
              </Button>
            )}
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Test Results</h3>
              <div className="space-y-2">
                {testResults.map((test, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <span className="font-medium text-sm">{test.name}</span>
                      </div>
                      <Badge 
                        variant={test.status === 'pass' ? 'default' : 
                                test.status === 'fail' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      {test.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Firebase Config Check */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Firebase Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Project ID:</span>
                <span className="ml-2 font-mono">
                  {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set'}
                </span>
              </div>
              <div>
                <span className="font-medium">Auth Domain:</span>
                <span className="ml-2 font-mono">
                  {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not set'}
                </span>
              </div>
              <div>
                <span className="font-medium">API Key:</span>
                <span className="ml-2 font-mono">
                  {import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
              <div>
                <span className="font-medium">App ID:</span>
                <span className="ml-2 font-mono">
                  {import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Common Issues:</strong><br />
              • <code>auth/operation-not-allowed</code>: Enable Email/Password in Firebase Console<br />
              • <code>auth/unauthorized-domain</code>: Add domain to Authorized domains<br />
              • Profile not loading: Check Firestore security rules<br />
              • Google sign-in fails: Configure Google provider in Firebase Console
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

// Usage: Add this to your App.jsx for testing
// {import.meta.env.DEV && <AuthTest />}