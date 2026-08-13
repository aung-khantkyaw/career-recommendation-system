import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from 'redis'
import { Client as MinioClient } from 'minio'

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`
}

async function getPostgresStats() {
  try {
    const result = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `
    const connections = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count FROM pg_stat_activity
    `
    return {
      databaseSize: result[0]?.size || 'Unknown',
      activeConnections: connections[0]?.count || 0,
    }
  } catch (error) {
    console.error('PostgreSQL stats error:', error)
    return { databaseSize: 'Unknown', activeConnections: 0 }
  }
}

async function getRedisStats() {
  try {
    const redis = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD,
    })
    await redis.connect()
    const info = await redis.info('memory')
    await redis.disconnect()

    const usedMemoryMatch = info.match(/used_memory_human:(.+)/)
    const usedMemory = usedMemoryMatch?.[1]?.trim() || '0B'

    return {
      usedMemory,
      connected: true,
    }
  } catch (error) {
    console.error('Redis stats error:', error)
    return { usedMemory: 'Unknown', connected: false }
  }
}

async function getMinioStats() {
  try {
    const minioClient = new MinioClient({
      endPoint: process.env.MINIO_HOST || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || '',
      secretKey: process.env.MINIO_ROOT_PASSWORD || '',
    })

    const buckets = await minioClient.listBuckets()
    let totalObjects = 0
    let totalSize = 0

    for (const bucket of buckets) {
      const objects = minioClient.listObjects(bucket.name, '', true)
      for await (const obj of objects) {
        totalObjects++
        totalSize += obj.size || 0
      }
    }

    return {
      totalObjects,
      totalSize: formatBytes(totalSize),
    }
  } catch (error) {
    console.error('MinIO stats error:', error)
    return { totalObjects: 0, totalSize: '0 B' }
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 30)

    const [
      totalUsers,
      newUsersLast30Days,
      totalResumes,
      resumesToday,
      completedResumes,
      processingResumes,
      pendingResumes,
      failedResumes,
      totalRecommendations,
      avgRecommendation,
      totalStorage,
      recentResumes,
      recentUsers,
      topRecommendations,
      postgresStats,
      redisStats,
      minioStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
      prisma.resume.count(),
      prisma.resume.count({ where: { createdAt: { gte: today } } }),
      prisma.resume.count({ where: { processingStatus: 'COMPLETED' } }),
      prisma.resume.count({ where: { processingStatus: 'PROCESSING' } }),
      prisma.resume.count({ where: { processingStatus: 'PENDING' } }),
      prisma.resume.count({ where: { processingStatus: 'FAILED' } }),
      prisma.careerRecommendation.count(),
      prisma.careerRecommendation.aggregate({ _avg: { matchScore: true } }),
      prisma.resume.aggregate({ _sum: { fileSize: true } }),
      prisma.resume.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          originalName: true,
          processingStatus: true,
          createdAt: true,
          processedAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { recommendations: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { resumes: true } },
        },
      }),
      prisma.careerRecommendation.findMany({
        take: 5,
        orderBy: { matchScore: 'desc' },
        select: {
          id: true,
          careerPath: true,
          category: true,
          matchScore: true,
          createdAt: true,
          resume: {
            select: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      getPostgresStats(),
      getRedisStats(),
      getMinioStats(),
    ])

    const healthyJobs = completedResumes + processingResumes + pendingResumes
    const systemHealth = totalResumes
      ? Math.round((healthyJobs / totalResumes) * 100)
      : 100

    const completionRate = totalResumes
      ? Math.round((completedResumes / totalResumes) * 100)
      : 0

    const averageMatchScore = avgRecommendation._avg.matchScore
      ? Math.round(avgRecommendation._avg.matchScore)
      : 0

    const dashboard = {
      stats: {
        totalUsers: Number(totalUsers),
        totalResumes: Number(totalResumes),
        resumesToday: Number(resumesToday),
        totalRecommendations: Number(totalRecommendations),
        newUsersLast30Days: Number(newUsersLast30Days),
        systemHealth,
        completionRate,
        averageMatchScore,
        storageUsed: formatBytes(Number(totalStorage._sum.fileSize || 0)),
      },
      processing: {
        completed: Number(completedResumes),
        processing: Number(processingResumes),
        pending: Number(pendingResumes),
        failed: Number(failedResumes),
      },
      recentJobs: recentResumes.map((resume) => ({
        id: resume.id,
        student: resume.user.name || resume.user.email,
        fileName: resume.originalName,
        status: resume.processingStatus,
        recommendations: Number(resume._count.recommendations),
        time: formatRelativeTime(resume.createdAt),
        processedAt: resume.processedAt
          ? formatRelativeTime(resume.processedAt)
          : null,
      })),
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name || 'Unnamed Student',
        email: user.email,
        role: user.role,
        resumes: Number(user._count.resumes),
        joined: formatRelativeTime(user.createdAt),
      })),
      topRecommendations: topRecommendations.map((recommendation) => ({
        id: recommendation.id,
        career: recommendation.careerPath,
        category: recommendation.category || 'General',
        matchScore: Math.round(recommendation.matchScore),
        student:
          recommendation.resume.user.name ||
          recommendation.resume.user.email,
        createdAt: formatRelativeTime(recommendation.createdAt),
      })),
      alerts: [
        ...(Number(failedResumes) > 0
          ? [
              {
                id: 'failed-resumes',
                level: 'warning',
                message: `${Number(failedResumes)} resume${Number(failedResumes) > 1 ? 's' : ''} need attention`,
                time: 'Now',
              },
            ]
          : []),
        {
          id: 'health',
          level: systemHealth >= 90 ? 'info' : 'warning',
          message: `System health is ${systemHealth}% based on processing status`,
          time: 'Now',
        },
      ],
    }

    return NextResponse.json({
      dashboard,
      systemStats: {
        cpu: { usage: 0, cores: 0, temperature: 0 },
        memory: { usage: 0, total: 0, available: 0 },
        disk: { usage: 0, total: 0, free: 0 },
        network: { upload: 0, download: 0, latency: 0 },
      },
      services: [
        {
          name: 'PostgreSQL',
          status: postgresStats.activeConnections > 0 ? 'running' : 'stopped',
          uptime: 'active',
          cpu: 'N/A',
          memory: postgresStats.databaseSize,
        },
        {
          name: 'Redis',
          status: redisStats.connected ? 'running' : 'stopped',
          uptime: 'active',
          cpu: 'N/A',
          memory: redisStats.usedMemory,
        },
        {
          name: 'MinIO',
          status: minioStats.totalObjects >= 0 ? 'running' : 'stopped',
          uptime: 'active',
          cpu: 'N/A',
          memory: minioStats.totalSize,
        },
        {
          name: 'AI Processor',
          status: processingResumes > 0 ? 'running' : 'idle',
          uptime: 'active',
          cpu: 'N/A',
          memory: 'N/A',
        },
        {
          name: 'Web Portal',
          status: 'running',
          uptime: 'active',
          cpu: 'N/A',
          memory: 'N/A',
        },
      ],
      recentLogs: dashboard.alerts.map((alert, index) => ({
        id: index + 1,
        level: alert.level,
        message: alert.message,
        time: alert.time,
      })),
      storageStats: {
        totalObjects: Number(minioStats.totalObjects),
        totalSize: minioStats.totalSize,
        resumeFiles: Number(totalResumes),
      },
      dbStats: {
        databaseSize: postgresStats.databaseSize,
        activeConnections: Number(postgresStats.activeConnections),
        queryPerformance: 'Live',
      },
      overview: {
        totalUsers: Number(totalUsers),
        totalResumes: Number(totalResumes),
        completedResumes: Number(completedResumes),
        processingResumes: Number(processingResumes),
        pendingResumes: Number(pendingResumes),
        failedResumes: Number(failedResumes),
      },
    })
  } catch (error) {
    console.error('System stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
