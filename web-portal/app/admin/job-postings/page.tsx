'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, Plus, Edit, Trash2, RefreshCw, Briefcase, MapPin, DollarSign, Clock, X, ToggleLeft, ToggleRight, Download, Loader2 } from 'lucide-react'
import { useStatusUpdates } from '@/hooks/use-status-updates'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  status: string
  description: string
  requirements: string[]
  salary: string | null
  salaryRange: string | null
  experienceLevel: string | null
  phoneNumbers: string[]
  emails: string[]
  postedAt: string
  expiresAt: string | null
  processingStatus: string
  processedAt: string | null
  careerPath: {
    id: string
    title: string
    category: string
  } | null
}

type JobForm = {
  title: string
  company: string
  location: string
  type: string
  status: string
  description: string
  requirements: string
  salary: string
  salaryRange: string
  experienceLevel: string
  phoneNumbers: string
  emails: string
  careerPathId: string
  expiresAt: string
}

const emptyForm: JobForm = {
  title: '',
  company: '',
  location: '',
  type: 'FULL_TIME',
  status: 'ACTIVE',
  description: '',
  requirements: '',
  salary: '',
  salaryRange: '',
  experienceLevel: '',
  phoneNumbers: '',
  emails: '',
  careerPathId: '',
  expiresAt: '',
}

