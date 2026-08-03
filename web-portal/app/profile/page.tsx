'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserRound, BriefcaseBusiness, Save, ArrowLeft, Camera, MapPin, Globe, Clock, Phone, Mail, LayoutDashboard, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { NotificationBell } from '@/components/notification-bell'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumbers: '',
    avatar: '',
    location: '',
    bio: '',
    website: ''
  })
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null)
  const [stats, setStats] = useState({ resumes: 0, skills: 0, recommendations: 0 })

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (response.ok) {
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phoneNumbers: data.user.phoneNumbers?.join('\n') || '',
          avatar: data.user.avatar || '',
          location: data.user.location || '',
          bio: data.user.bio || '',
          website: data.user.website || ''
        })
        setLastLoginAt(data.user.lastLoginAt || null)
        setStats({
          resumes: data.user.resumes?.length || 0,
          skills: 0,
          recommendations: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        phoneNumbers: formData.phoneNumbers.split('\n').filter(p => p.trim()),
        avatar: formData.avatar,
        location: formData.location,
        bio: formData.bio,
        website: formData.website
      }
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    fetchProfileData()
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    setIsUploadingAvatar(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', avatarFile)

      const response = await fetch('/api/user/avatar/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        setFormData({ ...formData, avatar: data.avatarUrl })
        setAvatarFile(null)
        setAvatarPreview(null)
      } else {
        console.error('Avatar upload failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg border bg-card shadow-xs">
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
            </span>
            <span>Career AI</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost">
                <LayoutDashboard className="size-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost">
                <Briefcase className="size-4 mr-2" />
                Jobs
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">
                <UserRound className="size-4 mr-2" />
                Profile
              </Button>
            </Link>
            <NotificationBell />
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserRound className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                    {isEditing && (
                      <>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button
                          size="sm"
                          className="absolute bottom-0 right-0 rounded-full cursor-pointer"
                          variant="secondary"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {avatarFile && isEditing && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAvatarFile(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <h2 className="text-xl font-semibold">{formData.name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  {formData.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {formData.location}
                    </div>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    Software Developer
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resumes</span>
                  <span className="font-semibold">{stats.resumes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Skills</span>
                  <span className="font-semibold">{stats.skills}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recommendations</span>
                  <span className="font-semibold">{stats.recommendations}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="New York, NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumbers">Phone Numbers (one per line)</Label>
                  <textarea
                    id="phoneNumbers"
                    name="phoneNumbers"
                    value={formData.phoneNumbers}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    placeholder="+1 555-123-4567\n+1 555-987-6543"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                {lastLoginAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>Last login: {new Date(lastLoginAt).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-muted-foreground">Update your password</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Logout</h4>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete your account</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
