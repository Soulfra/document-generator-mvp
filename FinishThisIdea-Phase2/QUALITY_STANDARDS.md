# Quality Standards - Zero Tolerance Policy

## 🚨 MANDATORY RULES - NO EXCEPTIONS

### 1. NO STUBS, NO PLACEHOLDERS, NO "TODO LATER"

```typescript
// ❌ FORBIDDEN - NEVER DO THIS
export function processPayment(amount: number) {
  // TODO: Implement payment processing
  throw new Error('Not implemented');
}

// ✅ REQUIRED - ALWAYS COMPLETE IMPLEMENTATION
export async function processPayment(amount: number): Promise<PaymentResult> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Code Cleanup' },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });
  
  return {
    success: true,
    sessionId: session.id,
    url: session.url,
  };
}
```

### 2. EVERY FILE MUST BE PRODUCTION-READY

Before creating ANY file, ensure:
- [ ] Complete implementation (no TODOs)
- [ ] Error handling for all edge cases
- [ ] Input validation
- [ ] TypeScript types (no `any`)
- [ ] Logging for debugging
- [ ] Performance considerations
- [ ] Security review

### 3. TESTING IS NOT OPTIONAL

Every feature MUST include:

#### Unit Tests (minimum 80% coverage)
```typescript
// For EVERY function/class/component
describe('processPayment', () => {
  it('should create Stripe session successfully', async () => {
    const result = await processPayment(100);
    expect(result.success).toBe(true);
    expect(result.sessionId).toMatch(/^cs_test_/);
  });
  
  it('should handle Stripe errors gracefully', async () => {
    mockStripe.throwError();
    await expect(processPayment(100)).rejects.toThrow('Payment failed');
  });
  
  it('should validate amount is positive', async () => {
    await expect(processPayment(-1)).rejects.toThrow('Invalid amount');
  });
});
```

#### Integration Tests
```typescript
// Test complete flows
describe('Cleanup Service E2E', () => {
  it('should process file from upload to download', async () => {
    // 1. Upload file
    const upload = await request(app)
      .post('/api/upload')
      .attach('file', 'test-files/messy-code.zip');
      
    // 2. Create payment
    const payment = await request(app)
      .post('/api/checkout')
      .send({ uploadId: upload.body.data.id });
      
    // 3. Simulate webhook
    await request(app)
      .post('/api/stripe/webhook')
      .send(mockWebhookPayload(payment.body.sessionId));
      
    // 4. Check job status
    const job = await waitForJob(upload.body.data.id);
    expect(job.status).toBe('completed');
    
    // 5. Download result
    const download = await request(app)
      .get(`/api/download/${job.id}`)
      .expect(200);
  });
});
```

### 4. DOCUMENTATION FOR 5-YEAR-OLDS

Every piece of documentation must be:

#### Crystal Clear
```markdown
# How to Upload Your Code

## What You Need
- Your messy code in a folder
- A computer with internet
- $1 (one dollar)

## Step 1: Make a ZIP File
1. Find your code folder
2. Right-click on it
3. Click "Compress" or "Make ZIP"
4. You now have a `.zip` file!

## Step 2: Upload the ZIP
1. Go to finishthisidea.com
2. Click the big blue "Upload" button
3. Choose your ZIP file
4. Wait for the green checkmark ✓

## Step 3: Pay $1
1. Click "Pay Now"
2. Type your card number (ask a grown-up)
3. Click "Pay $1"
4. See the success page!

## Step 4: Get Clean Code
1. Wait for email (usually 5 minutes)
2. Click the download link
3. Unzip your clean code
4. Your code is now neat and tidy! 🎉
```

#### With Pictures (ASCII if needed)
```
┌─────────────────┐
│   Your Messy    │
│     Code        │
│  📁 project/    │
└────────┬────────┘
         │ Upload
         ↓
┌─────────────────┐
│  FinishThisIdea │
│   💻 ✨ 🤖      │
│   Processing... │
└────────┬────────┘
         │ Download
         ↓
┌─────────────────┐
│   Clean Code!   │
│  📁 project/    │
│     ✨ ✨ ✨      │
└─────────────────┘
```

### 5. NO DUPLICATES POLICY

Before creating ANY file:

```bash
# Check if similar file exists
find . -name "*similar*" -type f

# Check if functionality exists
grep -r "functionName" src/

# Check documentation
grep -r "feature description" docs/
```

If found: UPDATE existing file, don't create new one.

### 6. COMPLETE FEATURE CHECKLIST

For EVERY feature, no matter how small:

- [ ] **Planning**
  - [ ] Check if feature already exists
  - [ ] Document in appropriate `/docs` folder
  - [ ] Design API interface
  - [ ] Plan error cases

- [ ] **Implementation**
  - [ ] Complete working code
  - [ ] TypeScript types (no `any`)
  - [ ] Error handling
  - [ ] Logging
  - [ ] Performance optimization

- [ ] **Testing**
  - [ ] Unit tests (>80% coverage)
  - [ ] Integration tests
  - [ ] E2E test for critical path
  - [ ] Manual testing checklist

- [ ] **Documentation**
  - [ ] Code comments
  - [ ] API documentation
  - [ ] User guide
  - [ ] Troubleshooting section

- [ ] **Review**
  - [ ] Security audit
  - [ ] Performance check
  - [ ] Accessibility review
  - [ ] Mobile compatibility

