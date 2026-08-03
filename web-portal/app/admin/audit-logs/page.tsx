'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Shield, User, Calendar, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface AuditLog {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata: any
  ipAddress: string | null
  createdAt: string
  admin: {
    id: string
    name: string | null
    email: string
  }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (actionFilter !== 'all') params.set('action', actionFilter)
      params.set('page', page.toString())
      params.set('limit', '50')

      const url = `/api/admin/audit-logs?${params.toString()}`
      
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchLogs(1)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, actionFilter])

  const getActionBadge = (action: string) => {
    const variants: Record<string, any> = {
      CREATE_USER: 'default',
      DELETE_USER: 'destructive',
      UPDATE_USER_STATUS: 'secondary',
      DELETE_RESUME: 'destructive',
      UPDATE_CAREER_PATH: 'secondary',
      DELETE_JOB: 'destructive',
      CREATE_SKILL: 'default',
      UPDATE_SKILL: 'secondary',
      DELETE_SKILL: 'destructive',
    }
    return <Badge variant={variants[action] || 'outline'}>{action}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Audit Logs</h1>
          <p className="mt-2 text-muted-foreground">
            Track admin actions across the platform
          </p>
        </div>
        <Button onClick={() => fetchLogs(currentPage)} disabled={isLoading}>
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
                placeholder="Search by admin name, email, or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={actionFilter} onValueChange={(value) => setActionFilter(value || 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE_USER">Create User</SelectItem>
                <SelectItem value="DELETE_USER">Delete User</SelectItem>
                <SelectItem value="UPDATE_USER_STATUS">Update User Status</SelectItem>
                <SelectItem value="DELETE_RESUME">Delete Resume</SelectItem>
                <SelectItem value="UPDATE_CAREER_PATH">Update Career Path</SelectItem>
                <SelectItem value="DELETE_JOB">Delete Job</SelectItem>
                <SelectItem value="CREATE_SKILL">Create Skill</SelectItem>
                <SelectItem value="UPDATE_SKILL">Update Skill</SelectItem>
                <SelectItem value="DELETE_SKILL">Delete Skill</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {total} total log{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{log.admin.name || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{log.admin.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        {log.entityType && (
                          <div>
                            <Badge variant="outline">{log.entityType}</Badge>
                            {log.entityId && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {log.entityId.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.ipAddress || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
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
                      onClick={() => fetchLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(currentPage + 1)}
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
