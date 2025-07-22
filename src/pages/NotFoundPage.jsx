// src/pages/NotFoundPage.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* 404 Illustration */}
        <div className="mb-8">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block"
          >
            <div className="text-9xl font-bold text-gray-300">404</div>
          </motion.div>
        </div>

        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist. 
            It might have been moved or deleted.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              className="flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              Here are some helpful links:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/upload" className="text-blue-600 hover:underline">
                Upload Error
              </Link>
              <Link to="/how-it-works" className="text-blue-600 hover:underline">
                How It Works
              </Link>
              <Link to="/pricing" className="text-blue-600 hover:underline">
                Pricing
              </Link>
              <Link to="/community" className="text-blue-600 hover:underline">
                Community
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default NotFoundPage