## Examples of UNACCEPTABLE Code

### ❌ Stub Function
```typescript
function calculatePrice() {
  // TODO: implement pricing logic
  return 0;
}
```

### ❌ Partial Implementation  
```typescript
async function uploadFile(file: File) {
  // Only handles happy path
  const result = await s3.upload(file);
  return result.url;
}
```

### ❌ No Error Handling
```typescript
app.post('/api/process', (req, res) => {
  const result = processCode(req.body.code);
  res.json(result);
});
```

### ❌ Missing Tests
```typescript
// Complex function with no tests
export function analyzeCodeComplexity(ast: AST): ComplexityReport {
  // 200 lines of untested logic
}
```

## Examples of REQUIRED Quality

### ✅ Complete Implementation
```typescript
export async function uploadFile(file: File): Promise<UploadResult> {
  // Validation
  if (!file) {
    throw new ValidationError('No file provided');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File too large: ${file.size} bytes`);
  }
  
  const allowedTypes = ['application/zip', 'application/x-tar'];
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`Invalid file type: ${file.type}`);
  }
  
  try {
    // Generate unique ID
    const fileId = crypto.randomUUID();
    const key = `uploads/${fileId}/${file.name}`;
    
    // Upload with retry
    const result = await retry(
      async () => {
        return await s3.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: file.buffer,
          ContentType: file.type,
          Metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        }));
      },
      {
        retries: 3,
        onRetry: (error, attempt) => {
          logger.warn(`Upload retry attempt ${attempt}`, { error, fileId });
        },
      }
    );
    
    logger.info('File uploaded successfully', { fileId, size: file.size });
    
    return {
      success: true,
      fileId,
      url: `${process.env.S3_ENDPOINT}/${key}`,
      size: file.size,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    
  } catch (error) {
    logger.error('File upload failed', { error, fileName: file.name });
    
    if (error instanceof S3ServiceException) {
      throw new ExternalServiceError('Storage service unavailable');
    }
    
    throw new InternalError('Upload failed', { cause: error });
  }
}
```

### ✅ Comprehensive Tests
```typescript
describe('uploadFile', () => {
  let mockS3: MockS3Client;
  
  beforeEach(() => {
    mockS3 = new MockS3Client();
  });
  
  describe('validation', () => {
    it('should reject missing file', async () => {
      await expect(uploadFile(null as any))
        .rejects.toThrow('No file provided');
    });
    
    it('should reject oversized files', async () => {
      const largeFile = createMockFile({ size: MAX_FILE_SIZE + 1 });
      await expect(uploadFile(largeFile))
        .rejects.toThrow(/File too large/);
    });
    
    it('should reject invalid file types', async () => {
      const invalidFile = createMockFile({ type: 'text/plain' });
      await expect(uploadFile(invalidFile))
        .rejects.toThrow(/Invalid file type/);
    });
  });
  
  describe('upload process', () => {
    it('should upload valid file successfully', async () => {
      const file = createMockFile({ name: 'test.zip' });
      const result = await uploadFile(file);
      
      expect(result.success).toBe(true);
      expect(result.fileId).toMatch(/^[0-9a-f]{8}-/);
      expect(result.url).toContain('test.zip');
      expect(mockS3.uploads).toHaveLength(1);
    });
    
    it('should retry on transient failures', async () => {
      mockS3.failTimes(2);
      const file = createMockFile();
      
      const result = await uploadFile(file);
      
      expect(result.success).toBe(true);
      expect(mockS3.attempts).toBe(3);
    });
    
    it('should handle S3 service errors', async () => {
      mockS3.throwServiceError();
      const file = createMockFile();
      
      await expect(uploadFile(file))
        .rejects.toThrow('Storage service unavailable');
    });
  });
  
  describe('metadata', () => {
    it('should include proper metadata', async () => {
      const file = createMockFile({ name: 'project.zip' });
      await uploadFile(file);
      
      const upload = mockS3.getLastUpload();
      expect(upload.Metadata.originalName).toBe('project.zip');
      expect(upload.Metadata.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });
});
```

### ✅ Clear Documentation
```markdown
# Upload File API

## What It Does
Takes your code file and saves it to our servers so we can clean it up.

## How to Use It

### Simple Example
```javascript
const formData = new FormData();
formData.append('file', yourZipFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('File ID:', result.data.id);
```

### What You Send
- `file`: Your ZIP file (max 50MB)

### What You Get Back
```json
{
  "success": true,
  "data": {
    "id": "abc-123",
    "size": 1024000,
    "expiresAt": "2024-01-21T10:00:00Z"
  }
}
```

### What Can Go Wrong
1. **File too big** (over 50MB)
   - Solution: Make ZIP smaller
   
2. **Wrong file type** (not ZIP)
   - Solution: Compress to ZIP first
   
3. **Server error** (our fault)
   - Solution: Try again in 1 minute
```

## Enforcement

1. **Code Reviews**: REJECT any PR with stubs or missing tests
2. **CI/CD**: BLOCK deployment if coverage < 80%
3. **Documentation**: REQUIRE docs update with every feature
4. **Monitoring**: ALERT on any TODO comments in production

## Remember

Every line of code you write represents a promise to our users. Keep that promise by delivering complete, tested, documented features every single time.

**No shortcuts. No excuses. Only excellence.**