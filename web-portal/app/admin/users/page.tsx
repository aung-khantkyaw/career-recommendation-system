'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, MoreVertical, Edit, Trash2, Shield, User } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: {
    resumes: number
  }
}

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    return role === 'admin' ? (
      <Badge variant="default" className="bg-purple-600">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary">
        <User className="w-3 h-3 mr-1" />
        User
      </Badge>
    )
  }

  const getStatusBadge = () => {
    return (
      <Badge variant="default" className="bg-green-500">Active</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <Button>
          <User className="w-4 h-4 mr-2" />
          Add User
        </Button>
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
            <div className="text-2xl font-bold">{users.length}</div>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
                    <div>
                      <div className="font-medium">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role.toLowerCase())}</TableCell>
                  <TableCell>{user._count.resumes}</TableCell>
                  <TableCell>{getStatusBadge()}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
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
