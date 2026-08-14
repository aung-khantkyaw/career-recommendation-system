'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, MoreVertical, Edit, Trash2, Shield, User, Power, PowerOff, Download, CheckSquare, Square, Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    resumes: number
  }
}

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'USER' })
  const [addError, setAddError] = useState('')

  const fetchUsers = async (query?: string) => {
    try {
      const url = query ? `/api/admin/users?search=${query}` : '/api/admin/users'
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const filteredUsers = users

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      admin: 'default bg-purple-600',
      moderator: 'default bg-blue-600',
      recruiter: 'default bg-green-600',
      user: 'secondary',
    }
    
    const icons: Record<string, any> = {
      admin: Shield,
      moderator: Shield,
      recruiter: User,
      user: User,
    }
    
    const Icon = icons[role.toLowerCase()] || User
    
    return (
      <Badge variant={variants[role.toLowerCase()] || 'secondary'}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0) + role.slice(1).toLowerCase()}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-500">Inactive</Badge>
    )
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      alert('Failed to update user status')
    }
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
    }
  }

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const bulkActivate = async () => {
    if (selectedUsers.size === 0) return
    
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedUsers).map(userId =>
          fetch(`/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          })
        )
      )
      
      setUsers(users.map(u => selectedUsers.has(u.id) ? { ...u, isActive: true } : u))
      setSelectedUsers(new Set())
    } catch (error) {
      console.error('Failed to bulk activate users:', error)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const bulkDeactivate = async () => {
    if (selectedUsers.size === 0) return
    
    if (!confirm(`Are you sure you want to deactivate ${selectedUsers.size} user(s)?`)) return
    
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedUsers).map(userId =>
          fetch(`/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: false }),
          })
        )
      )
      
      setUsers(users.map(u => selectedUsers.has(u.id) ? { ...u, isActive: false } : u))
      setSelectedUsers(new Set())
    } catch (error) {
      console.error('Failed to bulk deactivate users:', error)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const exportUsers = async () => {
    setIsExporting(true)
    try {
      const csvContent = [
        ['Name', 'Email', 'Role', 'Status', 'Resumes', 'Created At'].join(','),
        ...users.map(u => [
          u.name || '',
          u.email,
          u.role,
          u.isActive ? 'Active' : 'Inactive',
          u._count.resumes,
          new Date(u.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export users:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleAddUser = async () => {
    setAddError('')
    if (!newUser.email || !newUser.password) {
      setAddError('Email and password are required')
      return
    }

    setIsAddingUser(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        setIsAddUserDialogOpen(false)
        setNewUser({ email: '', password: '', name: '', role: 'USER' })
        fetchUsers()
      } else {
        const error = await response.json()
        setAddError(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to add user:', error)
      setAddError('Failed to create user')
    } finally {
      setIsAddingUser(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger>
            <Button>
              <User className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with specified role</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name (optional)</label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {addError && (
                <div className="text-sm text-red-500">{addError}</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isAddingUser}>
                {isAddingUser ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.isActive).length}</div>
            <div className="text-sm text-gray-500">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</div>
            <div className="text-sm text-gray-500">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.reduce((acc, u) => acc + u._count.resumes, 0)}</div>
            <div className="text-sm text-gray-500">Total Resumes</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                variant="outline"
                onClick={exportUsers}
                disabled={isExporting || users.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export CSV
              </Button>
            </div>
          </div>
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedUsers.size} user(s) selected</span>
              <Button
                variant="default"
                size="sm"
                onClick={bulkActivate}
                disabled={isBulkUpdating}
              >
                {isBulkUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PowerOff className="w-4 h-4 mr-2" />
                )}
                Activate All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={bulkDeactivate}
                disabled={isBulkUpdating}
              >
                {isBulkUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                Deactivate All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={users.length === 0}
                  >
                    {selectedUsers.size === users.length && users.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Resumes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSelectUser(user.id)}
                    >
                      {selectedUsers.has(user.id) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role.toLowerCase())}</TableCell>
                  <TableCell>{user._count.resumes}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? (
                          <Power className="w-4 h-4 text-red-500" />
                        ) : (
                          <PowerOff className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
