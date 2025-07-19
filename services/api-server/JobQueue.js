/**
 * Job Queue - Manages processing jobs and their state
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.jobsFilePath = path.join(__dirname, 'data', 'jobs.json');
    this.initialized = false;
    
    console.log('📋 Job Queue initialized');
  }

  /**
   * Initialize the job queue (load persisted jobs)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.jobsFilePath), { recursive: true });

      // Load existing jobs from file
      try {
        const jobsData = await fs.readFile(this.jobsFilePath, 'utf8');
        const savedJobs = JSON.parse(jobsData);
        
        for (const job of savedJobs) {
          this.jobs.set(job.id, job);
        }
        
        console.log(`📋 Loaded ${this.jobs.size} existing jobs`);
      } catch (error) {
        // File doesn't exist or is empty - that's fine
        console.log('📋 No existing jobs found, starting fresh');
      }

      this.initialized = true;

      // Auto-save jobs periodically
      this.startAutoSave();

    } catch (error) {
      console.error('❌ Failed to initialize job queue:', error);
      throw error;
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData) {
    await this.initialize();

    const job = {
      id: jobData.id || uuidv4(),
      type: jobData.type,
      status: jobData.status || 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...jobData
    };

    this.jobs.set(job.id, job);
    await this.persistJobs();

    console.log(`📋 Created job ${job.id} (${job.type})`);
    return job;
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId) {
    await this.initialize();
    return this.jobs.get(jobId) || null;
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId, updates) {
    await this.initialize();

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.jobs.set(jobId, updatedJob);
    await this.persistJobs();

    console.log(`📋 Updated job ${jobId}: ${updates.status || 'data updated'}`);
    return updatedJob;
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    await this.initialize();

    if (!this.jobs.has(jobId)) {
      throw new Error(`Job ${jobId} not found`);
    }

    this.jobs.delete(jobId);
    await this.persistJobs();

    console.log(`📋 Deleted job ${jobId}`);
  }

  /**
   * Get all jobs (with optional filtering)
   */
  async getJobs(filter = {}) {
    await this.initialize();

    let jobs = Array.from(this.jobs.values());

    // Apply filters
    if (filter.status) {
      jobs = jobs.filter(job => job.status === filter.status);
    }

    if (filter.type) {
      jobs = jobs.filter(job => job.type === filter.type);
    }

    if (filter.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    // Sort by creation date (newest first)
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return jobs;
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status) {
    return this.getJobs({ status });
  }

  /**
   * Get jobs count by status
   */
  async getJobsCount() {
    await this.initialize();

    const counts = {
      total: this.jobs.size,
      uploaded: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    for (const job of this.jobs.values()) {
      if (counts.hasOwnProperty(job.status)) {
        counts[job.status]++;
      }
    }

    return counts;
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    await this.initialize();

    const cutoffDate = new Date(Date.now() - maxAge);
    let deletedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      const jobDate = new Date(job.createdAt);
      
      if (jobDate < cutoffDate && (job.status === 'completed' || job.status === 'failed')) {
        // Clean up files if they exist
        if (job.filePath) {
          try {
            await fs.unlink(job.filePath);
          } catch (error) {
            // File might already be deleted
          }
        }

        if (job.outputPath) {
          try {
            await fs.unlink(job.outputPath);
          } catch (error) {
            // File might already be deleted
          }
        }

        this.jobs.delete(jobId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await this.persistJobs();
      console.log(`📋 Cleaned up ${deletedCount} old jobs`);
    }

    return deletedCount;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    await this.initialize();

    const counts = await this.getJobsCount();
    const jobs = Array.from(this.jobs.values());

    // Calculate average processing time for completed jobs
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.processingTime);
    const avgProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + job.processingTime, 0) / completedJobs.length
      : 0;

    // Find oldest and newest jobs
    const sortedJobs = jobs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const oldestJob = sortedJobs[0];
    const newestJob = sortedJobs[sortedJobs.length - 1];

    return {
      counts,
      avgProcessingTime: Math.round(avgProcessingTime),
      oldestJob: oldestJob ? oldestJob.createdAt : null,
      newestJob: newestJob ? newestJob.createdAt : null,
      successRate: counts.total > 0 
        ? Math.round((counts.completed / (counts.completed + counts.failed)) * 100) || 0
        : 0
    };
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId) {
    const job = await this.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'failed') {
      throw new Error(`Job ${jobId} is not in failed status (current: ${job.status})`);
    }

    // Reset job to queued status
    return this.updateJob(jobId, {
      status: 'queued',
      error: null,
      progress: 0,
      currentStep: 'Retrying...',
      retryCount: (job.retryCount || 0) + 1,
      retriedAt: new Date().toISOString()
    });
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    const job = await this.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error(`Cannot cancel job ${jobId} in status: ${job.status}`);
    }

    return this.updateJob(jobId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });
  }

  /**
   * Persist jobs to file
   */
  async persistJobs() {
    try {
      const jobsArray = Array.from(this.jobs.values());
      await fs.writeFile(this.jobsFilePath, JSON.stringify(jobsArray, null, 2));
    } catch (error) {
      console.error('❌ Failed to persist jobs:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    // Save jobs every 30 seconds
    this.autoSaveTimer = setInterval(async () => {
      await this.persistJobs();
    }, 30000);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Close the job queue
   */
  async close() {
    this.stopAutoSave();
    await this.persistJobs();
    console.log('📋 Job Queue closed');
  }
}

module.exports = JobQueue;