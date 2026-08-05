'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { ResumeDropzone } from '@/components/ui/dropzone'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { BriefcaseBusiness, TrendingUp, Upload, UserRound, LogOut, RefreshCw, CheckCircle2, Loader2, MapPin, DollarSign, Clock, FileText, Download, Trash2, LayoutDashboard, Briefcase, Eye } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { NotificationBell } from '@/components/notification-bell'

interface Recommendation {
  id: string
  jobTitle: string
  company: string
  matchScore: number
  skillsMatched: string[]
  description: string
  careerPath?: string
  category?: string
}

interface Skill {
  name: string
  level: number
}

interface RecentJob {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string | null
  salaryRange: string | null
  postedAt: string
}

interface Resume {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  processingStatus: string
  skills: any
  experience: any
  education: any
  processedAt: string | null
  createdAt: string
  recommendations: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [stats, setStats] = useState({ totalResumes: 0, completedResumes: 0, processingResumes: 0, totalSkills: 0 })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState('')
  const [previewResume, setPreviewResume] = useState<Resume | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard')
      const data = await response.json()

      if (response.ok) {
        setRecommendations(data.recommendations || [])
        setSkills(data.skills?.all?.map((s: string) => ({ name: s, level: 75 })) || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/user/resumes')
      const data = await response.json()

      if (response.ok) {
        setResumes(data.resumes || [])
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    }
  }

  const fetchRecentJobs = async () => {
    try {
      const response = await fetch('/api/jobs?status=active')
      const data = await response.json()

      if (response.ok) {
        setRecentJobs(data.jobs?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    fetchRecentJobs()
    fetchResumes()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
    await fetchResumes()
    setIsRefreshing(false)
  }

  const handleDownloadResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/user/resumes/${resumeId}/download`)
      const data = await response.json()

      if (response.ok) {
        window.open(data.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Failed to download resume:', error)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      const response = await fetch(`/api/user/resumes/${resumeId}`, { method: 'DELETE' })

      if (response.ok) {
        setResumes(prev => prev.filter(r => r.id !== resumeId))
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to delete resume:', error)
    }
  }

  const handlePreviewResume = async (resume: Resume) => {
    try {
      const response = await fetch(`/api/user/resumes/${resume.id}/download`)
      const data = await response.json()

      if (response.ok && data.downloadUrl) {
        setPreviewResume(resume)
        setPreviewUrl(data.downloadUrl)
      }
    } catch (error) {
      console.error('Failed to preview resume:', error)
    }
  }

  const handleClosePreview = () => {
    setPreviewResume(null)
    setPreviewUrl(null)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadStatus('idle')
    setUploadError('')
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setUploadError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setUploadStatus('error')
        setUploadError(data.error || 'Upload failed. Please try again.')
        return
      }

      setUploadStatus('success')
      setSelectedFile(null)

      setTimeout(() => {
        setUploadStatus('idle')
        fetchDashboardData()
      }, 1500)
    } catch (error) {
      setUploadStatus('error')
      setUploadError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
              <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResumes}</div>
              <p className="text-xs text-muted-foreground">{stats.completedResumes} completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processingResumes}</div>
              <p className="text-xs text-muted-foreground">Currently processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Identified</CardTitle>
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSkills}</div>
              <p className="text-xs text-muted-foreground">Across all resumes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
                <CardDescription>Skills extracted from your resumes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="text-sm text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resume History Section */}
            <Card>
              <CardHeader>
                <CardTitle>Resume History</CardTitle>
                <CardDescription>Your uploaded resumes and their processing status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumes.map((resume) => (
                  <div key={resume.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{resume.originalName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {(resume.fileSize / 1024).toFixed(2)} KB • {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          resume.processingStatus === 'COMPLETED' ? 'default' :
                          resume.processingStatus === 'PROCESSING' ? 'secondary' :
                          resume.processingStatus === 'FAILED' ? 'destructive' : 'outline'
                        }>
                          {resume.processingStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewResume(resume)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadResume(resume.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                    {resume.processingStatus === 'COMPLETED' && resume.recommendations.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {resume.recommendations.length} recommendations generated
                      </p>
                    )}
                  </div>
                ))}
                {resumes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No resumes uploaded yet</p>
                )}
              </CardContent>
            </Card>


            {/* Recent Jobs Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Jobs</CardTitle>
                    <CardDescription>Latest career opportunities</CardDescription>
                  </div>
                  <Link href="/jobs">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h4 className="font-semibold text-sm mb-1">{job.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{job.company}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      {job.salaryRange || job.salary ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {job.salaryRange || job.salary}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(job.postedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {recentJobs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent jobs available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Career Recommendations</CardTitle>
                    <CardDescription>AI-powered job matches based on your profile</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{rec.jobTitle}</h3>
                            <p className="text-sm text-muted-foreground">{rec.company}</p>
                          </div>
                          <Badge variant="default" className="text-lg px-3 py-1 bg-green-500">
                            {rec.matchScore}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {rec.skillsMatched.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{rec.category}</Badge>
                          <Button size="sm">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upload New Resume Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Upload New Resume</CardTitle>
                <CardDescription>
                  Update your profile with a new resume for better recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Resume File</Label>
                  <ResumeDropzone
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onRemoveFile={handleRemoveFile}
                  />
                </div>

                {uploadError && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                    {uploadError}
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="bg-green-50 text-green-600 p-4 rounded-md flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Resume uploaded successfully! Refreshing dashboard...</span>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || uploadStatus === 'success'}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </>
                  )}
                </Button>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Supported formats: PDF, DOCX, DOC, TXT</p>
                  <p>• Maximum file size: 10MB</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Resume Preview Sheet */}
      <Sheet open={!!previewResume} onOpenChange={handleClosePreview}>
        <SheetContent side="bottom" className="overflow-y-auto h-[90vh]">
          <SheetHeader>
            <SheetTitle>Resume Preview</SheetTitle>
          </SheetHeader>
          {previewResume && previewUrl && (
            <div className="space-y-4 m-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{previewResume.originalName}</span>
                <span>{(previewResume.fileSize / 1024).toFixed(2)} KB</span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                {previewResume.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh]"
                    title="Resume Preview"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Preview not available for this file type. Please download to view.
                    </p>
                    <Button onClick={() => handleDownloadResume(previewResume.id)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
