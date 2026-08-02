'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResumeDropzone } from '@/components/ui/dropzone'
import { Upload, CheckCircle2, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadStatus('idle')
    setError('')
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus('uploading')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setUploadStatus('error')
        setError(data.error || 'Upload failed. Please try again.')
        return
      }

      setUploadStatus('success')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      setUploadStatus('error')
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Your Resume</CardTitle>
            <CardDescription>
              Upload your resume to get AI-powered career recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Resume File</Label>
              <ResumeDropzone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onRemoveFile={handleRemoveFile}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="bg-green-50 text-green-600 p-4 rounded-md flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Resume uploaded successfully! Redirecting to dashboard...</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || uploadStatus === 'success'}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </>
              )}
            </Button>

            <div className="text-sm text-gray-500 space-y-1">
              <p>• Supported formats: PDF, DOCX, DOC, TXT</p>
              <p>• Maximum file size: 10MB</p>
              <p>• Your resume will be analyzed by AI to provide personalized career recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
