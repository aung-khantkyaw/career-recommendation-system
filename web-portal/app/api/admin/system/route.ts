import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get system statistics from database
    const totalUsers = await prisma.user.count()
    const totalResumes = await prisma.resume.count()
    const completedResumes = await prisma.resume.count({
      where: { processingStatus: 'COMPLETED' }
    })
    const processingResumes = await prisma.resume.count({
      where: { processingStatus: 'PROCESSING' }
    })
    const failedResumes = await prisma.resume.count({
      where: { processingStatus: 'FAILED' }
    })

    const systemStats = {
      cpu: { usage: 45, cores: 8, temperature: 65 },
      memory: { usage: 62, total: 16, available: 6 },
      disk: { usage: 78, total: 500, free: 110 },
      network: { upload: 12.5, download: 45.2, latency: 23 },
    }

    const services = [
      { name: 'PostgreSQL', status: 'running', uptime: '15d 4h 23m', cpu: '5%', memory: '2.1GB' },
      { name: 'Redis', status: 'running', uptime: '15d 4h 23m', cpu: '2%', memory: '512MB' },
      { name: 'MinIO', status: 'running', uptime: '15d 4h 23m', cpu: '3%', memory: '1.2GB' },
      { name: 'AI Processor', status: 'running', uptime: '15d 4h 23m', cpu: '35%', memory: '4.5GB' },
      { name: 'Web Portal', status: 'running', uptime: '15d 4h 23m', cpu: '8%', memory: '1.8GB' },
    ]

    const recentLogs = [
      { id: 1, level: 'info', message: `AI job completed successfully`, time: '2 min ago' },
      { id: 2, level: 'warning', message: 'High memory usage on AI processor (85%)', time: '5 min ago' },
      { id: 3, level: 'info', message: 'Database backup completed', time: '15 min ago' },
      { id: 4, level: 'error', message: `Failed to process resume`, time: '20 min ago' },
      { id: 5, level: 'info', message: `New user registered`, time: '30 min ago' },
    ]

    const storageStats = {
      totalObjects: totalResumes,
      totalSize: '45.2 GB',
      resumeFiles: totalResumes,
    }

    const dbStats = {
      databaseSize: '2.4 GB',
      activeConnections: 24,
      queryPerformance: '12ms',
    }

    return NextResponse.json({
      systemStats,
      services,
      recentLogs,
      storageStats,
      dbStats,
      overview: {
        totalUsers,
        totalResumes,
        completedResumes,
        processingResumes,
        failedResumes,
      }
    })
  } catch (error) {
    console.error('System stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
