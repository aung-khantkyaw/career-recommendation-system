'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Cpu,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

type AdminDashboard = {
  stats: {
    totalUsers: number
    totalResumes: number
    resumesToday: number
    totalRecommendations: number
    newUsersLast30Days: number
    systemHealth: number
    completionRate: number
    averageMatchScore: number
    storageUsed: string
  }
  processing: {
    completed: number
    processing: number
    pending: number
    failed: number
  }
  recentJobs: {
    id: string
    student: string
    fileName: string
    status: ProcessingStatus
    recommendations: number
    time: string
    processedAt: string | null
  }[]
  recentUsers: {
    id: string
    name: string
    email: string
    role: 'USER' | 'ADMIN'
    resumes: number
    joined: string
  }[]
  topRecommendations: {
    id: string
    career: string
    category: string
    matchScore: number
    student: string
    createdAt: string
  }[]
  alerts: {
    id: string
    level: 'info' | 'warning' | 'error'
    message: string
    time: string
  }[]
}

type DashboardResponse = {
  dashboard: AdminDashboard
}

const emptyDashboard: AdminDashboard = {
  stats: {
    totalUsers: 0,
    totalResumes: 0,
    resumesToday: 0,
    totalRecommendations: 0,
    newUsersLast30Days: 0,
    systemHealth: 100,
    completionRate: 0,
    averageMatchScore: 0,
    storageUsed: '0 MB',
  },
  processing: {
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
  },
  recentJobs: [],
  recentUsers: [],
  topRecommendations: [],
  alerts: [],
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/system', {
        cache: 'no-store',
      })
      const data = (await response.json()) as Partial<DashboardResponse> & {
        error?: string
      }

      if (!response.ok || !data.dashboard) {
        throw new Error(data.error || 'Unable to load dashboard data')
      }

      setDashboard(data.dashboard)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard data'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchDashboard()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [])

  const stats = useMemo(
    () => [
      {
        title: 'Total Users',
        value: dashboard.stats.totalUsers.toLocaleString(),
        detail: `${dashboard.stats.newUsersLast30Days} new in 30 days`,
        icon: Users,
      },
      {
        title: 'Uploaded Resumes',
        value: dashboard.stats.totalResumes.toLocaleString(),
        detail: `${dashboard.stats.resumesToday} uploaded today`,
        icon: FileText,
      },
      {
        title: 'Recommendations',
        value: dashboard.stats.totalRecommendations.toLocaleString(),
        detail: `${dashboard.stats.averageMatchScore}% avg match score`,
        icon: BriefcaseBusiness,
      },
      {
        title: 'System Health',
        value: `${dashboard.stats.systemHealth}%`,
        detail: `${dashboard.stats.storageUsed} resume storage`,
        icon: Activity,
      },
    ],
    [dashboard]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Monitor students, resume processing, and AI recommendation activity.
          </p>
        </div>
        <Button onClick={fetchDashboard} disabled={isLoading}>
          <RefreshCw
            className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10 shadow-sm">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 size-4 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Dashboard data could not be loaded.
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <span className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Processing Overview</CardTitle>
            <CardDescription>
              Current resume pipeline status across all students.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Completion rate</span>
                <span className="text-muted-foreground">
                  {dashboard.stats.completionRate}%
                </span>
              </div>
              <Progress value={dashboard.stats.completionRate} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatusMetric label="Completed" value={dashboard.processing.completed} />
              <StatusMetric label="Processing" value={dashboard.processing.processing} />
              <StatusMetric label="Pending" value={dashboard.processing.pending} />
              <StatusMetric label="Failed" value={dashboard.processing.failed} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent AI Jobs</CardTitle>
              <CardDescription>
                Latest resume analysis runs from the system.
              </CardDescription>
            </div>
            <Link href="/admin/jobs">
              <Button variant="outline" size="sm">
                View Jobs
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Recommendations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentJobs.length ? (
                  dashboard.recentJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{job.student}</div>
                        <div className="max-w-52 truncate text-xs text-muted-foreground">
                          {job.fileName} · {job.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {job.recommendations}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No resume jobs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Top Career Matches</CardTitle>
              <CardDescription>
                Highest scoring AI recommendations.
              </CardDescription>
            </div>
            <Link href="/admin/careers">
              <Button variant="outline" size="sm">
                Career Data
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.topRecommendations.length ? (
                dashboard.topRecommendations.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium">{item.career}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.student} · {item.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28">
                        <Progress value={item.matchScore} />
                      </div>
                      <Badge variant="secondary">{item.matchScore}%</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No recommendations yet"
                  description="Career matches will appear after resumes are processed."
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Operational notices from the API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.alerts.length ? (
              dashboard.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border bg-background p-3"
                >
                  {alert.level === 'info' ? (
                    <CheckCircle2 className="mt-0.5 size-4" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
                  )}
                  <div>
                    <Badge variant={alert.level === 'info' ? 'secondary' : 'outline'}>
                      {alert.level}
                    </Badge>
                    <p className="mt-2 text-sm">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No alerts"
                description="Everything looks calm right now."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <QuickAction
          href="/admin/users"
          icon={Users}
          title="Manage Users"
          description="Review student accounts, admins, and resume activity."
        />
        <QuickAction
          href="/admin/careers"
          icon={BriefcaseBusiness}
          title="Career Data"
          description="Maintain career categories and recommendation data."
        />
        <QuickAction
          href="/admin/recommendations"
          icon={TrendingUp}
          title="Recommendations"
          description="View and analyze AI-generated career recommendations."
        />
        <QuickAction
          href="/admin/system"
          icon={Cpu}
          title="System Monitor"
          description="Inspect services, storage, logs, and runtime health."
        />
      </div>
    </div>
  )
}

function StatusMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: ProcessingStatus }) {
  const variant = status === 'FAILED' ? 'destructive' : status === 'COMPLETED' ? 'default' : 'secondary'

  return <Badge variant={variant}>{status.toLowerCase()}</Badge>
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-6 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
        <CardHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
