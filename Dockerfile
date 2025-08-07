# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy only the necessary parts
COPY --from=builder /usr/src/app /usr/src/app

# Ensure the storage directory exists
RUN mkdir -p storage

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
