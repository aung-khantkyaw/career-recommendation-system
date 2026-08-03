'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Mail, ArrowLeft, Loader2, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface EmailConfig {
  id: string
  provider: string
  host: string | null
  port: number | null
  username: string | null
  password: string | null
  fromEmail: string | null
  fromName: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminEmailConfigPage() {
  const [configs, setConfigs] = useState<EmailConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null)
  const [formData, setFormData] = useState({
    provider: 'SMTP',
    host: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    active: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfigs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/email-config', { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setConfigs(data.configs)
      }
    } catch (error) {
      console.error('Failed to fetch email configs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const openCreateDialog = () => {
    setEditingConfig(null)
    setFormData({
      provider: 'SMTP',
      host: '',
      port: '587',
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (config: EmailConfig) => {
    setEditingConfig(config)
    setFormData({
      provider: config.provider,
      host: config.host || '',
      port: config.port?.toString() || '587',
      username: config.username || '',
      password: config.password || '',
      fromEmail: config.fromEmail || '',
      fromName: config.fromName || '',
      active: config.active,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingConfig(null)
    setFormData({
      provider: 'SMTP',
      host: '',
      port: '587',
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      active: true,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(
        editingConfig ? `/api/admin/email-config?id=${editingConfig.id}` : '/api/admin/email-config',
        {
          method: editingConfig ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

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

  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this email configuration?')) return

    try {
      const response = await fetch(`/api/admin/email-config?id=${configId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setConfigs(configs.filter(c => c.id !== configId))
      }
    } catch (error) {
      console.error('Failed to delete config:', error)
    }
  }

  const handleSetActive = async (configId: string) => {
    try {
      const response = await fetch(`/api/admin/email-config?id=${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      })
      if (response.ok) {
        setConfigs(configs.map(c => ({ ...c, active: c.id === configId })))
      }
    } catch (error) {
      console.error('Failed to set active config:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Email Service Configuration</h1>
          <p className="mt-2 text-muted-foreground">
            Configure SMTP and email service settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchConfigs} disabled={isLoading}>
            <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Configuration
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : configs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email configurations</h3>
            <p className="text-muted-foreground mb-4">Add an email configuration to enable email notifications.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id} className={config.active ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.provider}
                        {config.active && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {config.host}:{config.port}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!config.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(config.id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-medium">{config.username || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From Email:</span>
                    <span className="font-medium">{config.fromEmail || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From Name:</span>
                    <span className="font-medium">{config.fromName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{new Date(config.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}</DialogTitle>
            <DialogDescription>
              {editingConfig ? 'Update the email service configuration.' : 'Add a new email service configuration.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value || 'SMTP' })}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMTP">SMTP</SelectItem>
                  <SelectItem value="SENDGRID">SendGrid</SelectItem>
                  <SelectItem value="MAILGUN">Mailgun</SelectItem>
                  <SelectItem value="AWS_SES">AWS SES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="587"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  placeholder="Career System"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active">Set as active configuration</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.host || !formData.port}>
                {isSaving ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
