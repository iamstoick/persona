FROM node:26.3.1-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Next.js inlines NEXT_PUBLIC_* vars into the client bundle at build time, not runtime —
# these must be passed as build args (see docker-compose.prod.yml) rather than just set
# in the container's runtime environment, or the browser bundle falls back to defaults.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

FROM node:26.3.1-alpine AS runner

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

USER nodejs

EXPOSE 8899
ENV NODE_ENV=production
ENV PORT=8899
CMD ["node", "server.js"]
