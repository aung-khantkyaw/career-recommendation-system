'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, RefreshCw, TrendingUp, User, Briefcase, Trash2, Eye } from 'lucide-react'

interface Recommendation {
  id: string
  jobTitle: string
  category: string
  matchScore: number
  createdAt: string
  resume: {
    id: string
    originalName: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }
}

interface RecommendationStats {
  total: number
  highMatch: number
  mediumMatch: number
  lowMatch: number
  avgMatchScore: number
}

export default function RecommendationsManagementPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [stats, setStats] = useState<RecommendationStats>({
    total: 0,
    highMatch: 0,
    mediumMatch: 0,
    lowMatch: 0,
    avgMatchScore: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [matchScoreFilter, setMatchScoreFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchRecommendations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (matchScoreFilter !== 'all') params.set('matchScore', matchScoreFilter)

      const url = params.size
        ? `/api/admin/recommendations?${params.toString()}`
        : '/api/admin/recommendations'

      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setRecommendations(data.recommendations)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchRecommendations()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, categoryFilter, matchScoreFilter])

  const getMatchScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="default" className="bg-green-500">High Match</Badge>
    } else if (score >= 60) {
      return <Badge variant="secondary" className="bg-yellow-500">Medium Match</Badge>
    } else {
      return <Badge variant="outline">Low Match</Badge>
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const handleRefresh = () => {
    fetchRecommendations()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Career Recommendations</h1>
          <p className="text-gray-600 mt-2">Manage and analyze AI-generated career recommendations</p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Recommendations</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.highMatch}</div>
                <div className="text-sm text-gray-500">High Match (80%+)</div>
              </div>
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.mediumMatch}</div>
                <div className="text-sm text-gray-500">Medium Match (60-79%)</div>
              </div>
              <User className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.avgMatchScore}%</div>
                <div className="text-sm text-gray-500">Avg Match Score</div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by career, user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
              </SelectContent>
            </Select>
            <Select value={matchScoreFilter} onValueChange={setMatchScoreFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Match Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Recommendations</CardTitle>
          <CardDescription>View and manage career recommendations for students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Career</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Match Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length ? (
                recommendations.map((recommendation) => (
                  <TableRow key={recommendation.id}>
                    <TableCell className="font-medium">{recommendation.jobTitle}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{recommendation.category || 'General'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{recommendation.resume.user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{recommendation.resume.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{recommendation.resume.originalName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${getMatchScoreColor(recommendation.matchScore)}`}>
                          {Math.round(recommendation.matchScore)}%
                        </span>
                        {getMatchScoreBadge(recommendation.matchScore)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(recommendation.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {isLoading ? 'Loading recommendations...' : 'No recommendations found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
