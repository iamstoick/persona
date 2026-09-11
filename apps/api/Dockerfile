FROM node:26.3.1-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:26.3.1-alpine AS runner

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs

EXPOSE 4000
CMD ["node", "src/index.js"]
