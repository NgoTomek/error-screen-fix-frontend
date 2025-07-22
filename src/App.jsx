// src/App.jsx - Refactored with React Router and proper structure
import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'
import { AuthProvider } from './contexts/AuthContext'
import { AuthErrorBoundary } from './components/auth/AuthErrorBoundary'
import { Layout } from './components/layout/Layout'
import { LoadingScreen } from './components/common/LoadingScreen'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import './App.css'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  </div>
)

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthErrorBoundary>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <Layout>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  
                  {/* Protected Routes - Require Authentication */}
                  <Route path="/upload" element={
                    <ProtectedRoute requireAuth={true}>
                      <UploadPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute requireAuth={true}>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute requireAuth={true}>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Community Routes */}
                  <Route path="/community" element={<CommunityPage />} />
                  
                  {/* Redirects */}
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  
                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </Layout>
            
            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </AuthErrorBoundary>
    </ErrorBoundary>
  )
}

export default App