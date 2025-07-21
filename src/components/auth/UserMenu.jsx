// src/components/auth/UserMenu.jsx - Enhanced user menu with better UX

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, LogOut, Settings, BookmarkIcon, 
  FileText, Crown, Shield, AlertCircle,
  Mail, BarChart3, RefreshCw, CheckCircle,
  Loader2, Copy, ExternalLink
} from 'lucide-react'

export const UserMenu = () => {
  const { 
    user, 
    userProfile, 
    logout, 
    isEmailVerified, 
    resendVerification,
    analysisCount,
    analysisLimit,
    isPro,
    needsEmailVerification
  } = useAuth()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true)
      const result = await resendVerification()
      
      if (result.success) {
        setVerificationMessage('Verification email sent! Check your inbox.')
      } else {
        setVerificationMessage(result.message)
      }
      
      setTimeout(() => {
        setVerificationMessage('')
      }, 5000)
    } catch (error) {
      setVerificationMessage('Failed to send verification email')
      setTimeout(() => {
        setVerificationMessage('')
      }, 5000)
    } finally {
      setIsResending(false)
    }
  }

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user.uid)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy user ID:', error)
    }
  }

  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getSubscriptionBadge = () => {
    if (userProfile?.subscription === 'pro') {
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      )
    }
    if (userProfile?.subscription === 'enterprise') {
      return (
        <Badge className="bg-purple-600 hover:bg-purple-700">
          <Shield className="h-3 w-3 mr-1" />
          Enterprise
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        <User className="h-3 w-3 mr-1" />
        Free
      </Badge>
    )
  }

  const getUsagePercentage = () => {
    if (isPro) return 0
    return Math.min((analysisCount / analysisLimit) * 100, 100)
  }

  const getUsageColor = () => {
    const percentage = getUsagePercentage()
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={userProfile?.avatarUrl} 
              alt={userProfile?.displayName || 'User avatar'} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* Notification indicators */}
          {needsEmailVerification && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <AlertCircle className="h-2.5 w-2.5 text-white" />
            </div>
          )}
          
          {!isPro && analysisCount >= analysisLimit && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <Crown className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3">
            {/* User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={userProfile?.avatarUrl} 
                    alt={userProfile?.displayName || 'User avatar'} 
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {userProfile?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {user?.email}
                  </p>
                </div>
              </div>
              {getSubscriptionBadge()}
            </div>
            
            {/* Email Verification Status */}
            {needsEmailVerification && (
              <div className="space-y-2">
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your email address is not verified
                  </AlertDescription>
                </Alert>
                
                {verificationMessage ? (
                  <Alert className="py-2 border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800">
                      {verificationMessage}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full h-8 text-xs"
                    onClick={handleResendVerification}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-3 w-3 mr-1" />
                        Verify Email
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Usage Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Analyses this month:</span>
                <span className="font-medium">
                  {analysisCount}/{isPro ? '∞' : analysisLimit}
                </span>
              </div>
              
              {!isPro && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor()}`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    />
                  </div>
                  {analysisCount >= analysisLimit && (
                    <p className="text-xs text-red-600 font-medium">
                      Limit reached! Upgrade for unlimited access.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* User Stats */}
            {userProfile?.stats && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile.stats.errorsResolved || 0}
                  </p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile.solutionsShared || 0}
                  </p>
                  <p className="text-xs text-gray-500">Shared</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile.reputation || 0}
                  </p>
                  <p className="text-xs text-gray-500">Reputation</p>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Navigation Items */}
        <DropdownMenuItem 
          onClick={() => window.location.href = '/profile'}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => window.location.href = '/dashboard'}
          className="cursor-pointer"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => window.location.href = '/my-solutions'}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>My Solutions</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => window.location.href = '/bookmarks'}
          className="cursor-pointer"
        >
          <BookmarkIcon className="mr-2 h-4 w-4" />
          <span>Bookmarks</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => window.location.href = '/settings'}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {/* Upgrade Section - Free Users Only */}
        {!isPro && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => window.location.href = '/pricing'}
              className="text-blue-600 focus:text-blue-600 cursor-pointer"
            >
              <Crown className="mr-2 h-4 w-4" />
              <span>Upgrade to Pro</span>
              <ExternalLink className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          </>
        )}
        
        {/* Admin/Debug Section */}
        {import.meta.env.DEV && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={copyUserId}
              className="cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy User ID</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-600 focus:text-red-600 cursor-pointer"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}