FROM node:23-slim AS base

ENV PORT=7331
ENV NODE_ENV=production

FROM base AS builder

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build

FROM base

RUN apt-get update && apt-get install -y \
    ca-certificates \
    ghostscript \
    graphicsmagick \
    openssl \
    libwebp-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /app/upload /app/data

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.ts ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 7331

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]