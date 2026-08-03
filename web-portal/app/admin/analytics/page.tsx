'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, FileText, Briefcase, TrendingUp, BookOpen, Activity, Loader2, ArrowLeft, RefreshCw, Download } from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  metrics: {
    users: {
      total: number
      active: number
      new: number
      inactive: number
    }
    resumes: {
      total: number
      processed: number
      pending: number
      failed: number
      processingRate: string
    }
    jobs: {
      total: number
      active: number
      new: number
      inactive: number
    }
    careerPaths: {
      total: number
      active: number
      inactive: number
    }
    engagement: {
      totalBookmarks: number
      totalRecommendations: number
      activityLogs: number
    }
  }
  jobPerformance: Array<{
    careerPath: string
    category: string
    jobCount: number
  }>
  trends: {
    dailyRegistrations: Array<{ date: string; count: number }>
    dailyResumeUploads: Array<{ date: string; count: number }>
  }
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const exportAnalytics = async () => {
    if (!analytics) return

    try {
      const csvContent = [
        ['Metric Category', 'Metric Name', 'Value'].join(','),
        ['Users', 'Total Users', analytics.metrics.users.total.toString()].join(','),
        ['Users', 'Active Users', analytics.metrics.users.active.toString()].join(','),
        ['Users', 'Inactive Users', analytics.metrics.users.inactive.toString()].join(','),
        ['Users', 'New Users', analytics.metrics.users.new.toString()].join(','),
        ['Resumes', 'Total Resumes', analytics.metrics.resumes.total.toString()].join(','),
        ['Resumes', 'Processed', analytics.metrics.resumes.processed.toString()].join(','),
        ['Resumes', 'Pending', analytics.metrics.resumes.pending.toString()].join(','),
        ['Resumes', 'Failed', analytics.metrics.resumes.failed.toString()].join(','),
        ['Resumes', 'Processing Rate', analytics.metrics.resumes.processingRate + '%'].join(','),
        ['Jobs', 'Total Jobs', analytics.metrics.jobs.total.toString()].join(','),
        ['Jobs', 'Active Jobs', analytics.metrics.jobs.active.toString()].join(','),
        ['Jobs', 'Inactive Jobs', analytics.metrics.jobs.inactive.toString()].join(','),
        ['Jobs', 'New Jobs', analytics.metrics.jobs.new.toString()].join(','),
        ['Career Paths', 'Total Career Paths', analytics.metrics.careerPaths.total.toString()].join(','),
        ['Career Paths', 'Active Career Paths', analytics.metrics.careerPaths.active.toString()].join(','),
        ['Career Paths', 'Inactive Career Paths', analytics.metrics.careerPaths.inactive.toString()].join(','),
        ['Engagement', 'Total Bookmarks', analytics.metrics.engagement.totalBookmarks.toString()].join(','),
        ['Engagement', 'Total Recommendations', analytics.metrics.engagement.totalRecommendations.toString()].join(','),
        ['Engagement', 'Activity Logs', analytics.metrics.engagement.activityLogs.toString()].join(','),
        ['', '', ''].join(','),
        ['Job Performance by Career Path', '', ''].join(','),
        ['Career Path', 'Category', 'Job Count'],
        ...analytics.jobPerformance.map(j => [j.careerPath, j.category, j.jobCount.toString()].join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export analytics:', error)
    }
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const statCards = [
    {
      title: 'Total Users',
      value: analytics?.metrics.users.total || 0,
      change: analytics?.metrics.users.new || 0,
      changeLabel: 'new',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Resumes',
      value: analytics?.metrics.resumes.total || 0,
      change: analytics?.metrics.resumes.processingRate || '0%',
      changeLabel: 'processed',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Jobs',
      value: analytics?.metrics.jobs.active || 0,
      change: analytics?.metrics.jobs.new || 0,
      changeLabel: 'new',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Career Paths',
      value: analytics?.metrics.careerPaths.total || 0,
      change: analytics?.metrics.careerPaths.active || 0,
      changeLabel: 'active',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Analytics Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Detailed analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value || 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportAnalytics} disabled={!analytics}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : analytics ? (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold mt-2">{stat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.change} {stat.changeLabel}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Detailed Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-semibold">{analytics.metrics.users.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <Badge variant="default">{analytics.metrics.users.active}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inactive Users</span>
                    <Badge variant="secondary">{analytics.metrics.users.inactive}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Users (period)</span>
                    <Badge variant="outline">{analytics.metrics.users.new}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Resumes</span>
                    <span className="font-semibold">{analytics.metrics.resumes.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Processed</span>
                    <Badge variant="default">{analytics.metrics.resumes.processed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge variant="secondary">{analytics.metrics.resumes.pending}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Failed</span>
                    <Badge variant="destructive">{analytics.metrics.resumes.failed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Processing Rate</span>
                    <span className="font-semibold">{analytics.metrics.resumes.processingRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Jobs</span>
                    <span className="font-semibold">{analytics.metrics.jobs.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Jobs</span>
                    <Badge variant="default">{analytics.metrics.jobs.active}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inactive Jobs</span>
                    <Badge variant="secondary">{analytics.metrics.jobs.inactive}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Jobs (period)</span>
                    <Badge variant="outline">{analytics.metrics.jobs.new}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Bookmarks</span>
                    <span className="font-semibold">{analytics.metrics.engagement.totalBookmarks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Recommendations</span>
                    <span className="font-semibold">{analytics.metrics.engagement.totalRecommendations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Activity Logs (period)</span>
                    <span className="font-semibold">{analytics.metrics.engagement.activityLogs}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Performance by Career Path */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Job Performance by Career Path
              </CardTitle>
              <CardDescription>Number of active jobs per career path</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.jobPerformance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.careerPath}</span>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(item.jobCount / Math.max(...analytics.jobPerformance.map(j => j.jobCount))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 font-semibold">{item.jobCount}</span>
                  </div>
                ))}
                {analytics.jobPerformance.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No job performance data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
