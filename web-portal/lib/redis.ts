import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function ensureConnected() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function addJobToQueue(resumeId: string, minioPath: string, userId: string) {
  await ensureConnected();

  const jobPayload = JSON.stringify({
    job_id: resumeId,
    resume_id: resumeId,
    file_name: minioPath,
    user_id: userId,
    created_at: new Date().toISOString(),
  });

  await redisClient.lPush('ai_jobs_queue', jobPayload);
  console.log(`Job ${resumeId} successfully added to Redis queue.`);
}
