'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, Cpu, Activity, TrendingUp, AlertCircle } from 'lucide-react'

export default function AdminDashboardPage() {
  // Mock data - will be replaced with API calls
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Resumes',
      value: '856',
      change: '+8%',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'AI Jobs Today',
      value: '142',
      change: '+23%',
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'System Health',
      value: '98%',
      change: '+2%',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const recentJobs = [
    { id: 1, user: 'John Doe', type: 'Resume Analysis', status: 'completed', time: '2 min ago' },
    { id: 2, user: 'Jane Smith', type: 'Resume Analysis', status: 'processing', time: '5 min ago' },
    { id: 3, user: 'Bob Wilson', type: 'Resume Analysis', status: 'pending', time: '8 min ago' },
    { id: 4, user: 'Alice Brown', type: 'Resume Analysis', status: 'completed', time: '12 min ago' },
    { id: 5, user: 'Charlie Davis', type: 'Resume Analysis', status: 'failed', time: '15 min ago' },
  ]

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'High CPU usage on AI processor (85%)', time: '10 min ago' },
    { id: 2, type: 'info', message: 'Database backup completed successfully', time: '1 hour ago' },
    { id: 3, type: 'error', message: 'Failed job #1234 - timeout error', time: '2 hours ago' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-600'
      case 'processing': return 'bg-blue-100 text-blue-600'
      case 'pending': return 'bg-yellow-100 text-yellow-600'
      case 'failed': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-600'
      case 'error': return 'bg-red-100 text-red-600'
      case 'info': return 'bg-blue-100 text-blue-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of system performance and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Jobs</CardTitle>
            <CardDescription>Latest resume processing jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{job.user}</p>
                    <p className="text-xs text-gray-500">{job.type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{job.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Recent system notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${getAlertColor(alert.type).split(' ')[1]}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-gray-500">View and manage user accounts</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Briefcase className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-medium">Career Data</h3>
              <p className="text-sm text-gray-500">Update career information</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Activity className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-medium">System Monitor</h3>
              <p className="text-sm text-gray-500">View system health metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
