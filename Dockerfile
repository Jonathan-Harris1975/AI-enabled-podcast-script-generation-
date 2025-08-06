# Stage 1: Build and install dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/utils ./utils
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/app.js ./app.js

EXPOSE 3000
CMD ["node", "app.js"]
