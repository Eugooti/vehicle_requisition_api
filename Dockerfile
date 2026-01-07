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

# Start the application
CMD ["node", "server.js"]
