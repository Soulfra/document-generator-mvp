# Week 1: MVP $1 Cleanup Service

## Overview

Week 1 focuses on building the core MVP - a $1 code cleanup service that demonstrates the platform's value proposition. By the end of this week, users can upload code, pay $1, and receive cleaned code.

## Day 1: Foundation Setup

### Morning (4 hours)
Set up the core infrastructure:

```bash
# Initialize project structure
cd finishthisidea
npm install

# Start development environment
docker-compose up -d

# Run database migrations
cd src/mvp-cleanup-service/backend
npx prisma migrate dev --name init
```

### Afternoon (4 hours)
Implement basic Express server:

**src/mvp-cleanup-service/backend/src/server.ts**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { uploadRouter } from './routes/upload';
import { jobRouter } from './routes/job';
import { errorHandler } from './middleware/error';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/jobs', jobRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cleanup service running on port ${PORT}`);
});
```

## Day 2: File Upload System

### Morning (4 hours)
Implement file upload with Multer and S3:

**src/mvp-cleanup-service/backend/src/routes/upload.ts**
```typescript
import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const router = Router();
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-tar' ||
        file.mimetype === 'application/gzip') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileId = uuidv4();
    const fileHash = createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || 'uploads',
      Key: `${fileId}/${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: req.file.originalname,
        fileHash,
        uploadedBy: req.ip,
      },
    }));

    res.json({
      success: true,
      data: {
        id: fileId,
        filename: req.file.originalname,
        size: req.file.size,
        hash: fileHash,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRouter };
```

### Afternoon (4 hours)
Create frontend upload component:

**src/mvp-cleanup-service/frontend/components/FileUpload.tsx**
```tsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export function FileUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(progress);
        },
      });

      onUploadComplete(response.data.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-tar': ['.tar'],
      'application/gzip': ['.tar.gz'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center
          cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        {uploading ? (
          <div>
            <p className="text-lg mb-4">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400">
              {/* Upload icon */}
            </svg>
            <p className="text-lg mb-2">
              {isDragActive 
                ? 'Drop your code here' 
                : 'Drag & drop your code here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to select files (ZIP, TAR, TAR.GZ)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

## Day 3: Payment Integration

### Morning (4 hours)
Integrate Stripe for $1 payments:

**src/mvp-cleanup-service/backend/src/services/payment.service.ts**
```typescript
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const prisma = new PrismaClient();

export class PaymentService {
  async createCheckoutSession(uploadId: string, userEmail: string) {
    // Create or get customer
    let customer = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!customer) {
      const stripeCustomer = await stripe.customers.create({
        email: userEmail,
        metadata: { source: 'cleanup-service' },
      });

      customer = await prisma.user.create({
        data: {
          email: userEmail,
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.stripeCustomerId!,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Code Cleanup',
              description: 'AI-powered code cleanup and formatting',
            },
            unit_amount: 100, // $1.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/upload`,
      metadata: {
        uploadId,
        service: 'cleanup',
      },
    });

    return session;
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleSuccessfulPayment(session);
        break;
    }
  }

  private async handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    const { uploadId } = session.metadata!;

    // Create job
    const job = await prisma.job.create({
      data: {
        userId: session.customer as string,
        type: 'cleanup',
        status: 'PENDING',
        input: { uploadId },
        metadata: {
          stripeSessionId: session.id,
          amountPaid: session.amount_total,
        },
      },
    });

    // Add to queue
    await this.queueJob(job.id);
  }

  private async queueJob(jobId: string) {
    // Add to Bull queue (implemented next)
  }
}
```

### Afternoon (4 hours)
Create payment flow UI:

**src/mvp-cleanup-service/frontend/pages/checkout.tsx**
```tsx
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const { uploadId } = router.query;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uploadId) {
      router.push('/');
      return;
    }

    initiateCheckout();
  }, [uploadId]);

  const initiateCheckout = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      const result = await stripe!.redirectToCheckout({ sessionId });
      
      if (result.error) {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-lg">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
```

## Day 4: Queue Processing

### Morning (4 hours)
Implement Bull queue for job processing:

**src/mvp-cleanup-service/backend/src/queues/cleanup.queue.ts**
```typescript
import Bull from 'bull';
import { PrismaClient } from '@prisma/client';
import { CleanupService } from '../services/cleanup.service';
import { StorageService } from '../services/storage.service';

const prisma = new PrismaClient();
const cleanupQueue = new Bull('cleanup', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

cleanupQueue.process(async (job) => {
  const { jobId } = job.data;
  
  try {
    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Get job details
    const jobData = await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true },
    });

    if (!jobData) {
      throw new Error('Job not found');
    }

    // Download file from S3
    const storage = new StorageService();
    const filePath = await storage.downloadFile(jobData.input.uploadId);

    // Process with cleanup service
    const cleanup = new CleanupService();
    const result = await cleanup.processFile(filePath, {
      onProgress: (progress) => job.progress(progress),
    });

    // Upload result
    const resultUrl = await storage.uploadResult(result, jobId);

    // Update job with result
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        output: { url: resultUrl },
        metadata: {
          ...jobData.metadata,
          filesProcessed: result.stats.filesProcessed,
          linesModified: result.stats.linesModified,
        },
      },
    });

    // Send completion email
    await sendCompletionEmail(jobData.user.email, resultUrl);

  } catch (error) {
    console.error('Job processing failed:', error);
    
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
    });
    
    throw error;
  }
});

