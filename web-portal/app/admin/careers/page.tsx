'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Briefcase, TrendingUp } from 'lucide-react'

interface Career {
  id: number
  title: string
  category: string
  jobs: number
  avgSalary: string
  growth: string
  active: boolean
}

export default function CareerDataPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [careers, setCareers] = useState<Career[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, totalJobs: 0, avgGrowth: '+18%' })
  const [isLoading, setIsLoading] = useState(true)

  const fetchCareers = async (query?: string) => {
    try {
      const url = query ? `/api/admin/careers?search=${query}` : '/api/admin/careers'
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setCareers(data.careers)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch careers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCareers()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCareers(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const filteredCareers = careers

  const getCategoryBadge = (category: string) => {
    const colors: { [key: string]: string } = {
      'Engineering': 'bg-blue-100 text-blue-600',
      'Data': 'bg-purple-100 text-purple-600',
      'Product': 'bg-green-100 text-green-600',
      'Design': 'bg-pink-100 text-pink-600',
      'AI': 'bg-orange-100 text-orange-600',
    }
    return (
      <Badge className={colors[category] || 'bg-gray-100 text-gray-600'}>
        {category}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Career Data Management</h1>
          <p className="text-gray-600 mt-2">Manage career paths and job information</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Career Path
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-500">Career Paths</div>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalJobs.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.avgGrowth}</div>
            <div className="text-sm text-gray-500">Avg Growth</div>
          </CardContent>
        </Card>
      </div>

      {/* Career Paths Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Career Paths</CardTitle>
              <CardDescription>View and manage career information</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search careers..."
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
                <TableHead>Career Path</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Available Jobs</TableHead>
                <TableHead>Avg Salary</TableHead>
                <TableHead>Growth</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCareers.map((career) => (
                <TableRow key={career.id}>
                  <TableCell>
                    <div className="font-medium">{career.title}</div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(career.category)}</TableCell>
                  <TableCell>{career.jobs.toLocaleString()}</TableCell>
                  <TableCell>{career.avgSalary}</TableCell>
                  <TableCell className="text-green-600 font-medium">{career.growth}</TableCell>
                  <TableCell>
                    <Badge variant={career.active ? 'default' : 'secondary'}>
                      {career.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Knowledge Base Section */}
      <Card>
        <CardHeader>
          <CardTitle>AI Knowledge Base</CardTitle>
          <CardDescription>Manage career-related knowledge for AI recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Career Path Documents</h3>
                <p className="text-sm text-gray-500">Documents used for RAG-based career guidance</p>
              </div>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Skill Database</h3>
                <p className="text-sm text-gray-500">Skills and their relationships to career paths</p>
              </div>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Manage Skills
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Industry Trends</h3>
                <p className="text-sm text-gray-500">Market trends and salary data</p>
              </div>
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Update Trends
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
