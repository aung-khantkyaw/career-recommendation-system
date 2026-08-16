import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3'

const isCloud = process.env.INFRASTRUCTURE_MODE === 'CLOUD'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const bucketName = isCloud
  ? process.env.SUPABASE_STORAGE_BUCKET || 'career-system'
  : process.env.MINIO_BUCKET || 'career-resumes'

const minioClient = new S3Client({
  endpoint: `http://${process.env.MINIO_HOST || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'replace-me',
  },
  forcePathStyle: true,
})

function cloudHeaders(contentType?: string) {
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !token) throw new Error('CLOUD storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  return {
    Authorization: `Bearer ${token}`,
    apikey: token,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  }
}

function storageObjectUrl(key: string) {
  return `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucketName)}/${key.split('/').map(encodeURIComponent).join('/')}`
}

async function ensureBucketExists() {
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: bucketName }))
  } catch (error: any) {
    if (error.name === 'NoSuchBucket' || error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      await minioClient.send(new CreateBucketCommand({ Bucket: bucketName }))
    } else throw error
  }
  try {
    await minioClient.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: `arn:aws:s3:::${bucketName}/*` }] }),
    }))
  } catch (error) { console.warn('Failed to set bucket policy:', error) }
}

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  try {
    if (isCloud) {
      const response = await fetch(storageObjectUrl(key), { method: 'POST', headers: cloudHeaders(contentType), body: body as unknown as BodyInit })
      if (!response.ok) throw new Error(`Supabase Storage upload failed: ${await response.text()}`)
    } else {
      await ensureBucketExists()
      await minioClient.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body, ContentType: contentType }))
    }
    return { success: true }
  } catch (error) { console.error('Storage upload error:', error); return { success: false, error } }
}

export function getFileUrl(key: string) {
  if (isCloud) return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${key.split('/').map(encodeURIComponent).join('/')}`
  return `http://${process.env.MINIO_HOST || 'localhost'}:${process.env.MINIO_PORT || '9000'}/${bucketName}/${key}`
}

export function getStorageKeyFromUrl(url: string) {
  const marker = isCloud ? `/storage/v1/object/public/${encodeURIComponent(bucketName)}/` : `/${bucketName}/`
  const index = url.indexOf(marker)
  return index === -1 ? url : decodeURIComponent(url.slice(index + marker.length))
}

export async function getFile(key: string) {
  try {
    if (isCloud) {
      const response = await fetch(storageObjectUrl(key), { headers: cloudHeaders() })
      if (!response.ok) throw new Error(`Supabase Storage download failed: ${await response.text()}`)
      return { success: true, data: response.body }
    }
    const response = await minioClient.send(new GetObjectCommand({ Bucket: bucketName, Key: key }))
    return { success: true, data: response.Body }
  } catch (error) { console.error('Storage get error:', error); return { success: false, error } }
}

export async function deleteFile(key: string) {
  try {
    if (isCloud) {
      const response = await fetch(storageObjectUrl(key), { method: 'DELETE', headers: cloudHeaders() })
      if (!response.ok && response.status !== 404) throw new Error(`Supabase Storage delete failed: ${await response.text()}`)
    } else await minioClient.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
    return { success: true }
  } catch (error) { console.error('Storage delete error:', error); return { success: false, error } }
}

export { minioClient, bucketName as BUCKET_NAME }
