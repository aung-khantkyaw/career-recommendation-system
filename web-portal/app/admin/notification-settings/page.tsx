'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

interface NotificationSettings {
  emailEnabled: boolean
  pushEnabled: boolean
  jobMatchNotifications: boolean
  resumeProcessedNotifications: boolean
  systemNotifications: boolean
  emailFromAddress: string
  emailFromName: string
  notificationFrequency: string
}

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    pushEnabled: false,
    jobMatchNotifications: true,
    resumeProcessedNotifications: true,
    systemNotifications: true,
    emailFromAddress: 'noreply@career-system.com',
    emailFromName: 'Career Recommendation System',
    notificationFrequency: 'immediate',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use the default settings
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // In a real implementation, this would save to the database
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Notification settings saved successfully!')
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleChange = (key: keyof NotificationSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Notification Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure email and push notification preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Loader2 className={`mr-2 h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Configure overall notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailEnabled">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable email notifications for users</p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={settings.emailEnabled}
                  onCheckedChange={() => handleToggle('emailEnabled')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushEnabled">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable in-app push notifications</p>
                </div>
                <Switch
                  id="pushEnabled"
                  checked={settings.pushEnabled}
                  onCheckedChange={() => handleToggle('pushEnabled')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notificationFrequency">Default Frequency</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={(value) => handleChange('notificationFrequency', value || 'immediate')}
                >
                  <SelectTrigger id="notificationFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>Configure which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="jobMatchNotifications">Job Matches</Label>
                  <p className="text-sm text-muted-foreground">Notify users of matching job opportunities</p>
                </div>
                <Switch
                  id="jobMatchNotifications"
                  checked={settings.jobMatchNotifications}
                  onCheckedChange={() => handleToggle('jobMatchNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="resumeProcessedNotifications">Resume Processing</Label>
                  <p className="text-sm text-muted-foreground">Notify when resume analysis is complete</p>
                </div>
                <Switch
                  id="resumeProcessedNotifications"
                  checked={settings.resumeProcessedNotifications}
                  onCheckedChange={() => handleToggle('resumeProcessedNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemNotifications">System Updates</Label>
                  <p className="text-sm text-muted-foreground">Send system-wide announcements</p>
                </div>
                <Switch
                  id="systemNotifications"
                  checked={settings.systemNotifications}
                  onCheckedChange={() => handleToggle('systemNotifications')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email sender details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailFromAddress">From Email Address</Label>
                  <Input
                    id="emailFromAddress"
                    type="email"
                    value={settings.emailFromAddress}
                    onChange={(e) => handleChange('emailFromAddress', e.target.value)}
                    placeholder="noreply@career-system.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFromName">From Name</Label>
                  <Input
                    id="emailFromName"
                    value={settings.emailFromName}
                    onChange={(e) => handleChange('emailFromName', e.target.value)}
                    placeholder="Career Recommendation System"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
