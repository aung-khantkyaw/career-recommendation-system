'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Briefcase,
  CheckCircle2,
  Edit,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStatusUpdates } from '@/hooks/use-status-updates'

type Career = {
  id: string
  title: string
  category: string
  description: string
  requiredSkills: string[]
  softSkills: string[]
  roadmap: unknown
  averageSalary: string
  active: boolean
  processingStatus: string
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

type CareerStats = {
  total: number
  active: number
  inactive: number
}

type CareerForm = {
  title: string
  category: string
  description: string
  requiredSkills: string
  softSkills: string
  averageSalary: string
  active: boolean
}

const emptyForm: CareerForm = {
  title: '',
  category: '',
  description: '',
  requiredSkills: '',
  softSkills: '',
  averageSalary: '',
  active: true,
}

const defaultStats: CareerStats = {
  total: 0,
  active: 0,
  inactive: 0,
}

export default function CareerDataPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [careers, setCareers] = useState<Career[]>([])
  const [stats, setStats] = useState<CareerStats>(defaultStats)
  const [form, setForm] = useState<CareerForm>(emptyForm)
  const [editingCareer, setEditingCareer] = useState<Career | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Real-time status updates
  const { getStatusForEntity } = useStatusUpdates()

  const fetchCareers = async (query = searchQuery, status = statusFilter) => {
    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('search', query.trim())
      if (status !== 'all') params.set('status', status)

      const url = params.size
        ? `/api/admin/careers?${params.toString()}`
        : '/api/admin/careers'
      const response = await fetch(url, { cache: 'no-store' })
      const data = (await response.json()) as {
        careers?: Career[]
        stats?: CareerStats
        error?: string
      }

      if (!response.ok || !data.careers || !data.stats) {
        throw new Error(data.error || 'Failed to fetch careers')
      }

      setCareers(data.careers)
      setStats(data.stats)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch careers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchCareers(searchQuery, statusFilter)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchQuery, statusFilter])

  const statCards = useMemo(
    () => [
      {
        label: 'Career Paths',
        value: stats.total.toLocaleString(),
        icon: Briefcase,
      },
      {
        label: 'Active Paths',
        value: stats.active.toLocaleString(),
        icon: CheckCircle2,
      },
      {
        label: 'Inactive Paths',
        value: stats.inactive.toLocaleString(),
        icon: ToggleLeft,
      },
    ],
    [stats]
  )

  const openCreateForm = () => {
    setEditingCareer(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (career: Career) => {
    setEditingCareer(career)
    setForm({
      title: career.title,
      category: career.category,
      description: career.description,
      requiredSkills: career.requiredSkills.join(', '),
      softSkills: career.softSkills.join(', '),
      averageSalary: career.averageSalary,
      active: career.active,
    })
    setIsFormOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
    > = {
      PENDING: { variant: 'secondary' },
      PROCESSING: { variant: 'default', className: 'bg-blue-600' },
      COMPLETED: { variant: 'default', className: 'bg-green-600' },
      FAILED: { variant: 'destructive' },
    }
    const badge = variants[status] || { variant: 'outline' as const }
    return <Badge variant={badge.variant} className={badge.className}>{status}</Badge>
  }

  const getRealTimeStatus = (career: Career) => {
    return getStatusForEntity('CAREER_PATH', career.id) || career.processingStatus
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCareer(null)
    setForm(emptyForm)
  }

  const updateForm = (field: keyof CareerForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveCareer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const payload = {
      ...form,
      requiredSkills: form.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      softSkills: form.softSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }

    try {
      const response = await fetch(
        editingCareer
          ? `/api/admin/careers?id=${editingCareer.id}`
          : '/api/admin/careers',
        {
          method: editingCareer ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save career path')
      }

      toast.success(
        editingCareer
          ? 'Career path updated successfully.'
          : 'Career path created successfully.'
      )
      closeForm()
      await fetchCareers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save career path')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteCareer = async (career: Career) => {
    const confirmed = window.confirm(
      `Delete career path "${career.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/careers?id=${career.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete career path')
      }

      toast.success('Career path deleted successfully.')
      await fetchCareers()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete career path'
      )
    }
  }

  const toggleActive = async (career: Career) => {
    try {
      const response = await fetch(`/api/admin/careers/${career.id}/toggle-active`, {
        method: 'PATCH',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle career status')
      }

      toast.success('Career status updated successfully.')
      await fetchCareers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle career status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Career Data Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage career paths, skill requirements, job market data, and AI
            guidance content.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchCareers()}
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
            Add Career Path
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isFormOpen ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingCareer ? 'Edit Career Path' : 'Create Career Path'}
              </CardTitle>
              <CardDescription>
                Keep career data clear, searchable, and useful for AI guidance.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={closeForm}>
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close form</span>
            </Button>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={saveCareer}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  id="title"
                  label="Career title"
                  value={form.title}
                  onChange={(value) => updateForm('title', value)}
                  placeholder="Data Analyst"
                  required
                />
                <Field
                  id="category"
                  label="Category"
                  value={form.category}
                  onChange={(value) => updateForm('category', value)}
                  placeholder="Data"
                  required
                />
                <Field
                  id="averageSalary"
                  label="Average salary"
                  value={form.averageSalary}
                  onChange={(value) => updateForm('averageSalary', value)}
                  placeholder="$85,000"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextAreaField
                  id="requiredSkills"
                  label="Required skills"
                  value={form.requiredSkills}
                  onChange={(value) => updateForm('requiredSkills', value)}
                  placeholder="Python, SQL, Excel, Data Visualization"
                  required
                />
                <TextAreaField
                  id="softSkills"
                  label="Soft skills"
                  value={form.softSkills}
                  onChange={(value) => updateForm('softSkills', value)}
                  placeholder="Communication, Problem Solving, Teamwork"
                />
              </div>

              <TextAreaField
                id="description"
                label="Description"
                value={form.description}
                onChange={(value) => updateForm('description', value)}
                placeholder="Describe what students should know about this career path."
                required
              />

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant={form.active ? 'default' : 'outline'}
                  onClick={() => updateForm('active', !form.active)}
                >
                  {form.active ? 'Active' : 'Inactive'}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving
                      ? 'Saving...'
                      : editingCareer
                        ? 'Update Career'
                        : 'Create Career'}
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
              <CardTitle>All Career Paths</CardTitle>
              <CardDescription>
                Search, edit, activate, or remove career paths from the catalog.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search careers..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 sm:w-72"
                />
              </div>
              <div className="flex rounded-lg border bg-background p-1">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Career Path</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {careers.length ? (
                careers.map((career) => (
                  <TableRow key={career.id}>
                    <TableCell>
                      <div className="max-w-64">
                        <div className="font-medium">{career.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {career.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{career.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-56 flex-wrap gap-1">
                        {career.requiredSkills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {career.requiredSkills.length > 3 ? (
                          <Badge variant="outline">
                            +{career.requiredSkills.length - 3}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{career.averageSalary}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(career)}
                        className="flex items-center gap-2"
                      >
                        {career.active ? (
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
                    <TableCell>
                      {getStatusBadge(getRealTimeStatus(career))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditForm(career)}
                        >
                          <Edit className="size-4" aria-hidden="true" />
                          <span className="sr-only">Edit {career.title}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteCareer(career)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          <span className="sr-only">Delete {career.title}</span>
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
                    {isLoading ? 'Loading career paths...' : 'No career paths found.'}
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
  step,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  min?: string
  step?: string
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
        step={step}
      />
    </div>
  )
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={4}
      />
    </div>
  )
}
