'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Cpu, HardDrive, Database, Wifi, Server, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SystemMonitorPage() {
  const [systemStats, setSystemStats] = useState({
    cpu: { usage: 45, cores: 8, temperature: 65 },
    memory: { usage: 62, total: 16, available: 6 },
    disk: { usage: 78, total: 500, free: 110 },
    network: { upload: 12.5, download: 45.2, latency: 23 },
  })
  const [services, setServices] = useState([
    { name: 'PostgreSQL', status: 'running', uptime: '15d 4h 23m', cpu: '5%', memory: '2.1GB' },
    { name: 'Redis', status: 'running', uptime: '15d 4h 23m', cpu: '2%', memory: '512MB' },
    { name: 'MinIO', status: 'running', uptime: '15d 4h 23m', cpu: '3%', memory: '1.2GB' },
    { name: 'AI Processor', status: 'running', uptime: '15d 4h 23m', cpu: '35%', memory: '4.5GB' },
    { name: 'Web Portal', status: 'running', uptime: '15d 4h 23m', cpu: '8%', memory: '1.8GB' },
  ])
  const [recentLogs, setRecentLogs] = useState([
    { id: 1, level: 'info', message: 'AI job JOB-002 completed successfully', time: '2 min ago' },
    { id: 2, level: 'warning', message: 'High memory usage on AI processor (85%)', time: '5 min ago' },
    { id: 3, level: 'info', message: 'Database backup completed', time: '15 min ago' },
    { id: 4, level: 'error', message: 'Failed to process resume for user #1234', time: '20 min ago' },
    { id: 5, level: 'info', message: 'New user registered: john@example.com', time: '30 min ago' },
  ])
  const [storageStats, setStorageStats] = useState({ totalObjects: 0, totalSize: '0 GB', resumeFiles: 0 })
  const [dbStats, setDbStats] = useState({ databaseSize: '0 GB', activeConnections: 0, queryPerformance: '0ms' })
  const [overview, setOverview] = useState({ totalUsers: 0, totalResumes: 0, completedResumes: 0, processingResumes: 0, failedResumes: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/admin/system')
      const data = await response.json()

      if (response.ok) {
        setSystemStats(data.systemStats)
        setServices(data.services)
        setRecentLogs(data.recentLogs)
        setStorageStats(data.storageStats)
        setDbStats(data.dbStats)
        setOverview(data.overview)
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getLogBadge = (level: string) => {
    switch (level) {
      case 'error': return <Badge variant="destructive">Error</Badge>
      case 'warning': return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>
      case 'info': return <Badge variant="default" className="bg-blue-500">Info</Badge>
      default: return <Badge variant="secondary">{level}</Badge>
    }
  }

  const getServiceStatus = (status: string) => {
    return status === 'running' ? (
      <div className="flex items-center space-x-2">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-green-600">Running</span>
      </div>
    ) : (
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span className="text-red-600">Stopped</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600 mt-2">Real-time system health and performance metrics</p>
        </div>
        <Button onClick={fetchSystemData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.cpu.usage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStats.cpu.cores} cores • {systemStats.cpu.temperature}°C
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Activity className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.memory.usage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStats.memory.available}GB available of {systemStats.memory.total}GB
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.disk.usage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStats.disk.free}GB free of {systemStats.disk.total}GB
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.network.latency}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              ↑{systemStats.network.upload}MB/s ↓{systemStats.network.download}MB/s
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle>Services Status</CardTitle>
            <CardDescription>Running services and their resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Server className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-xs text-gray-500">Uptime: {service.uptime}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getServiceStatus(service.status)}
                    <div className="text-xs text-gray-500 mt-1">
                      CPU: {service.cpu} • Mem: {service.memory}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
            <CardDescription>Recent system events and errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getLogBadge(log.level)}
                  <div className="flex-1">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage & Database */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>MinIO object storage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Total Objects</div>
                  <div className="text-sm text-gray-500">Files stored in MinIO</div>
                </div>
                <div className="text-2xl font-bold">{storageStats.totalObjects}</div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Total Size</div>
                  <div className="text-sm text-gray-500">Storage used</div>
                </div>
                <div className="text-2xl font-bold">{storageStats.totalSize}</div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Resume Files</div>
                  <div className="text-sm text-gray-500">Uploaded resumes</div>
                </div>
                <div className="text-2xl font-bold">{storageStats.resumeFiles}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>PostgreSQL database metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Database Size</div>
                  <div className="text-sm text-gray-500">Total storage used</div>
                </div>
                <div className="text-2xl font-bold">{dbStats.databaseSize}</div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Active Connections</div>
                  <div className="text-sm text-gray-500">Current DB connections</div>
                </div>
                <div className="text-2xl font-bold">{dbStats.activeConnections}</div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Query Performance</div>
                  <div className="text-sm text-gray-500">Avg query time</div>
                </div>
                <div className="text-2xl font-bold">{dbStats.queryPerformance}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
