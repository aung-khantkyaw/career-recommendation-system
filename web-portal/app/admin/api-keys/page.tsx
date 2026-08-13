'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, RefreshCw, Key, X, Clock, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'

interface ApiKey {
  id: string
  provider: string
  llmModelName: string | null
  embeddingModelName: string | null
  apiKey: string
  limit: number
  used: number
  expiresAt: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

type ApiKeyForm = {
  provider: string
  llmModelName: string
  embeddingModelName: string
  apiKey: string
  limit: string
  expiresAt: string
}

const emptyForm: ApiKeyForm = {
  provider: 'OPENAI',
  llmModelName: '',
  embeddingModelName: '',
  apiKey: '',
  limit: '0',
  expiresAt: '',
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [form, setForm] = useState<ApiKeyForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const fetchApiKeys = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (providerFilter !== 'all') params.set('provider', providerFilter)
      if (activeFilter !== 'all') params.set('active', activeFilter)

      const url = params.size
        ? `/api/admin/api-keys?${params.toString()}`
        : '/api/admin/api-keys'

      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [providerFilter, activeFilter])

  const openCreateForm = () => {
    setEditingKey(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (apiKey: ApiKey) => {
    setEditingKey(apiKey)
    setForm({
      provider: apiKey.provider,
      llmModelName: apiKey.llmModelName || '',
      embeddingModelName: apiKey.embeddingModelName || '',
      apiKey: apiKey.apiKey,
      limit: String(apiKey.limit),
      expiresAt: apiKey.expiresAt ? new Date(apiKey.expiresAt).toISOString().split('T')[0] : '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingKey(null)
    setForm(emptyForm)
  }

  const updateForm = (field: keyof ApiKeyForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const payload = {
      ...form,
      limit: Number(form.limit),
      expiresAt: form.expiresAt || null,
    }

    try {
      const response = await fetch(
        editingKey
          ? `/api/admin/api-keys/${editingKey.id}`
          : '/api/admin/api-keys',
        {
          method: editingKey ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key')
      }

      toast.success(
        editingKey
          ? 'API key updated successfully.'
          : 'API key created successfully.'
      )
      closeForm()
      fetchApiKeys()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteApiKey = async (apiKey: ApiKey) => {
    const modelNames = [apiKey.llmModelName, apiKey.embeddingModelName].filter(Boolean).join(' / ')
    const confirmed = window.confirm(
      `Delete API key for ${modelNames}? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete API key')
      }

      toast.success('API key deleted successfully.')
      fetchApiKeys()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete API key')
    }
  }

  const toggleActive = async (apiKey: ApiKey) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}/toggle-active`, {
        method: 'PATCH',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle API key status')
      }

      toast.success('API key status updated successfully.')
      fetchApiKeys()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle API key status')
    }
  }

  const handleRefresh = () => {
    fetchApiKeys()
  }

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      OPENAI: 'bg-green-500',
      ANTHROPIC: 'bg-purple-500',
      GOOGLE: 'bg-blue-500',
      OPENROUTER: 'bg-orange-500',
      CUSTOM: 'bg-gray-500',
    }
    return (
      <Badge variant="default" className={colors[provider] || 'bg-gray-500'}>
        {provider}
      </Badge>
    )
  }

  const filteredApiKeys = apiKeys.filter((key) => {
    const searchLower = searchQuery.toLowerCase()
    const modelNames = [key.llmModelName, key.embeddingModelName].filter(Boolean).join(' ').toLowerCase()
    return (
      modelNames.includes(searchLower) ||
      key.provider.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            API Keys Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage AI provider API keys for the system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="size-4" aria-hidden="true" />
            Add API Key
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold">{apiKeys.length}</div>
              <div className="text-sm text-muted-foreground">Total Keys</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Key className="size-5" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold text-green-600">{apiKeys.filter(k => k.active).length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <CheckCircle2 className="size-5 text-green-600" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold text-red-600">{apiKeys.filter(k => !k.active).length}</div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Clock className="size-5 text-red-600" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold text-blue-600">{apiKeys.filter(k => k.expiresAt && new Date(k.expiresAt) > new Date()).length}</div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Clock className="size-5 text-blue-600" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      </div>

      {isFormOpen ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingKey ? 'Edit API Key' : 'Add API Key'}
              </CardTitle>
              <CardDescription>
                Configure AI provider API keys for the system.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={closeForm}>
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close form</span>
            </Button>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={saveApiKey}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={form.provider} onValueChange={(value) => updateForm('provider', value || 'OPENAI')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPENAI">OpenAI</SelectItem>
                      <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                      <SelectItem value="GOOGLE">Google</SelectItem>
                      <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field
                  id="llmModelName"
                  label="LLM Model Name"
                  value={form.llmModelName}
                  onChange={(value) => updateForm('llmModelName', value)}
                  placeholder="gpt-4, gemini-2.5-flash, etc."
                />
                <Field
                  id="embeddingModelName"
                  label="Embedding Model Name"
                  value={form.embeddingModelName}
                  onChange={(value) => updateForm('embeddingModelName', value)}
                  placeholder="text-embedding-3-small, gemini-embedding-2, etc."
                />
                <Field
                  id="apiKey"
                  label="API Key"
                  value={form.apiKey}
                  onChange={(value) => updateForm('apiKey', value)}
                  placeholder="sk-..."
                  required
                  type="password"
                />
                <Field
                  id="limit"
                  label="Usage Limit (0 = unlimited)"
                  value={form.limit}
                  onChange={(value) => updateForm('limit', value)}
                  type="number"
                  min="0"
                />
                <Field
                  id="expiresAt"
                  label="Expiration Date"
                  value={form.expiresAt}
                  onChange={(value) => updateForm('expiresAt', value)}
                  type="date"
                />
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving
                      ? 'Saving...'
                      : editingKey
                        ? 'Update API Key'
                        : 'Add API Key'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All API Keys</CardTitle>
              <CardDescription>
                Manage and monitor AI provider API keys.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search keys..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 sm:w-72 h-12"
                />
              </div>
              <div className="flex rounded-lg border bg-background p-1">
                {(['all', 'true', 'false'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={activeFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveFilter(status)}
                  >
                    {status === 'all' ? 'All' : status === 'true' ? 'Active' : 'Inactive'}
                  </Button>
                ))}
              </div>
              <Select value={providerFilter} onValueChange={(value) => setProviderFilter(value || 'all')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>LLM Model</TableHead>
                <TableHead>Embedding Model</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApiKeys.length ? (
                filteredApiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{getProviderBadge(key.provider)}</TableCell>
                    <TableCell className="font-medium">{key.llmModelName || '-'}</TableCell>
                    <TableCell className="font-medium">{key.embeddingModelName || '-'}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.apiKey.slice(0, 8)}...{key.apiKey.slice(-4)}
                      </code>
                    </TableCell>
                    <TableCell>
                      {key.limit === 0 ? (
                        <span className="text-muted-foreground">Unlimited</span>
                      ) : (
                        <span>{key.used} / {key.limit}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.expiresAt ? (
                        <span className={new Date(key.expiresAt) < new Date() ? 'text-red-600' : ''}>
                          {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(key)}
                        className="flex items-center gap-2"
                      >
                        {key.active ? (
                          <>
                            <ToggleRight className="size-5 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="size-5 text-muted-foreground" />
                            <span className="text-muted-foreground">Inactive</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditForm(key)}
                        >
                          <Edit className="size-4" aria-hidden="true" />
                          <span className="sr-only">Edit API key</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteApiKey(key)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          <span className="sr-only">Delete API key</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {isLoading ? 'Loading API keys...' : 'No API keys found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  min,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  min?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
      />
    </div>
  )
}
