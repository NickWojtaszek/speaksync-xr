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

# Copy built assets and necessary config files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/index.html ./index.html

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Start the preview server
# vite.config.ts already configures host and port from env vars
CMD ["npm", "run", "preview"]
