# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs && \
    chown -R nodejs:nodejs logs

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info

# Performance optimization environment variables
ENV PERFORMANCE_MONITORING_ENABLED=true
ENV METRICS_INTERVAL=1000
ENV ALERT_THRESHOLD_CPU=80
ENV ALERT_THRESHOLD_MEMORY=85

# Caching configuration
ENV CACHE_ENABLED=true
ENV CACHE_TTL=3600
ENV CACHE_MAX_SIZE=1000
ENV CACHE_STRATEGY=lru

# Load balancing configuration
ENV LOAD_BALANCING_ENABLED=true
ENV HEALTH_CHECK_INTERVAL=5000
ENV MAX_RETRIES=3

# Resource optimization configuration
ENV RESOURCE_OPTIMIZATION_ENABLED=true
ENV CPU_LIMIT=2000
ENV MEMORY_LIMIT=4096

# Redis configuration
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
