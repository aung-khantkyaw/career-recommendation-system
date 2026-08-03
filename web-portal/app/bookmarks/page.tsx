'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookmarkCheck, BriefcaseBusiness, MapPin, DollarSign, Clock, Building2, UserRound, Trash2, LayoutDashboard, Briefcase, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notification-bell'

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

interface Bookmark {
  id: string
  job: Job
  createdAt: string
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const fetchBookmarks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/bookmarks')
      const data = await response.json()

      if (response.ok) {
        setBookmarks(data.bookmarks)
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeBookmark = async (bookmarkId: string) => {
    try {
      await fetch(`/api/user/bookmarks/${bookmarkId}`, { method: 'DELETE' })
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      FULL_TIME: 'bg-blue-100 text-blue-700 border-blue-300',
      PART_TIME: 'bg-green-100 text-green-700 border-green-300',
      CONTRACT: 'bg-purple-100 text-purple-700 border-purple-300',
      INTERNSHIP: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      REMOTE: 'bg-teal-100 text-teal-700 border-teal-300',
    }
    const label = type.replace('_', ' ')
    return (
      <Badge variant="outline" className={`${colors[type] || 'bg-gray-100 text-gray-700 border-gray-300'} font-medium`}>
        {label}
      </Badge>
    )
  }

  const getExperienceBadge = (level: string | null) => {
    if (!level) return null
    const colors: Record<string, string> = {
      'Entry Level': 'bg-emerald-100 text-emerald-700 border-emerald-300',
      'Mid Level': 'bg-blue-100 text-blue-700 border-blue-300',
      'Senior Level': 'bg-violet-100 text-violet-700 border-violet-300',
      'Executive': 'bg-red-100 text-red-700 border-red-300',
    }
    return (
      <Badge variant="outline" className={`${colors[level] || 'bg-gray-100 text-gray-700 border-gray-300'} font-medium`}>
        {level}
      </Badge>
    )
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/jobs" className="flex items-center gap-2 font-semibold">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Saved Jobs</h1>
            <p className="text-muted-foreground mt-2">Your bookmarked career opportunities</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full">
              {bookmarks.length} Bookmarked Jobs
            </Button>
          </div>
        </div>

        {/* Job Listings */}
        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading saved jobs...</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookmarkCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
                <p className="text-muted-foreground mb-4">Start bookmarking jobs from the careers page to see them here.</p>
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedJob(bookmark.job)}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{bookmark.job.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium">{bookmark.job.company}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {bookmark.job.location}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {getJobTypeBadge(bookmark.job.type)}
                      {getExperienceBadge(bookmark.job.experienceLevel)}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBookmark(bookmark.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{bookmark.job.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {bookmark.job.salaryRange || bookmark.job.salary || 'Competitive'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                    </span>
                    {bookmark.job.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Expires {new Date(bookmark.job.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {bookmark.job.careerPath && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        {bookmark.job.careerPath.category} • {bookmark.job.careerPath.title}
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

              {selectedJob.careerPath && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Related Career Path</h3>
                  <p className="text-muted-foreground">{selectedJob.careerPath.category} • {selectedJob.careerPath.title}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
