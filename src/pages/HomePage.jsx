// src/pages/HomePage.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Zap, Shield, Users, BookOpen, CheckCircle,
  AlertTriangle, Crown, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const HomePage = () => {
  const navigate = useNavigate()
  const { 
    isAuthenticated, 
    analysisCount, 
    analysisLimit, 
    isPro,
    canAnalyze
  } = useAuth()

  const handleSignInClick = () => {
    window.dispatchEvent(new CustomEvent('showSignInModal'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Fix Any Error with <span className="text-blue-600">AI Power</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload a screenshot of any error and get instant, comprehensive solutions 
              powered by advanced AI. From blue screens to app crashes, we've got you covered.
            </p>
            
            {/* Usage Indicator for Authenticated Users */}
            {isAuthenticated && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Analyses used this month:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{analysisCount}/{isPro ? '∞' : analysisLimit}</span>
                        {isPro && <Crown className="h-4 w-4 text-blue-600" />}
                      </div>
                    </div>
                    {!isPro && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((analysisCount / analysisLimit) * 100, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            analysisCount >= analysisLimit ? 'bg-red-500' : 
                            analysisCount >= analysisLimit * 0.8 ? 'bg-yellow-500' : 
                            'bg-blue-600'
                          }`}
                        />
                      </div>
                    )}
                    {!canAnalyze && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-600 font-medium text-sm mt-2"
                      >
                        Analysis limit reached! Upgrade for unlimited access.
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/upload')}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isAuthenticated && !canAnalyze}
              >
                <Zap className="h-5 w-5 mr-2" />
                {canAnalyze ? 'Start Fixing Errors' : 'Upgrade to Continue'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/how-it-works')}
                className="border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50,000+", label: "Errors Analyzed", color: "text-blue-600" },
              { value: "95%", label: "Success Rate", color: "text-green-600" },
              { value: "10,000+", label: "Happy Users", color: "text-purple-600" },
              { value: "24/7", label: "AI Support", color: "text-orange-600" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Error Fixer?
            </h2>
            <p className="text-xl text-gray-600">Advanced AI technology meets user-friendly design</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Analysis",
                description: "Get comprehensive error analysis and multiple solutions in under 30 seconds using advanced AI",
                color: "from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200",
                iconBg: "bg-blue-600"
              },
              {
                icon: Shield,
                title: "95% Success Rate",
                description: "Our AI has successfully resolved over 95% of submitted error cases with expert-level accuracy",
                color: "from-green-50 to-green-100 hover:from-green-100 hover:to-green-200",
                iconBg: "bg-green-600"
              },
              {
                icon: Users,
                title: "Expert Solutions",
                description: "Solutions backed by credible sources, expert knowledge bases, and community validation",
                color: "from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200",
                iconBg: "bg-purple-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`text-center p-8 rounded-xl bg-gradient-to-br ${feature.color} transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:scale-105`}
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Fix Your Errors?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who trust our AI to solve their technical problems
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => navigate('/upload')}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  disabled={!canAnalyze}
                >
                  {canAnalyze ? 'Start Free Analysis' : 'Upgrade to Continue'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSignInClick}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Get Started Free
                </Button>
              )}
              {!isPro && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage