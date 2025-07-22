// src/pages/ProfilePage.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  User, Mail, Crown, Shield, Calendar, 
  Camera, Save, X, Loader2, Edit,
  Award, Activity, Clock, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'

const ProfilePage = () => {
  const { user, userProfile, updateProfile, uploadAvatar } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    bio: userProfile?.bio || '',
    username: userProfile?.username || ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Validate
      if (!formData.displayName.trim()) {
        toast.error('Display name is required')
        return
      }

      await updateProfile({
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        username: formData.username.trim()
      })

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      username: userProfile?.username || ''
    })
    setIsEditing(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      await uploadAvatar(user.uid, file)
      toast.success('Avatar uploaded successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
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

  const stats = [
    { 
      label: 'Errors Resolved', 
      value: userProfile?.stats?.errorsResolved || 0,
      icon: Activity,
      color: 'text-blue-600'
    },
    { 
      label: 'Solutions Shared', 
      value: userProfile?.solutionsShared || 0,
      icon: Award,
      color: 'text-green-600'
    },
    { 
      label: 'Community Points', 
      value: userProfile?.stats?.communityPoints || 0,
      icon: Star,
      color: 'text-purple-600'
    },
    { 
      label: 'Member Since', 
      value: userProfile?.createdAt ? formatDistanceToNow(new Date(userProfile.createdAt.seconds * 1000)) : 'N/A',
      icon: Calendar,
      color: 'text-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
                      <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="sr-only"
                          disabled={isUploading}
                        />
                        <div className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold">
                        {userProfile?.displayName || 'Unnamed User'}
                      </h3>
                      {userProfile?.subscription === 'pro' && (
                        <Badge className="bg-blue-600">
                          <Crown className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                      {userProfile?.role === 'admin' && (
                        <Badge className="bg-purple-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-6">
                  {/* Display Name */}
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    {isEditing ? (
                      <Input
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="Enter your display name"
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-gray-900">{userProfile?.displayName || 'Not set'}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <Label htmlFor="username">Username</Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a unique username"
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-gray-900">
                        {userProfile?.username ? `@${userProfile.username}` : 'Not set'}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                        className="mt-2 min-h-[100px]"
                        maxLength={500}
                      />
                    ) : (
                      <p className="mt-2 text-gray-900">
                        {userProfile?.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <Label>Email</Label>
                    <p className="mt-2 text-gray-900 flex items-center">
                      {user?.email}
                      {user?.emailVerified && (
                        <Badge variant="secondary" className="ml-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color}`}>
                    <stat.icon className="h-8 w-8 opacity-50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Subscription</h4>
                  <p className="text-sm text-gray-600">
                    {userProfile?.subscription === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                </div>
                {userProfile?.subscription !== 'pro' && (
                  <Button onClick={() => window.location.href = '/pricing'}>
                    Upgrade to Pro
                  </Button>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Account Created</h4>
                  <p className="text-sm text-gray-600">
                    {userProfile?.createdAt 
                      ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-red-600">Delete Account</h4>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfilePage