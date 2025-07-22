// src/pages/HowItWorksPage.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Upload, Zap, CheckCircle, ArrowRight,
  Brain, Search, Shield, Clock,
  FileText, BookOpen, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const HowItWorksPage = () => {
  const navigate = useNavigate()
  const { canAnalyze } = useAuth()

  const steps = [
    {
      number: 1,
      icon: Upload,
      color: 'bg-blue-600',
      title: 'Upload Your Error Screenshot',
      description: 'Simply drag and drop or click to upload a screenshot of any error message, blue screen, or application crash. Our system supports all major image formats and can analyze errors from any platform or application.',
      details: [
        'Supports JPG, PNG, GIF, and WebP formats',
        'Maximum file size: 10MB',
        'Automatic image optimization',
        'Secure upload with encryption'
      ]
    },
    {
      number: 2,
      icon: Zap,
      color: 'bg-green-600',
      title: 'AI Analyzes the Problem',
      description: 'Our advanced AI examines your error using computer vision and natural language processing. It identifies the root cause, categorizes the error type, and cross-references with our extensive knowledge base of known solutions.',
      details: [
        'OCR technology extracts error text',
        'Pattern recognition identifies error types',
        'Context analysis for better accuracy',
        'Real-time processing in seconds'
      ]
    },
    {
      number: 3,
      icon: CheckCircle,
      color: 'bg-purple-600',
      title: 'Get Comprehensive Solutions',
      description: 'Receive multiple detailed solutions ranked by success probability. Each solution includes step-by-step instructions, difficulty ratings, estimated time to fix, and links to official documentation or trusted sources.',
      details: [
        'Multiple solution approaches',
        'Step-by-step instructions',
        'Difficulty and time estimates',
        'Links to official resources'
      ]
    }
  ]

  const features = [
    {
      icon: Brain,
      title: 'Advanced AI Technology',
      description: 'Powered by state-of-the-art machine learning models trained on millions of error patterns.'
    },
    {
      icon: Clock,
      title: 'Instant Results',
      description: 'Get solutions in under 30 seconds. No waiting, no queues, just instant help.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your screenshots are processed securely and deleted after analysis. We never store your data.'
    },
    {
      icon: Search,
      title: 'Comprehensive Database',
      description: 'Access to solutions from official documentation, forums, and expert knowledge bases.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h1>
            <p className="text-xl opacity-90">
              Get your errors fixed in 3 simple steps
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8"
              >
                {/* Step Number and Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center relative`}>
                    <step.icon className="h-10 w-10 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-gray-900">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {step.description}
                  </p>
                  
                  {/* Step Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              onClick={() => navigate('/upload')}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!canAnalyze}
            >
              {canAnalyze ? 'Try It Now' : 'Sign Up to Try'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Our AI is Different
            </h2>
            <p className="text-xl text-gray-600">
              Advanced technology that actually understands your errors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Visualization */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Behind the Scenes
            </h2>
            <p className="text-xl text-gray-600">
              See how our AI processes your error screenshot
            </p>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: 'Image Processing',
                      description: 'OCR extracts text, computer vision identifies UI elements',
                      icon: FileText
                    },
                    {
                      step: 'Error Analysis',
                      description: 'AI categorizes error type and identifies root causes',
                      icon: Brain
                    },
                    {
                      step: 'Solution Generation',
                      description: 'Matches with database and generates custom solutions',
                      icon: Sparkles
                    }
                  ].map((phase, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <phase.icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{phase.step}</h4>
                      <p className="text-sm text-gray-600">{phase.description}</p>
                      
                      {index < 2 && (
                        <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Mini Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Common Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'What types of errors can you analyze?',
                a: 'We can analyze any visual error including blue screens, application crashes, error dialogs, console errors, and more.'
              },
              {
                q: 'How accurate are the solutions?',
                a: 'Our AI has a 95% success rate based on user feedback. We provide multiple solutions ranked by probability of success.'
              },
              {
                q: 'Is my data secure?',
                a: 'Yes! Screenshots are encrypted during upload, processed in isolation, and automatically deleted after analysis.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border-b pb-6 last:border-0"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2 flex items-start">
                  <BookOpen className="h-5 w-5 mr-2 mt-0.5 text-blue-600" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 ml-7">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Fix Your First Error?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust our AI to solve their technical problems
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/upload')}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Your First Error
          </Button>
        </div>
      </section>
    </div>
  )
}

export default HowItWorksPage