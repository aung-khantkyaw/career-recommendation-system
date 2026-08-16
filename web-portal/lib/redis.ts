import { createClient } from 'redis'

const isCloud = process.env.INFRASTRUCTURE_MODE === 'CLOUD'
const nativeRedis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
nativeRedis.on('error', (err) => console.error('Redis Client Error', err))

let connectionPromise: Promise<void> | undefined

export async function upstashCommand<T = unknown>(command: string, ...args: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('CLOUD Redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([command, ...args]),
  })
  if (!response.ok) throw new Error(`Upstash command failed: ${await response.text()}`)
  const data = await response.json() as { result?: T; error?: string }
  if (data.error) throw new Error(data.error)
  return data.result as T
}

export async function ensureRedisConnection() {
  if (isCloud || nativeRedis.isOpen) return
  connectionPromise ??= nativeRedis.connect().then(() => undefined).finally(() => { connectionPromise = undefined })
  await connectionPromise
}

const redis = {
  async lPush(key: string, value: string) {
    if (isCloud) return upstashCommand<number>('LPUSH', key, value)
    await ensureRedisConnection(); return nativeRedis.lPush(key, value)
  },
  async publish(channel: string, value: string) {
    if (isCloud) return upstashCommand<number>('PUBLISH', channel, value)
    await ensureRedisConnection(); return nativeRedis.publish(channel, value)
  },
}

export async function addJobToQueue(resumeId: string, minioPath: string, userId: string) {
  const jobPayload = JSON.stringify({ job_id: resumeId, resume_id: resumeId, file_name: minioPath, user_id: userId, created_at: new Date().toISOString() })
  await redis.lPush('ai_jobs_queue', jobPayload)
  console.log(`Job ${resumeId} successfully added to Redis queue.`)
}

export default redis
