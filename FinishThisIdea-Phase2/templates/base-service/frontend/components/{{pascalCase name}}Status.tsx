import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface {{pascalCase name}}StatusProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  onRetry?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  output?: {
    url: string;
    expiresAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
  metadata?: any;
}

export function {{pascalCase name}}Status({
  jobId,
  onComplete,
  onError,
  onRetry,
  autoRefresh = true,
  refreshInterval = 2000,
}: {{pascalCase name}}StatusProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const response = await api.get{{pascalCase name}}Job(jobId);
        const newStatus = response.data;
        setStatus(newStatus);
        setLoading(false);

        // Call callbacks
        if (newStatus.status === 'completed' && onComplete) {
          onComplete(newStatus);
        } else if (newStatus.status === 'failed' && onError) {
          onError(new Error(newStatus.error?.message || 'Job failed'));
        }

        // Stop polling if job is finished
        if (['completed', 'failed', 'cancelled'].includes(newStatus.status)) {
          if (interval) clearInterval(interval);
        }
      } catch (error) {
        setLoading(false);
        if (onError) onError(error as Error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling
    if (autoRefresh) {
      interval = setInterval(fetchStatus, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, onComplete, onError, autoRefresh, refreshInterval]);

  const handleDownload = async () => {
    if (!status?.output?.url) return;
    
    setDownloading(true);
    try {
      await api.download(status.output.url, `{{kebabCase name}}-${jobId}.{{outputExtension}}`);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getProgressMessage = () => {
    if (!status) return '';
    
    switch (status.status) {
      case 'pending':
        return 'Waiting in queue...';
      case 'processing':
        return `Processing... ${status.progress}%`;
      case 'completed':
        return 'Processing complete!';
      case 'failed':
        return status.error?.message || 'Processing failed';
      case 'cancelled':
        return 'Job was cancelled';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertDescription>Job not found</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{{statusTitle}}</CardTitle>
          <Badge variant={getStatusColor() as any}>
            <span className="flex items-center gap-1">
              {getStatusIcon()}
              {status.status}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {status.status === 'processing' && (
          <div className="space-y-2">
            <Progress value={status.progress} />
            <p className="text-sm text-gray-500">{getProgressMessage()}</p>
          </div>
        )}

        {/* Status message */}
        {status.status !== 'processing' && (
          <Alert variant={status.status === 'failed' ? 'destructive' : 'default'}>
            <AlertDescription>{getProgressMessage()}</AlertDescription>
          </Alert>
        )}

        {/* Job details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Job ID</p>
            <p className="font-mono">{status.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p>{formatDistanceToNow(new Date(status.createdAt), { addSuffix: true })}</p>
          </div>
          {status.startedAt && (
            <div>
              <p className="text-gray-500">Started</p>
              <p>{formatDistanceToNow(new Date(status.startedAt), { addSuffix: true })}</p>
            </div>
          )}
          {status.completedAt && (
            <div>
              <p className="text-gray-500">Completed</p>
              <p>{formatDistanceToNow(new Date(status.completedAt), { addSuffix: true })}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {status.status === 'completed' && status.output && (
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Result
            </Button>
          )}
          
          {status.status === 'failed' && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Metadata */}
        {status.metadata && Object.keys(status.metadata).length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Additional Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
              {JSON.stringify(status.metadata, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}