// src/components/auth/AuthErrorBoundary.jsx - Error boundary for authentication errors

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, RefreshCw, Home, Bug, 
  ExternalLink, Copy, CheckCircle
} from 'lucide-react'

export class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorReported: false,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Authentication Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    })

    // Report error to monitoring service (e.g., Sentry)
    this.reportError(error, errorInfo)
  }

  reportError = async (error, errorInfo) => {
    try {
      // You can integrate with error reporting services here
      // Example: Sentry.captureException(error, { extra: errorInfo })
      
      // For now, just log to console in development
      if (import.meta.env.DEV) {
        console.group('🚨 Authentication Error Report')
        console.error('Error:', error)
        console.error('Error Info:', errorInfo)
        console.error('Component Stack:', errorInfo.componentStack)
        console.groupEnd()
      }

      this.setState({ errorReported: true })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      showDetails: false
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  copyErrorDetails = async () => {
    const errorDetails = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      // You could add a toast notification here
      console.log('Error details copied to clipboard')
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  getErrorType = (error) => {
    if (!error) return 'Unknown Error'
    
    const errorString = error.toString().toLowerCase()
    
    if (errorString.includes('firebase') || errorString.includes('auth/')) {
      return 'Firebase Authentication Error'
    }
    if (errorString.includes('network')) {
      return 'Network Error'
    }
    if (errorString.includes('permission')) {
      return 'Permission Error'
    }
    if (errorString.includes('quota')) {
      return 'Quota Exceeded'
    }
    
    return 'Application Error'
  }

  getErrorSuggestions = (error) => {
    if (!error) return []
    
    const errorString = error.toString().toLowerCase()
    const suggestions = []
    
    if (errorString.includes('firebase') || errorString.includes('auth/')) {
      suggestions.push('Check your internet connection')
      suggestions.push('Verify Firebase configuration in console')
      suggestions.push('Try signing out and back in')
    }
    
    if (errorString.includes('network')) {
      suggestions.push('Check your internet connection')
      suggestions.push('Try refreshing the page')
      suggestions.push('Check if the service is down')
    }
    
    if (errorString.includes('quota')) {
      suggestions.push('You may have exceeded usage limits')
      suggestions.push('Try again later')
      suggestions.push('Contact support for assistance')
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page')
      suggestions.push('Clear your browser cache')
      suggestions.push('Try in an incognito window')
    }
    
    return suggestions
  }

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error)
      const suggestions = this.getErrorSuggestions(this.state.error)
      const isAuthError = errorType.includes('Firebase') || errorType.includes('Auth')

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Oops! Something went wrong
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  We encountered an unexpected error. Don't worry, we're here to help!
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Error Type */}
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{errorType}</strong>
                    {this.state.retryCount > 0 && (
                      <span className="ml-2 text-sm">
                        (Retry attempt: {this.state.retryCount})
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Try these solutions:</h4>
                    <ul className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Error Details Toggle */}
                {import.meta.env.DEV && (
                  <div className="border-t pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                      className="text-gray-500"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                    </Button>
                    
                    {this.state.showDetails && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-semibold text-sm text-gray-900">Error Details</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={this.copyErrorDetails}
                              className="text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <strong>Error:</strong>
                              <pre className="mt-1 bg-white p-2 rounded border overflow-auto text-red-600">
                                {this.state.error?.toString()}
                              </pre>
                            </div>
                            
                            {this.state.error?.stack && (
                              <div>
                                <strong>Stack Trace:</strong>
                                <pre className="mt-1 bg-white p-2 rounded border overflow-auto text-gray-600 max-h-32">
                                  {this.state.error.stack}
                                </pre>
                              </div>
                            )}
                            
                            {this.state.errorInfo?.componentStack && (
                              <div>
                                <strong>Component Stack:</strong>
                                <pre className="mt-1 bg-white p-2 rounded border overflow-auto text-gray-600 max-h-32">
                                  {this.state.errorInfo.componentStack}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Support Info */}
                <div className="border-t pt-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    If the problem persists, please contact our support team.
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('mailto:support@errorscreenfix.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/help', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Help Center
                    </Button>
                  </div>
                </div>

                {/* Error ID for Support */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Error ID: {Date.now().toString(36).toUpperCase()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components with auth error boundary
export const withAuthErrorBoundary = (WrappedComponent) => {
  return function ComponentWithAuthErrorBoundary(props) {
    return (
      <AuthErrorBoundary>
        <WrappedComponent {...props} />
      </AuthErrorBoundary>
    )
  }
}

// Hook for manual error reporting
export const useErrorReporter = () => {
  const reportError = React.useCallback((error, context = {}) => {
    console.error('Manual error report:', error, context)
    
    // You can integrate with error reporting services here
    if (import.meta.env.DEV) {
      console.group('🐛 Manual Error Report')
      console.error('Error:', error)
      console.error('Context:', context)
      console.error('Timestamp:', new Date().toISOString())
      console.error('URL:', window.location.href)
      console.groupEnd()
    }
  }, [])

  return { reportError }
}

// Usage examples:
/*
// Wrap your entire app
<AuthErrorBoundary>
  <App />
</AuthErrorBoundary>

// Wrap specific components
<AuthErrorBoundary>
  <AuthenticationSection />
</AuthErrorBoundary>

// Use HOC
const SafeAuthComponent = withAuthErrorBoundary(AuthComponent)

// Manual error reporting
const MyComponent = () => {
  const { reportError } = useErrorReporter()
  
  const handleSomething = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      reportError(error, { 
        component: 'MyComponent',
        operation: 'riskyOperation'
      })
    }
  }
  
  return <button onClick={handleSomething}>Do Something</button>
}
*/