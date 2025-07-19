import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics.service';

export interface CompressionOptions {
  level?: number; // Compression level (1-9)
  threshold?: number; // Minimum response size to compress
  filter?: (req: Request, res: Response) => boolean;
  chunkSize?: number;
  windowBits?: number;
  memLevel?: number;
}

// Smart compression middleware that adapts based on content type and size
export function smartCompression(options: CompressionOptions = {}) {
  const config = {
    level: options.level || 6, // Balanced compression level
    threshold: options.threshold || 1024, // 1KB minimum
    chunkSize: options.chunkSize || 16384, // 16KB chunks
    windowBits: options.windowBits || 15,
    memLevel: options.memLevel || 8,
    filter: options.filter || defaultFilter
  };

  return compression({
    level: config.level,
    threshold: config.threshold,
    chunkSize: config.chunkSize,
    windowBits: config.windowBits,
    memLevel: config.memLevel,
    filter: (req: Request, res: Response) => {
      // Track compression attempts
      const shouldCompress = config.filter(req, res);
      
      if (shouldCompress) {
        prometheusMetrics.compressionAttempts.inc({ type: 'attempted' });
      } else {
        prometheusMetrics.compressionAttempts.inc({ type: 'skipped' });
      }
      
      return shouldCompress;
    }
  });
}

// Default filter function with smart content detection
function defaultFilter(req: Request, res: Response): boolean {
  const contentType = res.getHeader('content-type') as string;
  
  if (!contentType) {
    return false;
  }

  // Don't compress already compressed content
  const alreadyCompressed = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/',
    'audio/',
    'application/zip',
    'application/gzip',
    'application/x-rar',
    'application/pdf'
  ];

  for (const type of alreadyCompressed) {
    if (contentType.includes(type)) {
      return false;
    }
  }

  // Compress text-based content
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/rss+xml',
    'application/atom+xml',
    'image/svg+xml'
  ];

  return compressibleTypes.some(type => contentType.includes(type));
}

// Conditional compression based on client capabilities
export function adaptiveCompression() {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const userAgent = req.headers['user-agent'] || '';
    
    // Determine optimal compression based on client
    let compressionLevel = 6; // Default
    
    // Use higher compression for slower connections (mobile)
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      compressionLevel = 8;
    }
    
    // Use lower compression for modern browsers that handle it well
    if (userAgent.includes('Chrome') || userAgent.includes('Firefox')) {
      compressionLevel = 4;
    }

    // Apply compression with adaptive settings
    const compressionMiddleware = smartCompression({
      level: compressionLevel,
      filter: (req: Request, res: Response) => {
        // Skip compression for small API responses
        const contentLength = res.getHeader('content-length');
        if (contentLength && parseInt(contentLength as string) < 500) {
          return false;
        }
        
        return defaultFilter(req, res);
      }
    });

    compressionMiddleware(req, res, next);
  };
}

// Compression middleware with performance monitoring
export function monitoredCompression(options: CompressionOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    let originalSize = 0;
    let compressedSize = 0;

    // Override res.write to measure sizes
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function(chunk: any, encoding?: any, callback?: any) {
      if (chunk) {
        originalSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      }
      return originalWrite.call(this, chunk, encoding, callback);
    };

    res.end = function(chunk?: any, encoding?: any, callback?: any) {
      if (chunk) {
        originalSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      }

      const duration = Date.now() - startTime;
      const contentEncoding = res.getHeader('content-encoding');
      const wasCompressed = !!contentEncoding && contentEncoding.toString().includes('gzip');
      
      if (wasCompressed) {
        const compressionRatio = originalSize > 0 ? (1 - (compressedSize / originalSize)) * 100 : 0;
        
        prometheusMetrics.compressionRatio.observe(compressionRatio);
        prometheusMetrics.compressionSavings.inc(originalSize - compressedSize);
        
        logger.debug('Response compressed', {
          path: req.path,
          originalSize,
          compressionRatio: `${compressionRatio.toFixed(1)}%`,
          duration: `${duration}ms`
        });
      }

      return originalEnd.call(this, chunk, encoding, callback);
    };

    // Apply compression
    const compressionMiddleware = smartCompression(options);
    compressionMiddleware(req, res, next);
  };
}

// Brotli compression for modern browsers
export function brotliCompression() {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('br')) {
      // Modern browsers support Brotli
      res.set('Content-Encoding', 'br');
      // Note: You would need to implement actual Brotli compression here
      // or use a library like 'iltorb' or Node.js built-in zlib.createBrotliCompress()
    }
    
    next();
  };
}

// Response size optimization
export function responseSizeOptimizer() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(obj: any) {
      // Remove null/undefined values to reduce payload size
      const optimized = removeEmptyValues(obj);
      
      // For arrays, implement pagination hints
      if (Array.isArray(optimized) && optimized.length > 100) {
        logger.warn('Large array response', {
          path: req.path,
          size: optimized.length,
          recommendation: 'Consider implementing pagination'
        });
      }
      
      return originalJson.call(this, optimized);
    };
    
    next();
  };
}

function removeEmptyValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        result[key] = removeEmptyValues(value);
      }
    }
    
    return result;
  }
  
  return obj;
}

// Content-Type specific compression
export function contentTypeCompression() {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path.toLowerCase();
    
    // Apply different compression strategies based on content type
    if (path.endsWith('.json') || path.includes('/api/')) {
      // High compression for JSON APIs
      smartCompression({ level: 8, threshold: 256 })(req, res, next);
    } else if (path.endsWith('.js') || path.endsWith('.css')) {
      // Medium compression for static assets
      smartCompression({ level: 6, threshold: 1024 })(req, res, next);
    } else if (path.endsWith('.html')) {
      // Light compression for HTML
      smartCompression({ level: 4, threshold: 512 })(req, res, next);
    } else {
      // Default compression
      smartCompression()(req, res, next);
    }
  };
}

// Export configured compression middleware
export const defaultCompression = smartCompression({
  level: 6,
  threshold: 1024,
  filter: defaultFilter
});

export const apiCompression = smartCompression({
  level: 8,
  threshold: 256,
  filter: (req: Request, res: Response) => {
    const contentType = res.getHeader('content-type') as string;
    return contentType && contentType.includes('application/json');
  }
});

export const staticCompression = smartCompression({
  level: 9,
  threshold: 2048,
  filter: (req: Request, res: Response) => {
    const contentType = res.getHeader('content-type') as string;
    return contentType && (
      contentType.includes('text/') ||
      contentType.includes('application/javascript') ||
      contentType.includes('text/css')
    );
  }
});