export { cleanupQueue };
```

### Afternoon (4 hours)
Implement core cleanup logic with Ollama:

**src/mvp-cleanup-service/backend/src/services/cleanup.service.ts**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import ollama from 'ollama';

const execAsync = promisify(exec);

export class CleanupService {
  private readonly supportedExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', 
    '.rs', '.cpp', '.c', '.h', '.hpp', '.cs', '.rb'
  ];

  async processFile(archivePath: string, options: any) {
    const workDir = await this.extractArchive(archivePath);
    const files = await this.findCodeFiles(workDir);
    
    let processed = 0;
    const results = [];

    for (const file of files) {
      // Read file content
      const content = await fs.readFile(file, 'utf-8');
      
      // Clean with AI
      const cleaned = await this.cleanCode(content, path.extname(file));
      
      // Write cleaned content
      await fs.writeFile(file, cleaned);
      
      processed++;
      options.onProgress?.(Math.round((processed / files.length) * 100));
      
      results.push({
        file: path.relative(workDir, file),
        changes: this.detectChanges(content, cleaned),
      });
    }

    // Create result archive
    const resultPath = await this.createResultArchive(workDir);
    
    return {
      path: resultPath,
      stats: {
        filesProcessed: processed,
        linesModified: results.reduce((sum, r) => sum + r.changes.lines, 0),
      },
      changes: results,
    };
  }

  private async cleanCode(content: string, extension: string): Promise<string> {
    try {
      // Try Ollama first
      const response = await ollama.chat({
        model: 'codellama',
        messages: [
          {
            role: 'system',
            content: `You are a code cleanup assistant. Clean and format the following ${extension} code:
            - Fix indentation and formatting
            - Remove unnecessary comments and console.logs
            - Organize imports
            - Fix obvious syntax issues
            - Maintain functionality
            
            Return ONLY the cleaned code, no explanations.`,
          },
          {
            role: 'user',
            content: content,
          },
        ],
      });

      return response.message.content;
    } catch (error) {
      // Fallback to basic cleanup
      return this.basicCleanup(content, extension);
    }
  }

  private basicCleanup(content: string, extension: string): string {
    let cleaned = content;
    
    // Remove console.logs
    cleaned = cleaned.replace(/console\.(log|debug|info|warn|error)\([^)]*\);?\n?/g, '');
    
    // Remove trailing whitespace
    cleaned = cleaned.replace(/[ \t]+$/gm, '');
    
    // Ensure consistent line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');
    
    // Remove multiple blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  private detectChanges(original: string, cleaned: string) {
    const originalLines = original.split('\n');
    const cleanedLines = cleaned.split('\n');
    
    let changes = 0;
    for (let i = 0; i < Math.max(originalLines.length, cleanedLines.length); i++) {
      if (originalLines[i] !== cleanedLines[i]) {
        changes++;
      }
    }
    
    return {
      lines: changes,
      reduction: Math.round(((original.length - cleaned.length) / original.length) * 100),
    };
  }

  private async extractArchive(archivePath: string): Promise<string> {
    const workDir = path.join('/tmp', `cleanup-${Date.now()}`);
    await fs.ensureDir(workDir);
    
    if (archivePath.endsWith('.zip')) {
      await execAsync(`unzip -q "${archivePath}" -d "${workDir}"`);
    } else if (archivePath.endsWith('.tar.gz')) {
      await execAsync(`tar -xzf "${archivePath}" -C "${workDir}"`);
    } else if (archivePath.endsWith('.tar')) {
      await execAsync(`tar -xf "${archivePath}" -C "${workDir}"`);
    }
    
    return workDir;
  }

  private async findCodeFiles(dir: string): Promise<string[]> {
    const pattern = `**/*{${this.supportedExtensions.join(',')}}`;
    return glob(pattern, { 
      cwd: dir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/vendor/**', '**/dist/**'],
    });
  }

  private async createResultArchive(workDir: string): Promise<string> {
    const outputPath = `${workDir}.zip`;
    await execAsync(`cd "${workDir}" && zip -r "${outputPath}" .`);
    return outputPath;
  }
}
```

## Day 5: Testing & Polish

### Morning (4 hours)
End-to-end testing:

**src/mvp-cleanup-service/backend/src/__tests__/cleanup.e2e.test.ts**
```typescript
import request from 'supertest';
import { app } from '../server';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Cleanup Service E2E', () => {
  let uploadId: string;

  test('Upload file', async () => {
    const testFile = path.join(__dirname, 'fixtures/messy-code.zip');
    const response = await request(app)
      .post('/api/upload')
      .attach('file', testFile)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    uploadId = response.body.data.id;
  });

  test('Create checkout session', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .send({ uploadId, email: 'test@example.com' })
      .expect(200);

    expect(response.body.sessionId).toBeDefined();
    expect(response.body.url).toContain('checkout.stripe.com');
  });

  test('Process webhook', async () => {
    // Simulate Stripe webhook
    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          metadata: { uploadId },
        },
      },
    };

    await request(app)
      .post('/api/stripe/webhook')
      .send(webhookPayload)
      .set('stripe-signature', generateTestSignature(webhookPayload))
      .expect(200);

    // Verify job was created
    const jobResponse = await request(app)
      .get(`/api/jobs?uploadId=${uploadId}`)
      .expect(200);

    expect(jobResponse.body.data.status).toBe('PENDING');
  });

  test('Check job status', async () => {
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    const response = await request(app)
      .get(`/api/jobs/${jobId}`)
      .expect(200);

    expect(response.body.data.status).toBe('COMPLETED');
    expect(response.body.data.output.url).toBeDefined();
  });
});
```

### Afternoon (4 hours)
Polish UI and add progress tracking:

**src/mvp-cleanup-service/frontend/pages/status/[jobId].tsx**
```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function JobStatusPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      
      setJob(data.data);
      
      if (['COMPLETED', 'FAILED'].includes(data.data.status)) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          {job.status === 'PENDING' && <Clock className="w-6 h-6 text-yellow-500 mr-2" />}
          {job.status === 'PROCESSING' && <Clock className="w-6 h-6 text-blue-500 mr-2 animate-spin" />}
          {job.status === 'COMPLETED' && <CheckCircle className="w-6 h-6 text-green-500 mr-2" />}
          {job.status === 'FAILED' && <AlertCircle className="w-6 h-6 text-red-500 mr-2" />}
          
          <h2 className="text-xl font-semibold">
            {job.status === 'PENDING' && 'Waiting in queue...'}
            {job.status === 'PROCESSING' && 'Cleaning your code...'}
            {job.status === 'COMPLETED' && 'Cleanup complete!'}
            {job.status === 'FAILED' && 'Cleanup failed'}
          </h2>
        </div>

        {job.status === 'PROCESSING' && job.progress && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">{job.progress}% complete</p>
          </div>
        )}

        {job.status === 'COMPLETED' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800">
                ✨ Your code has been cleaned! 
                {job.metadata?.filesProcessed && (
                  <span> {job.metadata.filesProcessed} files processed.</span>
                )}
              </p>
            </div>

            <a
              href={`/api/download/${job.id}`}
              className="block w-full bg-blue-500 text-white text-center py-3 rounded-lg hover:bg-blue-600"
            >
              Download Cleaned Code
            </a>

            <div className="text-sm text-gray-500">
              Download link expires in 24 hours
            </div>
          </div>
        )}

        {job.status === 'FAILED' && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">
              {job.error?.message || 'An error occurred during processing'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Day 6-7: Launch Preparation

### Day 6 Morning
Security hardening:
- Rate limiting
- Input validation
- CORS configuration
- API key authentication

### Day 6 Afternoon
Performance optimization:
- Redis caching
- Database indexing
- CDN setup
- Load testing

### Day 7 Morning
Documentation:
- API documentation
- User guide
- FAQ section
- Terms of service

### Day 7 Afternoon
Launch checklist:
- Domain setup
- SSL certificates
- Monitoring (Sentry)
- Analytics (Plausible)
- Backup system
- Support email

## MVP Features Checklist

✅ **Core Features**
- [ ] File upload (ZIP, TAR, TAR.GZ)
- [ ] $1 Stripe payment
- [ ] Code cleanup with Ollama
- [ ] Progress tracking
- [ ] Download cleaned code
- [ ] Email notifications

✅ **Technical Stack**
- [ ] Next.js frontend
- [ ] Express.js backend
- [ ] PostgreSQL + Prisma
- [ ] Redis + Bull queue
- [ ] MinIO/S3 storage
- [ ] Ollama integration

✅ **Quality Assurance**
- [ ] Unit tests (>80% coverage)
- [ ] E2E tests
- [ ] Error handling
- [ ] Logging system
- [ ] Performance monitoring

## Success Metrics

- **Day 1**: 10 users, $10 revenue
- **Week 1**: 100 users, $100 revenue  
- **Month 1**: 1,000 users, $1,000 revenue

## Next Steps

After launching the MVP:
1. Gather user feedback
2. Implement Tinder interface (Week 2)
3. Add more services (Week 3)
4. Enterprise features (Week 4)

Remember: **Ship fast, iterate based on feedback!**