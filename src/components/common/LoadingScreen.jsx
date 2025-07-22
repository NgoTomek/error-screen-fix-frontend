// src/components/common/LoadingScreen.jsx
import React from 'react'
import { Loader2 } from 'lucide-react'

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading...
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  )
}

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <Loader2 
      className={`animate-spin text-blue-600 ${sizes[size]} ${className}`} 
    />
  )
}

export const LoadingDots = () => {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}

export const LoadingSkeleton = ({ className = '', ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`} 
      {...props}
    />
  )
}