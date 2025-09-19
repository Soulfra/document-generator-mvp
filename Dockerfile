# Document Generator - Production Dockerfile
# Multi-stage build for optimized container size

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S docgen -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs backups && \
    chown -R docgen:nodejs /app

# Create health check script
RUN echo $'#!/bin/sh\n\
curl -f http://localhost:${PORT:-3000}/health || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Switch to non-root user
USER docgen

# Expose port (configurable via environment)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Default command
CMD ["node", "cli.js"]

# Build metadata
LABEL version="1.0.0"
LABEL description="Document Generator MVP - Transform documents into working MVPs"
LABEL maintainer="Document Generator Team"
LABEL org.opencontainers.image.source="https://github.com/document-generator/mvp"