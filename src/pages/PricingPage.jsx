// src/pages/PricingPage.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  Crown, Shield, CheckCircle, X, Zap,
  Sparkles, TrendingUp, BarChart, Users,
  ExternalLink, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PricingPage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isPro, userProfile } = useAuth()
  const [billingCycle, setBillingCycle] = useState('monthly')

  const handleUpgrade = (plan) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('showSignInModal'))
      return
    }

    if (plan === 'pro') {
      // TODO: Integrate with payment provider
      toast.success('Pro upgrade coming soon! Contact support for early access.')
    } else if (plan === 'enterprise') {
      toast('Our sales team will contact you soon!', { icon: '📞' })
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for occasional use',
      highlighted: false,
      current: isAuthenticated && !isPro,
      features: [
        { text: '5 error analyses per month', included: true },
        { text: 'Basic AI solutions', included: true },
        { text: 'Community support', included: true },
        { text: 'Basic export options', included: true },
        { text: 'Standard processing speed', included: true },
        { text: 'Solution bookmarking', included: false },
        { text: 'Analysis history', included: false },
        { text: 'Priority support', included: false },
        { text: 'API access', included: false }
      ],
      cta: isAuthenticated ? 'Current Plan' : 'Get Started',
      ctaAction: () => !isAuthenticated && window.dispatchEvent(new CustomEvent('showSignInModal'))
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 19, yearly: 190 },
      description: 'For professionals and power users',
      highlighted: true,
      current: isPro,
      badge: 'Most Popular',
      features: [
        { text: 'Unlimited error analyses', included: true },
        { text: 'Advanced AI solutions', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced export & sharing', included: true },
        { text: 'Fast processing speed', included: true },
        { text: 'Solution bookmarking', included: true },
        { text: 'Analysis history', included: true },
        { text: 'Custom integrations', included: false },
        { text: 'API access', included: false }
      ],
      cta: isPro ? 'Current Plan' : 'Upgrade to Pro',
      ctaAction: () => handleUpgrade('pro')
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 99, yearly: 990 },
      description: 'For teams and organizations',
      highlighted: false,
      current: false,
      badge: 'Custom Solutions',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'API access', included: true },
        { text: 'Custom AI training', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Admin dashboard', included: true },
        { text: 'Bulk processing', included: true }
      ],
      cta: 'Contact Sales',
      ctaAction: () => handleUpgrade('enterprise')
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Choose the plan that works best for you
            </p>
            
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <Tabs value={billingCycle} onValueChange={setBillingCycle}>
                <TabsList className="bg-white/10 backdrop-blur">
                  <TabsTrigger value="monthly" className="text-white data-[state=active]:text-blue-600">
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="yearly" className="text-white data-[state=active]:text-blue-600">
                    Yearly
                    <Badge className="ml-2 bg-green-500 text-white">Save 20%</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={plan.highlighted ? 'transform scale-105' : ''}
              >
                <Card className={`relative h-full ${
                  plan.highlighted 
                    ? 'border-2 border-blue-500 shadow-xl' 
                    : 'border border-gray-200'
                }`}>
                  {/* Current Plan Badge */}
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  
                  {/* Plan Badge */}
                  {plan.badge && !plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className="flex justify-center mb-4">
                      {plan.id === 'free' && <Zap className="h-12 w-12 text-gray-600" />}
                      {plan.id === 'pro' && <Crown className="h-12 w-12 text-blue-600" />}
                      {plan.id === 'enterprise' && <Shield className="h-12 w-12 text-purple-600" />}
                    </div>
                    
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold">
                          ${billingCycle === 'monthly' ? plan.price.monthly : Math.floor(plan.price.yearly / 12)}
                        </span>
                        <span className="text-gray-600 ml-2">/month</span>
                      </div>
                      {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          ${plan.price.yearly} billed annually
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          {feature.included ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={plan.ctaAction}
                      disabled={plan.current}
                      className={`w-full ${
                        plan.highlighted && !plan.current
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : ''
                      }`}
                      variant={plan.highlighted && !plan.current ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      {!plan.current && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Upgrade to Pro?
            </h2>
            <p className="text-xl text-gray-600">
              Unlock the full power of AI-driven error resolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Unlimited Analyses',
                description: 'No more monthly limits. Analyze as many errors as you need.'
              },
              {
                icon: Sparkles,
                title: 'Advanced AI Solutions',
                description: 'Get more detailed, accurate solutions with advanced AI models.'
              },
              {
                icon: BarChart,
                title: 'Analytics & History',
                description: 'Track your error patterns and see your resolution history.'
              },
              {
                icon: Users,
                title: 'Priority Support',
                description: 'Get help faster with dedicated priority support channels.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex space-x-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            {[
              {
                q: 'Can I upgrade or downgrade at any time?',
                a: 'Yes! You can upgrade to Pro instantly and downgrade at the end of your billing cycle.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.'
              },
              {
                q: 'Is there a free trial for Pro?',
                a: 'New users get 5 free analyses to try our service. Contact support for Pro trial options.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee for all paid plans.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Upgrade?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals using Pro features
          </p>
          <Button
            size="lg"
            onClick={() => handleUpgrade('pro')}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Crown className="h-5 w-5 mr-2" />
            Upgrade to Pro Now
          </Button>
        </div>
      </section>
    </div>
  )
}

export default PricingPage