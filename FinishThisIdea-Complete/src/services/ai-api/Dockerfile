# AI API Service Dockerfile
# Scalable LLM processing microservice

FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S aiapi && \
    adduser -S aiapi -u 1001

# Create logs directory
RUN mkdir -p /usr/src/app/logs && \
    chown -R aiapi:aiapi /usr/src/app

# Switch to non-root user
USER aiapi

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the service
CMD ["node", "dist/services/ai-api/server.js"]