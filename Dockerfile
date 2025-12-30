# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (vite is needed for preview server)
RUN npm ci

# Copy built assets and server files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Copy debug startup script
COPY debug-start.sh ./debug-start.sh
RUN chmod +x ./debug-start.sh

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Use debug startup script
CMD ["./debug-start.sh"]