export default function JobPostingsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [careerPaths, setCareerPaths] = useState<any[]>([])
  const [form, setForm] = useState<JobForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Real-time status updates
  const { getStatusForEntity } = useStatusUpdates()

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const url = params.size
        ? `/api/admin/job-postings?${params.toString()}`
        : '/api/admin/job-postings'

      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCareerPaths = async () => {
    try {
      const response = await fetch('/api/admin/careers')
      const data = await response.json()
      if (response.ok) {
        setCareerPaths(data.careers || [])
      }
    } catch (error) {
      console.error('Failed to fetch career paths:', error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchCareerPaths()
  }, [])

  const openCreateForm = () => {
    setEditingJob(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (job: Job) => {
    setEditingJob(job)
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      status: job.status,
      description: job.description,
      requirements: job.requirements.join('\n'),
      salary: job.salary || '',
      salaryRange: job.salaryRange || '',
      experienceLevel: job.experienceLevel || '',
      phoneNumbers: job.phoneNumbers.join('\n'),
      emails: job.emails.join('\n'),
      careerPathId: job.careerPath?.id || '',
      expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingJob(null)
    setForm(emptyForm)
  }

  const updateForm = (field: keyof JobForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: 'secondary',
      PROCESSING: 'default bg-blue-600',
      COMPLETED: 'default bg-green-600',
      FAILED: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getRealTimeStatus = (job: Job) => {
    return getStatusForEntity('JOB', job.id) || job.processingStatus
  }

  const saveJob = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const payload = {
      ...form,
      requirements: form.requirements.split('\n').filter(r => r.trim()),
      phoneNumbers: form.phoneNumbers.split('\n').filter(p => p.trim()),
      emails: form.emails.split('\n').filter(e => e.trim()),
      careerPathId: form.careerPathId || null,
      expiresAt: form.expiresAt || null,
    }

    try {
      const response = await fetch(
        editingJob
          ? `/api/admin/job-postings/${editingJob.id}`
          : '/api/admin/job-postings',
        {
          method: editingJob ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save job posting')
      }

      toast.success(
        editingJob
          ? 'Job posting updated successfully.'
          : 'Job posting created successfully.'
      )
      closeForm()
      fetchJobs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save job posting')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteJob = async (job: Job) => {
    const confirmed = window.confirm(
      `Delete job posting "${job.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/job-postings/${job.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job posting')
      }

      toast.success('Job posting deleted successfully.')
      fetchJobs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete job posting')
    }
  }

  const toggleActive = async (job: Job) => {
    try {
      const response = await fetch(`/api/admin/job-postings/${job.id}/toggle-active`, {
        method: 'PATCH',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle job posting status')
      }

      toast.success('Job posting status updated successfully.')
      fetchJobs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle job posting status')
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchJobs()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, statusFilter, typeFilter])

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      FULL_TIME: 'bg-blue-500',
      PART_TIME: 'bg-green-500',
      CONTRACT: 'bg-purple-500',
      INTERNSHIP: 'bg-yellow-500',
      REMOTE: 'bg-teal-500',
    }
    return (
      <Badge variant="default" className={colors[type] || 'bg-gray-500'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getJobStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-500',
      CLOSED: 'bg-red-500',
      DRAFT: 'bg-gray-500',
    }
    return (
      <Badge variant={status === 'ACTIVE' ? 'default' : status === 'CLOSED' ? 'destructive' : 'secondary'} 
             className={colors[status] || 'bg-gray-500'}>
        {status.toLowerCase()}
      </Badge>
    )
  }

  const handleRefresh = () => {
    fetchJobs()
  }

  const exportJobs = async () => {
    setIsExporting(true)
    try {
      const csvContent = [
        ['Title', 'Company', 'Location', 'Type', 'Status', 'Salary', 'Salary Range', 'Experience Level', 'Posted Date', 'Expires Date', 'Requirements', 'Phone Numbers', 'Emails', 'Career Path'].join(','),
        ...jobs.map(j => [
          j.title,
          j.company,
          j.location,
          j.type,
          j.status,
          j.salary || '',
          j.salaryRange || '',
          j.experienceLevel || '',
          new Date(j.postedAt).toLocaleDateString(),
          j.expiresAt ? new Date(j.expiresAt).toLocaleDateString() : '',
          j.requirements.join('; '),
          j.phoneNumbers.join('; '),
          j.emails.join('; '),
          j.careerPath?.title || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobs_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export jobs:', error)
      toast.error('Failed to export jobs')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    handleRefresh()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Job Postings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage job listings and career opportunities.
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
          <Button
            variant="outline"
            onClick={exportJobs}
            disabled={isExporting || jobs.length === 0}
          >
            {isExporting ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Download className="size-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="size-4" aria-hidden="true" />
            Add Job
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold">{jobs.length}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Briefcase className="size-5" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold text-green-600">{jobs.filter(j => j.status === 'ACTIVE').length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Clock className="size-5 text-green-600" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold text-red-600">{jobs.filter(j => j.status === 'CLOSED').length}</div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Clock className="size-5 text-red-600" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-2xl font-semibold text-purple-600">{jobs.filter(j => j.type === 'FULL_TIME').length}</div>
              <div className="text-sm text-muted-foreground">Full-time</div>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Briefcase className="size-5 text-purple-600" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      </div>

      {isFormOpen ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
              </CardTitle>
              <CardDescription>
                Add or update job listings for students.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={closeForm}>
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close form</span>
            </Button>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={saveJob}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  id="title"
                  label="Job Title"
                  value={form.title}
                  onChange={(value) => updateForm('title', value)}
                  placeholder="Software Engineer"
                  required
                />
                <Field
                  id="company"
                  label="Company"
                  value={form.company}
                  onChange={(value) => updateForm('company', value)}
                  placeholder="Company Name"
                  required
                />
                <Field
                  id="location"
                  label="Location"
                  value={form.location}
                  onChange={(value) => updateForm('location', value)}
                  placeholder="Remote / New York, NY"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="type">Job Type</Label>
                    <Select value={form.type} onValueChange={(value) => updateForm('type', value || 'FULL_TIME')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full-time</SelectItem>
                        <SelectItem value="PART_TIME">Part-time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        <SelectItem value="REMOTE">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={(value) => updateForm('status', value || 'ACTIVE')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Field
                  id="salary"
                  label="Salary"
                  value={form.salary}
                  onChange={(value) => updateForm('salary', value)}
                  placeholder="$80,000"
                />
                <Field
                  id="salaryRange"
                  label="Salary Range"
                  value={form.salaryRange}
                  onChange={(value) => updateForm('salaryRange', value)}
                  placeholder="$80,000 - $120,000"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select value={form.experienceLevel} onValueChange={(value) => updateForm('experienceLevel', value || '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                        <SelectItem value="Mid Level">Mid Level</SelectItem>
                        <SelectItem value="Senior Level">Senior Level</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    id="expiresAt"
                    label="Expiration Date"
                    value={form.expiresAt}
                    onChange={(value) => updateForm('expiresAt', value)}
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="careerPath">Career Path</Label>
                  <Select value={form.careerPathId} onValueChange={(value) => updateForm('careerPathId', value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select career path" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {careerPaths.map((cp) => (
                        <SelectItem key={cp.id} value={cp.id}>
                          {cp.title} ({cp.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TextAreaField
                id="description"
                label="Description"
                value={form.description}
                onChange={(value) => updateForm('description', value)}
                placeholder="Job description..."
                required
              />

              <TextAreaField
                id="requirements"
                label="Requirements (one per line)"
                value={form.requirements}
                onChange={(value) => updateForm('requirements', value)}
                placeholder="JavaScript\nReact\n3+ years experience"
                required
              />

              <TextAreaField
                id="phoneNumbers"
                label="Phone Numbers (one per line)"
                value={form.phoneNumbers}
                onChange={(value) => updateForm('phoneNumbers', value)}
                placeholder="+1 555-123-4567\n+1 555-987-6543"
              />

              <TextAreaField
                id="emails"
                label="Email Addresses (one per line)"
                value={form.emails}
                onChange={(value) => updateForm('emails', value)}
                placeholder="hr@company.com\nrecruiting@company.com"
              />

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving
                      ? 'Saving...'
                      : editingJob
                        ? 'Update Job'
                        : 'Create Job'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All Job Postings</CardTitle>
              <CardDescription>
                Search, edit, or remove job listings from the catalog.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 sm:w-72 h-12"
                />
              </div>
              <div className="flex rounded-lg border bg-background p-1">
                {(['all', 'active', 'closed'] as const).map((status) => (
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
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || 'all')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>AI Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length ? (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {job.location}
                      </div>
                    </TableCell>
                    <TableCell>{getJobTypeBadge(job.type)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(job)}
                        className="flex items-center gap-2"
                      >
                        {job.status === 'ACTIVE' ? (
                          <>
                            <ToggleRight className="size-5 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="size-5 text-muted-foreground" />
                            <span className="text-muted-foreground">Closed</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        {job.salaryRange || job.salary || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(job.postedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(getRealTimeStatus(job))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditForm(job)}
                        >
                          <Edit className="size-4" aria-hidden="true" />
                          <span className="sr-only">Edit {job.title}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteJob(job)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          <span className="sr-only">Delete {job.title}</span>
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
                    {isLoading ? 'Loading job postings...' : 'No job postings found.'}
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
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
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
