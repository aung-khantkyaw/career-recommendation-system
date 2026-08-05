import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Initialize connection on module load
let isInitialized = false;

async function ensureConnected() {
  if (!isInitialized) {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    isInitialized = true;
    console.log('✅ Redis connected');
  }
}

// Auto-connect on first use
ensureConnected().catch(err => {
  console.error('Failed to connect to Redis:', err);
});

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

export default redisClient;
