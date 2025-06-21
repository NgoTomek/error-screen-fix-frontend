// src/pages/CommunityPage.jsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Filter, TrendingUp, Clock, Star, 
  ChevronDown, MessageSquare, Bookmark, ThumbsUp,
  Plus, Shield, Users, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081'

export const CommunityPage = () => {
  const { user, userProfile, getAuthHeader } = useAuth()
  const navigate = useNavigate()
  const [solutions, setSolutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Fetch solutions
  const fetchSolutions = async (reset = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: reset ? 1 : page,
        perPage: 20,
        sortBy,
        ...(category !== 'all' && { category }),
        ...(difficulty !== 'all' && { difficulty }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`${API_BASE_URL}/api/community/solutions?${params}`, {
        headers: await getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to fetch solutions')

      const data = await response.json()
      
      if (reset) {
        setSolutions(data.solutions)
        setPage(1)
      } else {
        setSolutions(prev => [...prev, ...data.solutions])
      }
      
      setHasMore(data.pagination.hasNext)
    } catch (error) {
      console.error('Error fetching solutions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolutions(true)
  }, [category, difficulty, sortBy])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchSolutions(true)
  }

  const handleVote = async (solutionId, isUpvote) => {
    if (!user) {
      // Show sign in modal
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/community/solutions/${solutionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeader())
        },
        body: JSON.stringify({ isUpvote })
      })

      if (!response.ok) throw new Error('Failed to vote')

      const data = await response.json()
      
      // Update solution in state
      setSolutions(prev => prev.map(sol => 
        sol.id === solutionId 
          ? { ...sol, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount }
          : sol
      ))
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleBookmark = async (solutionId) => {
    if (!user) {
      // Show sign in modal
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/community/solutions/${solutionId}/bookmark`, {
        method: 'POST',
        headers: await getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to bookmark')

      const data = await response.json()
      
      // Update solution in state
      setSolutions(prev => prev.map(sol => 
        sol.id === solutionId 
          ? { ...sol, isBookmarked: data.isBookmarked, bookmarkCount: data.bookmarkCount }
          : sol
      ))
    } catch (error) {
      console.error('Error bookmarking:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Community Solutions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl opacity-90 mb-8"
            >
              Learn from real solutions shared by the community
            </motion.p>
            
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => navigate('/share-solution')}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Share Your Solution
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">1,234</div>
              <div className="text-sm text-gray-600">Solutions Shared</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">5,678</div>
              <div className="text-sm text-gray-600">Problems Solved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">890</div>
              <div className="text-sm text-gray-600">Active Contributors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search solutions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <div className="flex flex-wrap gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                  <SelectItem value="Application">Application</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Web">Web</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>

              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Tabs value={sortBy} onValueChange={setSortBy} className="w-auto">
                <TabsList>
                  <TabsTrigger value="recent" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger value="top" className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Top Rated
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Solutions Grid */}
          {loading && solutions.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {solutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onVote={handleVote}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPage(prev => prev + 1)
                      fetchSolutions()
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

const SolutionCard = ({ solution, onVote, onBookmark }) => {
  const navigate = useNavigate()
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader onClick={() => navigate(`/community/solution/${solution.id}`)}>
          <div className="flex items-start justify-between mb-2">
            <Badge variant="secondary" className={getDifficultyColor(solution.difficulty)}>
              {solution.difficulty}
            </Badge>
            <Badge variant="outline">{solution.category}</Badge>
          </div>
          <h3 className="text-lg font-semibold line-clamp-2">
            {solution.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {solution.description}
          </p>
        </CardHeader>
        
        <CardContent className="flex-1" onClick={() => navigate(`/community/solution/${solution.id}`)}>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{solution.upvoteCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{solution.commentCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              <span>{solution.bookmarkCount}</span>
            </div>
          </div>
          
          {solution.tags && solution.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {solution.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={solution.author?.avatarUrl} />
                <AvatarFallback>
                  {solution.author?.displayName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{solution.author?.displayName}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(solution.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                size="icon"
                variant={solution.userVote?.isUpvote ? "default" : "ghost"}
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onVote(solution.id, true)
                }}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={solution.isBookmarked ? "default" : "ghost"}
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onBookmark(solution.id)
                }}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

