'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, ArrowLeft, Loader2, Plus, Edit, Save } from 'lucide-react'
import Link from 'next/link'

interface SystemConfig {
  id: string
  key: string
  value: string
  description: string | null
  category: string
  updatedAt: string
}

export default function AdminSystemConfigPage() {
  const [configs, setConfigs] = useState<Record<string, SystemConfig[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null)
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: 'GENERAL',
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfigs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/system-config', { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setConfigs(data.configs)
      }
    } catch (error) {
      console.error('Failed to fetch system configs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const openCreateDialog = (category: string) => {
    setEditingConfig(null)
    setFormData({
      key: '',
      value: '',
      description: '',
      category,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (config: SystemConfig) => {
    setEditingConfig(config)
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description || '',
      category: config.category,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingConfig(null)
    setFormData({
      key: '',
      value: '',
      description: '',
      category: 'GENERAL',
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/system-config', {
        method: editingConfig ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchConfigs()
        closeDialog()
      }
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const categoryIcons: Record<string, string> = {
    AI: '🤖',
    RATE_LIMIT: '⚡',
    GENERAL: '⚙️',
    NOTIFICATION: '🔔',
  }

  const categoryDescriptions: Record<string, string> = {
    AI: 'AI service configuration and settings',
    RATE_LIMIT: 'API rate limiting and throttling',
    GENERAL: 'General system settings',
    NOTIFICATION: 'Notification system settings',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">System Configuration</h1>
          <p className="mt-2 text-muted-foreground">
            Manage AI settings, rate limits, and system-wide configuration
          </p>
        </div>
        <Button onClick={fetchConfigs} disabled={isLoading}>
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.keys(categoryIcons).map((category) => {
            const items = configs[category] || []
            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{categoryIcons[category] || '⚙️'}</span>
                      <div>
                        <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
                        <CardDescription>{categoryDescriptions[category] || ''}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreateDialog(category)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((config) => (
                      <div key={config.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{config.key}</span>
                            {config.description && (
                              <span className="text-xs text-muted-foreground">- {config.description}</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 font-mono">
                            {config.value}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No configurations in this category
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit Configuration' : 'Add Configuration'}</DialogTitle>
            <DialogDescription>
              {editingConfig ? 'Update the system configuration.' : 'Add a new system configuration.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value || 'AI' })}
                disabled={!!editingConfig}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="RATE_LIMIT">Rate Limit</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="NOTIFICATION">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Configuration Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., MAX_TOKENS, RATE_LIMIT_PER_MINUTE"
                disabled={!!editingConfig}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Configuration value..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this configuration"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.key || !formData.value}>
                {isSaving ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
