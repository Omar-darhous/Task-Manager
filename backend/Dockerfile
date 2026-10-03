# Stage 1: Build TypeScript backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and configuration
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies needed for tsc)
RUN npm ci

# Copy backend source code
COPY src ./src

# Compile TypeScript to dist/
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

# Set default production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Use non-root node user provided by the base image
USER node

# Expose backend API port
EXPOSE 5000

# Run compiled production server
CMD ["node", "dist/server.js"]
