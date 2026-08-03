'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, BriefcaseBusiness, MapPin, DollarSign, Clock, Building2, UserRound, LogOut, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

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
  careerPath: {
    id: string
    title: string
    category: string
  } | null
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'active') // Only show active jobs
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (locationFilter.trim()) params.set('search', locationFilter.trim())

      const url = params.size
        ? `/api/jobs?${params.toString()}`
        : '/api/jobs?status=active'

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

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchJobs()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, typeFilter, locationFilter])

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

  const getExperienceBadge = (level: string | null) => {
    if (!level) return null
    const colors: Record<string, string> = {
      'Entry Level': 'bg-green-500',
      'Mid Level': 'bg-blue-500',
      'Senior Level': 'bg-purple-500',
      'Executive': 'bg-red-500',
    }
    return (
      <Badge variant="secondary" className={colors[level] || 'bg-gray-500'}>
        {level}
      </Badge>
    )
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
            <Link href="/profile">
              <Button variant="ghost">
                <UserRound className="size-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Career Opportunities</h1>
            <p className="text-muted-foreground mt-2">Find your perfect career match</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {jobs.length} Active Jobs
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by job title, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || 'all')}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Job Type" />
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
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading job opportunities...</p>
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BriefcaseBusiness className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or check back later.</p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium">{job.company}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {getJobTypeBadge(job.type)}
                      {getExperienceBadge(job.experienceLevel)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.salaryRange || job.salary || 'Competitive'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Posted {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                    {job.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Expires {new Date(job.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {job.careerPath && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        {job.careerPath.category} • {job.careerPath.title}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )))}
        </div>
      </main>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedJob(null)}>
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{selectedJob.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{selectedJob.company}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {selectedJob.location}
                    </span>
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {getJobTypeBadge(selectedJob.type)}
                {getExperienceBadge(selectedJob.experienceLevel)}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="ml-2 font-medium">{selectedJob.salaryRange || selectedJob.salary || 'Competitive'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Experience:</span>
                  <span className="ml-2 font-medium">{selectedJob.experienceLevel || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Posted:</span>
                  <span className="ml-2 font-medium">{new Date(selectedJob.postedAt).toLocaleDateString()}</span>
                </div>
                {selectedJob.expiresAt && (
                  <div>
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="ml-2 font-medium">{new Date(selectedJob.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedJob.phoneNumbers && selectedJob.phoneNumbers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Contact Numbers</h3>
                  <div className="space-y-1">
                    {selectedJob.phoneNumbers.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.emails && selectedJob.emails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Email Addresses</h3>
                  <div className="space-y-1">
                    {selectedJob.emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.careerPath && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Related Career Path</h3>
                  <p className="text-muted-foreground">{selectedJob.careerPath.category} • {selectedJob.careerPath.title}</p>
                </div>
              )}

              <Button className="w-full" size="lg">
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
