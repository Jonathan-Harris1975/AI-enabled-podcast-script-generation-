# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built app from builder
COPY --from=builder /usr/src/app /usr/src/app

# Ensure storage dir exists at runtime
RUN mkdir -p storage

# Expose the app port
EXPOSE 3000

# Start the service using index.js
CMD ["node", "index.js"]
