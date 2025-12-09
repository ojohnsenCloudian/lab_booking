# Use ARM64 compatible base image for Raspberry Pi 5
# Using Debian-based image for better Prisma/OpenSSL compatibility
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install libssl1.1 from Debian 11 (bullseye) for Prisma compatibility
RUN echo "deb http://deb.debian.org/debian bullseye main" >> /etc/apt/sources.list.d/bullseye.list && \
    apt-get update && apt-get install -y \
    libc6 \
    openssl \
    ca-certificates \
    libssl1.1 \
    --allow-unauthenticated \
    && rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/bullseye.list
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
# Install libssl1.1 from Debian 11 (bullseye) for Prisma compatibility
RUN echo "deb http://deb.debian.org/debian bullseye main" >> /etc/apt/sources.list.d/bullseye.list && \
    apt-get update && apt-get install -y \
    libssl1.1 \
    --allow-unauthenticated \
    && rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/bullseye.list
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install OpenSSL and Prisma dependencies
# Install libssl1.1 from Debian 11 (bullseye) for Prisma compatibility
RUN echo "deb http://deb.debian.org/debian bullseye main" >> /etc/apt/sources.list.d/bullseye.list && \
    apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    libssl1.1 \
    --allow-unauthenticated \
    && rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/bullseye.list

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy node_modules to get prisma CLI (installed as dev dependency)
COPY --from=builder /app/node_modules ./node_modules

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy package.json for prisma commands
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
