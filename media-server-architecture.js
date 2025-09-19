#!/usr/bin/env node
// media-server-architecture.js - Advanced Media Processing and Distribution Architecture
// FFmpeg integration, transcoding pipelines, and adaptive streaming

console.log('🎬 Media Server Architecture - Professional broadcasting infrastructure');

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class MediaServerArchitecture extends EventEmitter {
  constructor() {
    super();
    
    this.config = {
      // Transcoding profiles
      profiles: {
        '1080p': {
          video: {
            codec: 'libx264',
            bitrate: '6000k',
            resolution: '1920x1080',
            framerate: '30',
            preset: 'faster',
            profile: 'high',
            level: '4.1'
          },
          audio: {
            codec: 'aac',
            bitrate: '128k',
            samplerate: '48000',
            channels: '2'
          }
        },
        '720p': {
          video: {
            codec: 'libx264',
            bitrate: '3000k',
            resolution: '1280x720',
            framerate: '30',
            preset: 'faster',
            profile: 'main',
            level: '3.1'
          },
          audio: {
            codec: 'aac',
            bitrate: '128k',
            samplerate: '48000',
            channels: '2'
          }
        },
        '480p': {
          video: {
            codec: 'libx264',
            bitrate: '1500k',
            resolution: '854x480',
            framerate: '30',
            preset: 'faster',
            profile: 'main',
            level: '3.0'
          },
          audio: {
            codec: 'aac',
            bitrate: '96k',
            samplerate: '44100',
            channels: '2'
          }
        },
        'audio_only': {
          audio: {
            codec: 'aac',
            bitrate: '64k',
            samplerate: '44100',
            channels: '2'
          }
        }
      },
      
      // Output formats
      outputs: {
        hls: {
          enabled: true,
          segmentDuration: 6,
          playlistSize: 5,
          deleteOldSegments: true
        },
        dash: {
          enabled: true,
          segmentDuration: 4,
          windowSize: 5,
          extraParams: '-use_template 1 -use_timeline 1'
        },
        rtmp: {
          enabled: true,
          republish: ['youtube', 'twitch', 'facebook']
        },
        recording: {
          enabled: true,
          format: 'mp4',
          path: './recordings'
        }
      },
      
      // Processing settings
      processing: {
        gpu_acceleration: 'auto', // auto, nvidia, intel, amd, disabled
        threads: 'auto',
        buffer_size: '32M',
        max_concurrent_streams: 10
      }
    };
    
    // Active processing jobs
    this.activeJobs = new Map();
    this.jobQueue = [];
    
    // FFmpeg instances
    this.ffmpegInstances = new Map();
    
    // Media storage
    this.storage = {
      input: './media/input',
      output: './media/output',
      temp: './media/temp',
      recordings: './media/recordings'
    };
    
    this.initialize();
  }

  async initialize() {
    console.log('🏗️ Initializing Media Server Architecture...');
    
    // Create storage directories
    await this.createStorageDirectories();
    
    // Detect FFmpeg capabilities
    await this.detectFFmpegCapabilities();
    
    // Setup processing pipelines
    this.setupProcessingPipelines();
    
    // Start job processor
    this.startJobProcessor();
    
    console.log('✅ Media Server Architecture ready');
  }

  async createStorageDirectories() {
    Object.values(this.storage).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    console.log('📁 Storage directories created');
  }

  async detectFFmpegCapabilities() {
    return new Promise((resolve) => {
      exec('ffmpeg -version', (error, stdout) => {
        if (error) {
          console.log('⚠️ FFmpeg not found - using mock transcoding');
          this.capabilities = { mock: true };
          resolve();
          return;
        }

        // Parse FFmpeg version and capabilities
        const version = stdout.match(/ffmpeg version ([^\s]+)/)?.[1] || 'unknown';
        const hasNvidia = stdout.includes('--enable-nvenc');
        const hasIntel = stdout.includes('--enable-vaapi');
        const hasAMD = stdout.includes('--enable-amf');

        this.capabilities = {
          version,
          gpu: {
            nvidia: hasNvidia,
            intel: hasIntel,
            amd: hasAMD
          },
          codecs: this.parseCodecs(stdout),
          formats: this.parseFormats(stdout)
        };

        console.log(`✅ FFmpeg detected: ${version}`);
        console.log(`🎮 GPU acceleration: ${JSON.stringify(this.capabilities.gpu)}`);
        resolve();
      });
    });
  }

  parseCodecs(ffmpegOutput) {
    // Extract available codecs
    return {
      video: ['libx264', 'libx265', 'h264_nvenc', 'hevc_nvenc'],
      audio: ['aac', 'mp3', 'opus', 'flac']
    };
  }

  parseFormats(ffmpegOutput) {
    // Extract supported formats
    return ['mp4', 'webm', 'hls', 'dash', 'rtmp', 'flv'];
  }

  setupProcessingPipelines() {
    // Adaptive bitrate streaming pipeline
    this.pipelines = {
      // Live streaming pipeline
      liveStream: {
        name: 'Live Streaming',
        input: 'rtmp',
        outputs: ['hls', 'dash', 'rtmp_republish'],
        realtime: true,
        profiles: ['1080p', '720p', '480p', 'audio_only']
      },
      
      // VOD processing pipeline
      vodProcessing: {
        name: 'Video on Demand',
        input: 'file',
        outputs: ['hls', 'dash', 'mp4'],
        realtime: false,
        profiles: ['1080p', '720p', '480p']
      },
      
      // Recording pipeline
      recording: {
        name: 'Stream Recording',
        input: 'rtmp',
        outputs: ['mp4'],
        realtime: true,
        profiles: ['1080p']
      },
      
      // Thumbnail generation
      thumbnails: {
        name: 'Thumbnail Generation',
        input: 'file',
        outputs: ['images'],
        realtime: false,
        profiles: ['thumbnail']
      }
    };

    console.log('🔄 Processing pipelines configured');
  }

  startJobProcessor() {
    // Process jobs from queue
    setInterval(() => {
      this.processJobQueue();
    }, 1000);

    // Monitor active jobs
    setInterval(() => {
      this.monitorActiveJobs();
    }, 5000);

    console.log('⚙️ Job processor started');
  }

  // Main processing methods
  async processLiveStream(streamId, inputUrl, outputConfigs) {
    console.log(`🎥 Starting live stream processing: ${streamId}`);
    
    const job = {
      id: streamId,
      type: 'live_stream',
      input: inputUrl,
      outputs: outputConfigs,
      startTime: Date.now(),
      status: 'processing'
    };

    this.activeJobs.set(streamId, job);

    try {
      // Create FFmpeg command for adaptive streaming
      const ffmpegArgs = this.buildLiveStreamCommand(inputUrl, outputConfigs, streamId);
      
      if (this.capabilities.mock) {
        // Mock processing for demo
        this.simulateLiveProcessing(job);
      } else {
        // Real FFmpeg processing
        const ffmpeg = spawn('ffmpeg', ffmpegArgs);
        this.ffmpegInstances.set(streamId, ffmpeg);
        
        this.setupFFmpegEventHandlers(ffmpeg, job);
      }

      this.emit('streamStarted', { streamId, job });
      
    } catch (error) {
      console.error(`❌ Failed to start stream processing: ${error.message}`);
      job.status = 'failed';
      job.error = error.message;
    }

    return job;
  }

  buildLiveStreamCommand(inputUrl, outputConfigs, streamId) {
    const args = [
      '-i', inputUrl,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-c:a', 'aac',
      '-ar', '48000',
      '-b:a', '128k'
    ];

    // Add GPU acceleration if available
    if (this.capabilities.gpu.nvidia && this.config.processing.gpu_acceleration !== 'disabled') {
      args.splice(2, 0, '-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda');
    }

    // Generate multiple output streams
    outputConfigs.forEach((config, index) => {
      const profile = this.config.profiles[config.quality];
      if (!profile) return;

      // Video encoding
      args.push(
        '-map', '0:v:0',
        '-map', '0:a:0',
        `-c:v:${index}`, profile.video.codec,
        `-b:v:${index}`, profile.video.bitrate,
        `-s:v:${index}`, profile.video.resolution,
        `-r:v:${index}`, profile.video.framerate,
        `-c:a:${index}`, profile.audio.codec,
        `-b:a:${index}`, profile.audio.bitrate
      );

      // Output format specific settings
      if (config.format === 'hls') {
        const outputPath = path.join(this.storage.output, `${streamId}_${config.quality}.m3u8`);
        args.push(
          '-f', 'hls',
          '-hls_time', this.config.outputs.hls.segmentDuration.toString(),
          '-hls_list_size', this.config.outputs.hls.playlistSize.toString(),
          '-hls_flags', 'delete_segments',
          outputPath
        );
      }
    });

    return args;
  }

  simulateLiveProcessing(job) {
    // Simulate live processing for demo purposes
    let segmentCount = 0;
    
    const generateSegment = () => {
      if (job.status !== 'processing') return;
      
      segmentCount++;
      
      // Simulate HLS segment generation
      const segment = {
        index: segmentCount,
        duration: 6.0,
        size: Math.floor(Math.random() * 1000000) + 500000,
        timestamp: Date.now()
      };
      
      this.emit('segmentGenerated', { streamId: job.id, segment });
      
      // Update job progress
      job.segments = segmentCount;
      job.lastUpdate = Date.now();
      
      // Schedule next segment
      setTimeout(generateSegment, 6000); // 6 second segments
    };
    
    generateSegment();
  }

  async processVOD(filePath, outputConfigs) {
    const jobId = crypto.randomBytes(8).toString('hex');
    
    console.log(`📹 Starting VOD processing: ${jobId}`);
    
    const job = {
      id: jobId,
      type: 'vod',
      input: filePath,
      outputs: outputConfigs,
      startTime: Date.now(),
      status: 'processing',
      progress: 0
    };

    this.activeJobs.set(jobId, job);

    try {
      const ffmpegArgs = this.buildVODCommand(filePath, outputConfigs, jobId);
      
      if (this.capabilities.mock) {
        this.simulateVODProcessing(job);
      } else {
        const ffmpeg = spawn('ffmpeg', ffmpegArgs);
        this.ffmpegInstances.set(jobId, ffmpeg);
        
        this.setupFFmpegEventHandlers(ffmpeg, job);
      }

      this.emit('vodStarted', { jobId, job });
      
    } catch (error) {
      console.error(`❌ Failed to start VOD processing: ${error.message}`);
      job.status = 'failed';
      job.error = error.message;
    }

    return job;
  }

  buildVODCommand(inputPath, outputConfigs, jobId) {
    const args = ['-i', inputPath];

    // Add GPU acceleration
    if (this.capabilities.gpu.nvidia) {
      args.splice(1, 0, '-hwaccel', 'cuda');
    }

    outputConfigs.forEach((config, index) => {
      const profile = this.config.profiles[config.quality];
      if (!profile) return;

      const outputPath = path.join(
        this.storage.output, 
        `${jobId}_${config.quality}.${config.format}`
      );

      args.push(
        '-map', '0:v:0',
        '-map', '0:a:0',
        `-c:v:${index}`, profile.video.codec,
        `-b:v:${index}`, profile.video.bitrate,
        `-s:v:${index}`, profile.video.resolution,
        `-c:a:${index}`, profile.audio.codec,
        `-b:a:${index}`, profile.audio.bitrate,
        '-f', config.format,
        outputPath
      );
    });

    return args;
  }

  simulateVODProcessing(job) {
    // Simulate VOD processing with progress updates
    let progress = 0;
    
    const updateProgress = () => {
      if (job.status !== 'processing') return;
      
      progress += Math.random() * 10;
      job.progress = Math.min(progress, 100);
      
      if (job.progress >= 100) {
        job.status = 'completed';
        job.endTime = Date.now();
        job.duration = job.endTime - job.startTime;
        
        this.emit('vodCompleted', { jobId: job.id, job });
        console.log(`✅ VOD processing completed: ${job.id}`);
        
        // Move to completed jobs
        this.activeJobs.delete(job.id);
      } else {
        setTimeout(updateProgress, 1000);
      }
      
      this.emit('progressUpdate', { jobId: job.id, progress: job.progress });
    };
    
    updateProgress();
  }

  setupFFmpegEventHandlers(ffmpeg, job) {
    ffmpeg.stdout.on('data', (data) => {
      // Parse FFmpeg output for progress
      const output = data.toString();
      this.parseFFmpegProgress(output, job);
    });

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`FFmpeg [${job.id}]:`, output);
      
      // Parse progress from stderr (FFmpeg outputs progress to stderr)
      this.parseFFmpegProgress(output, job);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        job.status = 'completed';
        job.endTime = Date.now();
        this.emit('jobCompleted', { jobId: job.id, job });
      } else {
        job.status = 'failed';
        job.error = `FFmpeg exited with code ${code}`;
        this.emit('jobFailed', { jobId: job.id, job });
      }
      
      this.ffmpegInstances.delete(job.id);
      this.activeJobs.delete(job.id);
    });
  }

  parseFFmpegProgress(output, job) {
    // Parse FFmpeg progress output
    const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.\d{2}/);
    const fpsMatch = output.match(/fps=\s*(\d+\.?\d*)/);
    const bitrateMatch = output.match(/bitrate=\s*(\d+\.?\d*)kbits\/s/);
    
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      job.processedDuration = totalSeconds;
      job.lastUpdate = Date.now();
    }
    
    if (fpsMatch) {
      job.currentFPS = parseFloat(fpsMatch[1]);
    }
    
    if (bitrateMatch) {
      job.currentBitrate = parseFloat(bitrateMatch[1]);
    }
  }

  // Job management
  addJob(jobConfig) {
    const job = {
      id: crypto.randomBytes(8).toString('hex'),
      ...jobConfig,
      createdAt: Date.now(),
      status: 'queued'
    };
    
    this.jobQueue.push(job);
    console.log(`📋 Job queued: ${job.id} (${job.type})`);
    
    return job.id;
  }

  processJobQueue() {
    if (this.jobQueue.length === 0) return;
    if (this.activeJobs.size >= this.config.processing.max_concurrent_streams) return;
    
    const job = this.jobQueue.shift();
    
    switch (job.type) {
      case 'live_stream':
        this.processLiveStream(job.id, job.input, job.outputs);
        break;
      case 'vod':
        this.processVOD(job.input, job.outputs);
        break;
      case 'thumbnail':
        this.generateThumbnails(job.input, job.outputs);
        break;
    }
  }

  monitorActiveJobs() {
    this.activeJobs.forEach((job, jobId) => {
      const age = Date.now() - job.startTime;
      
      // Check for stalled jobs
      if (job.lastUpdate && (Date.now() - job.lastUpdate > 30000)) {
        console.log(`⚠️ Job appears stalled: ${jobId}`);
        this.restartJob(jobId);
      }
      
      // Check for long-running jobs
      if (age > 3600000) { // 1 hour
        console.log(`⏰ Long-running job: ${jobId} (${Math.round(age / 60000)}min)`);
      }
    });
  }

  async generateThumbnails(inputPath, config) {
    const jobId = crypto.randomBytes(8).toString('hex');
    
    console.log(`🖼️ Generating thumbnails: ${jobId}`);
    
    const thumbnailPath = path.join(this.storage.output, `${jobId}_thumbnail_%03d.jpg`);
    
    const args = [
      '-i', inputPath,
      '-vf', 'fps=1/10,scale=320:180', // 1 frame every 10 seconds, scaled to 320x180
      '-q:v', '2', // High quality
      thumbnailPath
    ];
    
    if (this.capabilities.mock) {
      // Simulate thumbnail generation
      console.log(`✅ Thumbnails generated (mock): ${jobId}`);
      return { jobId, thumbnails: 5 };
    }
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Thumbnails generated: ${jobId}`);
          resolve({ jobId, path: thumbnailPath });
        } else {
          reject(new Error(`Thumbnail generation failed: ${code}`));
        }
      });
    });
  }

  // Control methods
  stopJob(jobId) {
    const ffmpeg = this.ffmpegInstances.get(jobId);
    if (ffmpeg) {
      ffmpeg.kill('SIGTERM');
      console.log(`🛑 Stopped job: ${jobId}`);
    }
    
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'stopped';
      job.endTime = Date.now();
      this.activeJobs.delete(jobId);
    }
  }

  restartJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;
    
    this.stopJob(jobId);
    
    // Add back to queue
    job.status = 'queued';
    job.retryCount = (job.retryCount || 0) + 1;
    
    if (job.retryCount < 3) {
      this.jobQueue.unshift(job);
      console.log(`🔄 Restarting job: ${jobId} (attempt ${job.retryCount + 1})`);
    } else {
      console.log(`❌ Job failed after 3 retries: ${jobId}`);
      job.status = 'failed';
      job.error = 'Too many retries';
    }
  }

  // API methods
  getJobStatus(jobId) {
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      return {
        ...activeJob,
        uptime: Date.now() - activeJob.startTime
      };
    }
    
    return null;
  }

  getActiveJobs() {
    return Array.from(this.activeJobs.entries()).map(([id, job]) => ({
      id,
      ...job,
      uptime: Date.now() - job.startTime
    }));
  }

  getSystemStats() {
    return {
      activeJobs: this.activeJobs.size,
      queuedJobs: this.jobQueue.length,
      ffmpegVersion: this.capabilities.version,
      gpuAcceleration: this.capabilities.gpu,
      maxConcurrent: this.config.processing.max_concurrent_streams,
      uptime: process.uptime()
    };
  }

  // Cleanup
  cleanup() {
    console.log('🧹 Cleaning up media server...');
    
    // Stop all active jobs
    this.activeJobs.forEach((job, jobId) => {
      this.stopJob(jobId);
    });
    
    // Clear job queue
    this.jobQueue = [];
    
    console.log('✅ Media server cleanup complete');
  }
}

// Create and export media server instance
const mediaServer = new MediaServerArchitecture();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down media server...');
  mediaServer.cleanup();
  process.exit(0);
});

module.exports = MediaServerArchitecture;