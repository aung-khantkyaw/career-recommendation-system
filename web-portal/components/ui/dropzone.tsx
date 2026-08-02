'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'

interface FileWithPreview extends File {
  preview?: string
}

interface ResumeDropzoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onRemoveFile: () => void
}

export function ResumeDropzone({ onFileSelect, selectedFile, onRemoveFile }: ResumeDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  return (
    <div className="w-full">
      {!selectedFile ? (
        <Card
          {...getRootProps()}
          className={`border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 text-center">
              {isDragActive ? (
                'Drop your resume here'
              ) : (
                <>
                  Drag & drop your resume here, or <span className="text-blue-600">browse</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports PDF, DOCX, DOC, TXT (max 10MB)
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
