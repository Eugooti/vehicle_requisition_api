# Use Node.js LTS with Alpine for smaller image
FROM node:20-alpine

# ARG for timezone during build
ARG TZ=UTC

# Install required packages including tzdata for timezone support
RUN apk add --no-cache \
    curl \
    tzdata \
    && cp /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo "${TZ}" > /etc/timezone \
    && apk del tzdata

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    TZ=${TZ}

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodegroup && \
    adduser -S nodeuser -u 1001 -G nodegroup

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application code
COPY --chown=nodeuser:nodegroup . .

# Create necessary directories
RUN mkdir -p logs && chown nodeuser:nodegroup logs

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js || exit 1

# Expose port
EXPOSE ${PORT}

# Start the application
CMD ["node", "server.js"]