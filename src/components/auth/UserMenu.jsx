// src/components/auth/UserMenu.jsx

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
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
import { 
  User, LogOut, Settings, BookmarkIcon, 
  FileText, Crown, Shield 
} from 'lucide-react'

export const UserMenu = () => {
  const { user, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userProfile?.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {userProfile?.subscription !== 'free' && (
              <div className="flex items-center mt-1">
                {userProfile?.subscription === 'pro' && (
                  <div className="flex items-center text-blue-600">
                    <Crown className="h-3 w-3 mr-1" />
                    <span className="text-xs">Pro</span>
                  </div>
                )}
                {userProfile?.subscription === 'enterprise' && (
                  <div className="flex items-center text-purple-600">
                    <Shield className="h-3 w-3 mr-1" />
                    <span className="text-xs">Enterprise</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-solutions')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>My Solutions</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/bookmarks')}>
          <BookmarkIcon className="mr-2 h-4 w-4" />
          <span>Bookmarks</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

