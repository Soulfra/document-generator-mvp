import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

interface {{pascalCase name}}UploadProps {
  onSuccess: (jobId: string) => void;
  onError: (error: Error) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

export function {{pascalCase name}}Upload({
  onSuccess,
  onError,
  maxFileSize = {{maxFileSize}},
  acceptedFormats = [{{#each allowedFormats}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
}: {{pascalCase name}}UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxFileSize}MB`);
      } else {
        setError('Invalid file type');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    abortController.current = new AbortController();

    try {
      // Upload file
      const uploadResponse = await api.upload(file, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress * 0.5); // Upload is 50% of total progress
        },
        signal: abortController.current.signal,
      });

      // Create job
      setUploadProgress(60);
      const jobResponse = await api.create{{pascalCase name}}Job({
        fileId: uploadResponse.data.id,
        {{#each additionalFields}}
        {{this.name}}: {{this.defaultValue}},
        {{/each}}
      });

      setUploadProgress(100);
      onSuccess(jobResponse.data.id);
      
      // Reset state
      setFile(null);
    } catch (err: any) {
      if (err.name === 'CanceledError') {
        setError('Upload cancelled');
      } else {
        setError(err.response?.data?.error?.message || 'Upload failed');
        onError(err);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortController.current = null;
    }
  };

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{{title}}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!file && !uploading && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {isDragActive 
                ? 'Drop your file here' 
                : 'Drag & drop your file here'
              }
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: {acceptedFormats.join(', ')} • Max size: {maxFileSize}MB
            </p>
          </div>
        )}

        {file && !uploading && (
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {file && !uploading && (
          <Button 
            onClick={handleUpload} 
            className="w-full"
            size="lg"
          >
            {{submitButtonText}}
          </Button>
        )}

        {{#if showInstructions}}
        <div className="text-sm text-gray-500 space-y-1">
          <p className="font-medium">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            {{#each instructions}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
      </CardContent>
    </Card>
  );
}