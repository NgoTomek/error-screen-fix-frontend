// src/components/common/DevelopmentBanner.jsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const DevelopmentBanner = () => {
  const [isVisible, setIsVisible] = useState(true)
  
  // Only show in development
  if (!import.meta.env.DEV) return null
  
  // Don't show if user has dismissed it
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="relative z-50"
      >
        <Alert className="rounded-none border-x-0 border-orange-200 bg-orange-50 text-orange-900">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full pr-8">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Development Mode:</span>
              <span>Backend services unavailable. Demo data is shown for development purposes.</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
} 