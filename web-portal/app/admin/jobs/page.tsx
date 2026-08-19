'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RefreshCw, Eye, Play, X, Clock, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react'

interface Job {
  id: string
  resumeId: string
  user: string
  userId: string
  type: string
  status: string
  progress: number
  createdAt: Date
  completedAt: Date | null
  duration: string | null
}

export default function AIJobsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isFetchingJobDetail, setIsFetchingJobDetail] = useState(false)
  const [isRetryingJob, setIsRetryingJob] = useState(false)

  const fetchJobs = async (status?: string) => {
    try {
      const url = status && status !== 'all' ? `/api/admin/jobs?status=${status}` : '/api/admin/jobs'
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs)
        setStats(data.stats)
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
    fetchJobs(activeTab)
  }, [activeTab])

  const filteredJobs = jobs

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'processing': return <Badge variant="default" className="bg-blue-500">Processing</Badge>
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>
      case 'failed': return <Badge variant="destructive">Failed</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleRefresh = () => {
    fetchJobs(activeTab)
  }

  const handleViewJob = async (jobId: string) => {
    setIsFetchingJobDetail(true)
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/detail`)
      const data = await response.json()

      if (response.ok) {
        setSelectedJob(data.job)
        setIsDetailDialogOpen(true)
      } else {
        console.error('Failed to fetch job detail:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch job detail:', error)
    } finally {
      setIsFetchingJobDetail(false)
    }
  }

  const handleRetryJob = async (jobId: string) => {
    setIsRetryingJob(true)
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/retry`, {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok) {
        fetchJobs(activeTab)
      } else {
        alert(data.error || 'Failed to retry job')
      }
    } catch (error) {
      console.error('Failed to retry job:', error)
      alert('Failed to retry job')
    } finally {
      setIsRetryingJob(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Job Monitoring</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage AI processing jobs</p>
        </div>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Queue</CardTitle>
          <CardDescription>View and manage AI processing jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pending')}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={activeTab === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('processing')}
            >
              Processing ({stats.processing})
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('completed')}
            >
              Completed ({stats.completed})
            </Button>
            <Button
              variant={activeTab === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('failed')}
            >
              Failed ({stats.failed})
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-sm">{job.id}</TableCell>
                  <TableCell>{job.user}</TableCell>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      {getStatusBadge(job.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{job.duration || '-'}</TableCell>
                  <TableCell className="text-sm">{new Date(job.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {job.status === 'completed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleViewJob(job.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {(job.status === 'failed' || job.status === 'pending' || job.status === 'processing') && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetryJob(job.id)} disabled={isRetryingJob}>
                          {isRetryingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[500px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details & Recommendations</DialogTitle>
            <DialogDescription>View resume analysis results and career recommendations</DialogDescription>
          </DialogHeader>
          {isFetchingJobDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : selectedJob ? (
            <div className="space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <div className="mt-1 font-medium">{selectedJob.user?.name || selectedJob.user?.email || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Name</label>
                  <div className="mt-1 font-medium">{selectedJob.fileName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedJob.processingStatus.toLowerCase())}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Processed At</label>
                  <div className="mt-1 font-medium">{selectedJob.processedAt ? new Date(selectedJob.processedAt).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              {/* Extracted Skills
              {selectedJob.skills && (
                <Card>
                  <CardHeader>
                    <CardTitle>Extracted Skills</CardTitle>
                    <CardDescription>Skills identified from the resume</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const skills = selectedJob.skills
                        const skillList: string[] = []

                        if (Array.isArray(skills)) {
                          skills.forEach((skill: any) => {
                            if (typeof skill === 'string') {
                              // Split string by commas and other delimiters
                              const splitSkills = skill.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 1)
                              skillList.push(...splitSkills)
                            } else if (skill && typeof skill === 'object') {
                              skillList.push(skill.name || skill.skill || JSON.stringify(skill))
                            }
                          })
                        } else if (typeof skills === 'object') {
                          Object.entries(skills).forEach(([key, value]: [string, any]) => {
                            if (value) skillList.push(value)
                            else skillList.push(key)
                          })
                        } else if (typeof skills === 'string') {
                          // Split by commas, semicolons, newlines, and spaces
                          const splitSkills = skills
                            .split(/[,;\n\s]+/)
                            .map(s => s.trim())
                            .filter(s => s.length > 1)
                          skillList.push(...splitSkills)
                        }

                        // Remove duplicates and filter empty
                        const uniqueSkills = [...new Set(skillList.filter(s => s && String(s).trim().length > 1).map(s => String(s).trim()))]

                        return uniqueSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )} */}

              {/* Career Recommendations */}
              {selectedJob.recommendations && selectedJob.recommendations.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Career Recommendations</CardTitle>
                    <CardDescription>AI-generated career paths based on your skills</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {selectedJob.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold">{rec.careerPath || 'Unknown Career'}</h5>
                            <Badge variant="default" className="bg-green-500">{(rec.matchScore).toFixed(1)}% Match</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{rec.category || 'General'}</p>
                          <div className="mb-2">
                            <label className="text-xs text-gray-500">Matched Skills</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rec.skillsMatched?.map((skill: string, skillIndex: number) => (
                                <Badge key={skillIndex} variant="outline" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No recommendations available
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
