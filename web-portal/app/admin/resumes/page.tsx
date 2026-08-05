'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search, FileText, Download, Trash2, User, Calendar, CheckCircle, Clock, XCircle, Loader2, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

interface Resume {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  processingStatus: string
  minioPath: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    recommendations: number
  }
}

export default function AdminResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [previewResume, setPreviewResume] = useState<Resume | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchResumes = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const url = params.size ? `/api/admin/resumes?${params.toString()}` : '/api/admin/resumes'
      
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setResumes(data.resumes)
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchResumes()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, statusFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      COMPLETED: 'default',
      PROCESSING: 'secondary',
      PENDING: 'outline',
      FAILED: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return

    setIsDeleting(resumeId)
    try {
      const response = await fetch(`/api/admin/resumes/${resumeId}`, { method: 'DELETE' })
      
      if (response.ok) {
        setResumes(prev => prev.filter(r => r.id !== resumeId))
      }
    } catch (error) {
      console.error('Failed to delete resume:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDownload = async (resume: Resume) => {
    try {
      const response = await fetch(`/api/user/resumes/${resume.id}/download`)
      const data = await response.json()

      if (response.ok) {
        window.open(data.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Failed to download resume:', error)
    }
  }

  const handlePreview = async (resume: Resume) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Resume Management</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage all uploaded resumes across the platform
          </p>
        </div>
        <Button onClick={fetchResumes} disabled={isLoading}>
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by filename, user name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Resumes</CardTitle>
          <CardDescription>
            {resumes.length} resume{resumes.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recommendations</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumes.map((resume) => (
                  <TableRow key={resume.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{resume.originalName}</div>
                          <div className="text-xs text-muted-foreground">{resume.mimeType}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users?search=${resume.user.email}`} className="hover:underline">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{resume.user.name || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{resume.user.email}</div>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{getStatusBadge(resume.processingStatus)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{resume._count.recommendations}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {(resume.fileSize / 1024).toFixed(2)} KB
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(resume)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(resume)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resume.id)}
                          disabled={isDeleting === resume.id}
                          title="Delete"
                          className="text-red-500 hover:text-red-600"
                        >
                          {isDeleting === resume.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                    <Button onClick={() => handleDownload(previewResume)}>
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
