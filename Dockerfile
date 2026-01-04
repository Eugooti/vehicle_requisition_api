# Use lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 8080

# Health check to ensure the service is running
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ebk || exit 1

# Start the application
CMD ["node", "server.js"]
