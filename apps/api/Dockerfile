FROM node:26.3.1-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

FROM node:26.3.1-alpine AS runner
# The runtime never runs npm. Removing it drops its bundled tar/minimatch/glob copies,
# where most of the image's HIGH/CRITICAL CVEs live; apk upgrade picks up openssl fixes.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs

EXPOSE 4000
CMD ["node", "src/index.js"]
