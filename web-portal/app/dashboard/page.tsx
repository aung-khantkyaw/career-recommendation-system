'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Briefcase, TrendingUp, Upload, User, LogOut, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

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

export default function DashboardPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [stats, setStats] = useState({ totalResumes: 0, completedResumes: 0, processingResumes: 0, totalSkills: 0 })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
    setIsRefreshing(false)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Career Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
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
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSkills}</div>
              <p className="text-xs text-muted-foreground">Across all resumes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Section */}
          <div className="lg:col-span-1">
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Upload New Resume</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your profile with a new resume for better recommendations
                    </p>
                  </div>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
