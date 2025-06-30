'use client'

// =============================================
// NOVAGUARD DRAG & DROP UPLOADER
// Advanced file uploader for Solidity contracts
// =============================================

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Upload, 
  File, 
  FileText, 
  X, 
  Check, 
  AlertTriangle, 
  Folder,
  Download,
  Eye,
  Trash2,
  Archive,
  Code
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  content?: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  preview?: string
  metadata?: {
    contractName?: string
    pragma?: string
    functions?: string[]
    imports?: string[]
    complexity?: number
  }
}

interface DragDropUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  onFileSelect?: (file: UploadedFile) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
}

export function DragDropUploader({
  onFilesUploaded,
  onFileSelect,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['.sol', '.txt', '.json'],
  className
}: DragDropUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setIsProcessing(true)

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || getFileType(file.name),
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (const uploadedFile of newFiles) {
      await processFile(uploadedFile)
    }

    setIsProcessing(false)
    onFilesUploaded([...uploadedFiles, ...newFiles])
  }, [uploadedFiles, maxFiles, onFilesUploaded])

  // Process individual file
  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to processing
      updateFileStatus(uploadedFile.id, 'processing', 25)

      // Read file content
      const content = await readFileContent(uploadedFile.file)
      
      // Update progress
      updateFileStatus(uploadedFile.id, 'processing', 50)

      // Validate file
      const validation = validateSolidityFile(content, uploadedFile.name)
      if (!validation.isValid) {
        updateFileStatus(uploadedFile.id, 'error', 0, validation.error)
        return
      }

      // Update progress
      updateFileStatus(uploadedFile.id, 'processing', 75)

      // Extract metadata
      const metadata = extractFileMetadata(content)
      
      // Generate preview
      const preview = generatePreview(content)

      // Update file with processed data
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? {
              ...file,
              content,
              metadata,
              preview,
              status: 'completed',
              progress: 100
            }
          : file
      ))

      toast.success(`${uploadedFile.name} processed successfully`)

    } catch (error) {
      console.error('Error processing file:', error)
      updateFileStatus(
        uploadedFile.id, 
        'error', 
        0, 
        error instanceof Error ? error.message : 'Failed to process file'
      )
      toast.error(`Failed to process ${uploadedFile.name}`)
    }
  }

  // Update file status
  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile['status'], 
    progress: number, 
    error?: string
  ) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, progress, error }
        : file
    ))
  }

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Validate Solidity file
  const validateSolidityFile = (content: string, filename: string) => {
    // Check file extension
    if (!filename.endsWith('.sol') && !filename.endsWith('.txt')) {
      return { isValid: false, error: 'Only .sol and .txt files are supported' }
    }

    // Check if content looks like Solidity
    if (!content.includes('contract') && !content.includes('library') && !content.includes('interface')) {
      return { isValid: false, error: 'File does not appear to contain Solidity code' }
    }

    // Check for basic Solidity syntax
    if (!content.includes('pragma solidity') && !content.includes('// SPDX-License-Identifier')) {
      console.warn('File may be missing pragma or license identifier')
    }

    // Check file size
    if (content.length > 100000) { // 100KB
      return { isValid: false, error: 'File is too large (max 100KB)' }
    }

    return { isValid: true }
  }

  // Extract file metadata
  const extractFileMetadata = (content: string) => {
    const metadata: UploadedFile['metadata'] = {}

    // Extract contract name
    const contractMatch = content.match(/contract\s+(\w+)/)
    if (contractMatch) {
      metadata.contractName = contractMatch[1]
    }

    // Extract pragma version
    const pragmaMatch = content.match(/pragma\s+solidity\s+([^;]+)/)
    if (pragmaMatch) {
      metadata.pragma = pragmaMatch[1]
    }

    // Extract function names
    const functionMatches = content.match(/function\s+(\w+)/g)
    if (functionMatches) {
      metadata.functions = functionMatches.map(match => 
        match.replace('function ', '')
      )
    }

    // Extract imports
    const importMatches = content.match(/import\s+[^;]+/g)
    if (importMatches) {
      metadata.imports = importMatches
    }

    // Calculate complexity (simple metric)
    const lines = content.split('\n').length
    const functions = metadata.functions?.length || 0
    const conditionals = (content.match(/if\s*\(|while\s*\(|for\s*\(/g) || []).length
    metadata.complexity = Math.round((lines + functions * 2 + conditionals) / 10)

    return metadata
  }

  // Generate file preview
  const generatePreview = (content: string): string => {
    const lines = content.split('\n')
    const previewLines = lines.slice(0, 10)
    return previewLines.join('\n') + (lines.length > 10 ? '\n...' : '')
  }

  // Get file type from extension
  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'sol': return 'solidity'
      case 'txt': return 'text'
      case 'json': return 'json'
      default: return 'unknown'
    }
  }

  // Remove file
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    toast.success('File removed')
  }

  // Download file
  const downloadFile = (file: UploadedFile) => {
    if (!file.content) return

    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  // Clear all files
  const clearAllFiles = () => {
    setUploadedFiles([])
    toast.success('All files cleared')
  }

  // Set up dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': acceptedTypes,
      'application/json': ['.json']
    },
    maxSize,
    maxFiles,
    disabled: isProcessing
  })

  // Get status icon
  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  // Get file type badge color
  const getFileTypeBadge = (type: string) => {
    switch (type) {
      case 'solidity':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Solidity</Badge>
      case 'json':
        return <Badge variant="default" className="bg-green-100 text-green-800">JSON</Badge>
      case 'text':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Text</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Solidity Contracts
          </CardTitle>
          <CardDescription>
            Drag and drop your .sol files here, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive && !isDragReject && 'border-blue-500 bg-blue-50',
              isDragReject && 'border-red-500 bg-red-50',
              isProcessing && 'cursor-not-allowed opacity-50',
              !isDragActive && !isDragReject && 'border-gray-300 hover:border-gray-400'
            )}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-600" />
                )}
              </div>
              
              <div>
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop files here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">
                      Drag & drop Solidity files here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports .sol, .txt, .json files up to {Math.round(maxSize / 1024 / 1024)}MB
                    </p>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Folder className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Files ({uploadedFiles.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearAllFiles}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      'p-4 border rounded-lg transition-colors',
                      file.status === 'completed' && 'border-green-200 bg-green-50',
                      file.status === 'error' && 'border-red-200 bg-red-50',
                      file.status === 'processing' && 'border-blue-200 bg-blue-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(file.status)}
                          <span className="font-medium">{file.name}</span>
                          {getFileTypeBadge(file.type)}
                          <span className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>

                        {file.status === 'processing' && (
                          <Progress value={file.progress} className="w-full" />
                        )}

                        {file.status === 'error' && file.error && (
                          <p className="text-sm text-red-600">{file.error}</p>
                        )}

                        {file.status === 'completed' && file.metadata && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {file.metadata.contractName && (
                              <div>
                                <span className="font-medium">Contract:</span> {file.metadata.contractName}
                              </div>
                            )}
                            {file.metadata.pragma && (
                              <div>
                                <span className="font-medium">Pragma:</span> {file.metadata.pragma}
                              </div>
                            )}
                            {file.metadata.functions && (
                              <div>
                                <span className="font-medium">Functions:</span> {file.metadata.functions.length}
                              </div>
                            )}
                            {file.metadata.complexity && (
                              <div>
                                <span className="font-medium">Complexity:</span> {file.metadata.complexity}
                              </div>
                            )}
                          </div>
                        )}

                        {file.status === 'completed' && file.preview && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                              Show Preview
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                              {file.preview}
                            </pre>
                          </details>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {file.status === 'completed' && onFileSelect && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onFileSelect(file)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Select
                          </Button>
                        )}
                        
                        {file.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DragDropUploader
