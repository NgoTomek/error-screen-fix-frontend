// src/components/auth/UserMenu.jsx

import React from 'react'
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
import { 
  User, LogOut, Settings, BookmarkIcon, 
  FileText, Crown, Shield, AlertCircle,
  Mail, BarChart3
} from 'lucide-react'

export const UserMenu = () => {
  const { 
    user, 
    userProfile, 
    logout, 
    isEmailVerified, 
    resendVerification,
    analysisCount,
    analysisLimit 
  } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const handleResendVerification = async () => {
    try {
      await resendVerification()
      alert('Verification email sent!')
    } catch (error) {
      alert('Failed to send verification email')
    }
  }

  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getSubscriptionBadge = () => {
    if (userProfile?.subscription === 'pro') {
      return <Badge className="bg-blue-600"><Crown className="h-3 w-3 mr-1" />Pro</Badge>
    }
    if (userProfile?.subscription === 'enterprise') {
      return <Badge className="bg-purple-600"><Shield className="h-3 w-3 mr-1" />Enterprise</Badge>
    }
    return <Badge variant="outline">Free</Badge>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          {!isEmailVerified && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {userProfile?.displayName || 'User'}
              </p>
              {getSubscriptionBadge()}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            
            {!isEmailVerified && (
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                <div className="flex items-center text-yellow-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-xs">Email not verified</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-xs"
                  onClick={handleResendVerification}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Verify
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Analyses used:</span>
              <span className="font-medium">
                {analysisCount}/{analysisLimit === Infinity ? '∞' : analysisLimit}
              </span>
            </div>
            
            {userProfile?.subscription === 'free' && analysisCount >= analysisLimit && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Analysis limit reached. Upgrade for unlimited access!
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.location.href = '/my-solutions'}>
          <FileText className="mr-2 h-4 w-4" />
          <span>My Solutions</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.location.href = '/bookmarks'}>
          <BookmarkIcon className="mr-2 h-4 w-4" />
          <span>Bookmarks</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {userProfile?.subscription === 'free' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => window.location.href = '/pricing'}
              className="text-blue-600"
            >
              <Crown className="mr-2 h-4 w-4" />
              <span>Upgrade to Pro</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
