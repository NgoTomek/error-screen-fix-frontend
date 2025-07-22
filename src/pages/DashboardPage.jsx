// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { analysisAPI } from '@/lib/api'
import { 
  Activity, TrendingUp, Calendar, Clock,
  FileText, Crown, Zap, ArrowRight,
  Download, Share2, Eye, BarChart3,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, userProfile, isPro, analysisCount, analysisLimit } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // TODO: Fetch from API
      // const [history, statsData] = await Promise.all([
      //   analysisAPI.getHistory(),
      //   analysisAPI.getStats()
      // ])
      
      // Mock data for now
      setAnalysisHistory([
        {
          id: '1',
          error_type: 'Application Crash',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'resolved',
          solutions_count: 3
        },
        {
          id: '2',
          error_type: 'Blue Screen',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'resolved',
          solutions_count: 5
        }
      ])
      
      setStats({
        totalAnalyses: 23,
        successRate: 95,
        avgResolutionTime: '2.5 min',
        mostCommonError: 'Application Crash'
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const usagePercentage = isPro ? 0 : (analysisCount / analysisLimit) * 100

  // Chart data
  const errorTypeData = [
    { name: 'Application', value: 40, color: '#3B82F6' },
    { name: 'System', value: 30, color: '#10B981' },
    { name: 'Network', value: 20, color: '#F59E0B' },
    { name: 'Other', value: 10, color: '#6366F1' }
  ]

  const weeklyData = [
    { day: 'Mon', analyses: 4 },
    { day: 'Tue', analyses: 7 },
    { day: 'Wed', analyses: 3 },
    { day: 'Thu', analyses: 5 },
    { day: 'Fri', analyses: 8 },
    { day: 'Sat', analyses: 2 },
    { day: 'Sun', analyses: 1 }
  ]

  const quickStats = [
    {
      title: 'Total Analyses',
      value: stats?.totalAnalyses || 0,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%'
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      trend: '+2%'
    },
    {
      title: 'Avg Resolution Time',
      value: stats?.avgResolutionTime || 'N/A',
      icon: Clock,
      color: 'bg-purple-100 text-purple-600',
      trend: '-15%'
    },
    {
      title: 'This Month',
      value: `${analysisCount}/${isPro ? '∞' : analysisLimit}`,
      icon: Calendar,
      color: 'bg-orange-100 text-orange-600',
      trend: isPro ? 'Unlimited' : `${100 - usagePercentage}% left`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {userProfile?.displayName || user?.email}!
              </p>
            </div>
            <Button onClick={() => navigate('/upload')}>
              <Zap className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </motion.div>

        {/* Usage Alert for Free Users */}
        {!isPro && usagePercentage >= 80 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="font-medium text-orange-900">
                        You've used {usagePercentage.toFixed(0)}% of your monthly limit
                      </p>
                      <p className="text-sm text-orange-700">
                        Upgrade to Pro for unlimited analyses
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Analyses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Analyses</span>
                      <Link to="/history" className="text-sm text-blue-600 hover:underline">
                        View all
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisHistory.length > 0 ? (
                      <div className="space-y-4">
                        {analysisHistory.slice(0, 5).map((analysis) => (
                          <div
                            key={analysis.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/analysis/${analysis.id}`)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                analysis.status === 'resolved' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {analysis.status === 'resolved' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {analysis.error_type}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {analysis.solutions_count} solutions
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No analyses yet</p>
                        <Button
                          size="sm"
                          onClick={() => navigate('/upload')}
                          className="mt-3"
                        >
                          Start Your First Analysis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Usage Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Monthly Usage */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Monthly Analyses</span>
                          <span className="text-sm font-medium">
                            {analysisCount}/{isPro ? '∞' : analysisLimit}
                          </span>
                        </div>
                        <Progress value={usagePercentage} className="h-2" />
                        {!isPro && (
                          <p className="text-xs text-gray-500 mt-1">
                            {analysisLimit - analysisCount} analyses remaining
                          </p>
                        )}
                      </div>

                      {/* Error Types Chart */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Error Types Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={errorTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {errorTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {errorTypeData.map((type) => (
                            <div key={type.name} className="flex items-center text-sm">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: type.color }}
                              />
                              <span className="text-gray-600">{type.name} ({type.value}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="analyses" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Full history implementation would go here */}
                  <p className="text-gray-600">Complete analysis history coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Detailed analytics implementation would go here */}
                  <p className="text-gray-600">Advanced analytics coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage