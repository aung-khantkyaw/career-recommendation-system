import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3'

const minioClient = new S3Client({
  endpoint: `http://${process.env.MINIO_HOST || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'secretpassword',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = 'career-resumes'

async function ensureBucketExists() {
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
  } catch (error: any) {
    if (error.name === 'NoSuchBucket' || error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      await minioClient.send(
        new CreateBucketCommand({
          Bucket: BUCKET_NAME,
        })
      )
    } else {
      throw error
    }
  }

  // Set public read policy (for both new and existing buckets)
  try {
    await minioClient.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
            },
          ],
        }),
      })
    )
  } catch (error) {
    console.warn('Failed to set bucket policy:', error)
  }
}

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  try {
    await ensureBucketExists()
    await minioClient.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )
    return { success: true }
  } catch (error) {
    console.error('MinIO upload error:', error)
    return { success: false, error }
  }
}

export function getFileUrl(key: string) {
  const endpoint = `http://${process.env.MINIO_HOST || 'localhost'}:${process.env.MINIO_PORT || '9000'}`
  return `${endpoint}/${BUCKET_NAME}/${key}`
}

export async function getFile(key: string) {
  try {
    const response = await minioClient.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )
    return { success: true, data: response.Body }
  } catch (error) {
    console.error('MinIO get error:', error)
    return { success: false, error }
  }
}

export async function deleteFile(key: string) {
  try {
    await minioClient.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )
    return { success: true }
  } catch (error) {
    console.error('MinIO delete error:', error)
    return { success: false, error }
  }
}

export { minioClient, BUCKET_NAME }
