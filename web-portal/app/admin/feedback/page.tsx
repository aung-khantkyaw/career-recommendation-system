'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, MessageSquare, User, Calendar, ArrowLeft, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface Feedback {
  id: string
  type: string
  subject: string
  message: string
  status: string
  priority: string
  adminNotes: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchFeedback = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      params.set('page', page.toString())
      params.set('limit', '50')

      const url = `/api/admin/feedback?${params.toString()}`
      
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setFeedback(data.feedback)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback(1)
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFeedback(1)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, statusFilter, typeFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      OPEN: 'default',
      IN_PROGRESS: 'secondary',
      RESOLVED: 'default bg-green-600',
      CLOSED: 'outline',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      LOW: 'secondary',
      MEDIUM: 'default bg-yellow-600',
      HIGH: 'default bg-orange-600',
      URGENT: 'destructive',
    }
    return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>
  }

  const getTypeBadge = (type: string) => {
    return <Badge variant="outline">{type}</Badge>
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedFeedback) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/feedback?id=${selectedFeedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          adminNotes: adminNotes || null
        }),
      })

      if (response.ok) {
        setFeedback(feedback.map(f => f.id === selectedFeedback.id ? { ...f, status: newStatus, adminNotes } : f))
        setSelectedFeedback(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Failed to update feedback:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openFeedbackDialog = (item: Feedback) => {
    setSelectedFeedback(item)
    setAdminNotes(item.adminNotes || '')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Feedback Management</h1>
          <p className="mt-2 text-muted-foreground">
            Handle user complaints, suggestions, and feedback
          </p>
        </div>
        <Button onClick={() => fetchFeedback(currentPage)} disabled={isLoading}>
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
                placeholder="Search by user, subject, or message..."
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
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                <SelectItem value="COMPLAINT">Complaint</SelectItem>
                <SelectItem value="SUGGESTION">Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            {total} total feedback item{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{item.user.name || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{item.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(item.type)}</TableCell>
                      <TableCell>
                        <div className="max-w-64">
                          <div className="font-medium">{item.subject}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger
                            render={<Button variant="ghost" size="sm">View Details</Button>}
                            onClick={() => openFeedbackDialog(item)}
                          />
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Feedback Details</DialogTitle>
                              <DialogDescription>
                                {item.subject}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                {getTypeBadge(item.type)}
                                {getPriorityBadge(item.priority)}
                                {getStatusBadge(item.status)}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">From:</p>
                                <p className="font-medium">{item.user.name || 'No name'} ({item.user.email})</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Message:</p>
                                <p className="text-sm">{item.message}</p>
                              </div>
                              {item.adminNotes && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Admin Notes:</p>
                                  <p className="text-sm bg-muted p-2 rounded">{item.adminNotes}</p>
                                </div>
                              )}
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Admin Notes:</p>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add admin notes..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Select value={item.status} onValueChange={(value) => value && handleUpdateStatus(value)}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({total} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchFeedback(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchFeedback(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
