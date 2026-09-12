FROM node:26.3.1-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Next.js inlines NEXT_PUBLIC_* vars into the client bundle at build time, not runtime —
# these must be passed as build args (see docker-compose.prod.yml) rather than just set
# in the container's runtime environment, or the browser bundle falls back to defaults.
#
# API_INTERNAL_URL isn't a NEXT_PUBLIC_ var, but it must ALSO be a build arg: next.config.ts's
# rewrites() (used for server-side API/uploads proxying) is evaluated once when `next build`
# generates the routes manifest, not fresh per server boot — so if this were only set on the
# running container, the rewrite destination would silently fall back to NEXT_PUBLIC_API_URL
# at build time and proxy straight to the public prod domain instead of the internal api
# container (this exact bug sent /api/* traffic to the live public site on first deploy).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG API_INTERNAL_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL

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
