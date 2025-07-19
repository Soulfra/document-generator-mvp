#!/usr/bin/env node

const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function setupMinIO() {
  // Configure S3 client for MinIO
  const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9002',
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin'
    },
    forcePathStyle: true // Required for MinIO
  });

  const bucketName = process.env.S3_BUCKET_NAME || 'finishthisidea-storage';

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket '${bucketName}' already exists`);
  } catch (error) {
    if (error.name === 'NotFound') {
      // Create bucket
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Created bucket '${bucketName}'`);
      } catch (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to check bucket:', error.message);
      process.exit(1);
    }
  }
}

// Load environment variables
require('dotenv').config();

setupMinIO().then(() => {
  console.log('✅ MinIO setup complete');
}).catch(error => {
  console.error('❌ MinIO setup failed:', error);
  process.exit(1);
});