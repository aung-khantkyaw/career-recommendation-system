import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const minioClient = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'secretpassword',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = 'career-resumes'

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  try {
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
