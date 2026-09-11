# Package Versions

Resolved at scaffold time: 2026-06-19.

## Runtime

| Tool | Specified | Local |
|---|---|---|
| Node.js | 26.3.1 | 25.8.1 (host); 26.3.1-alpine in Docker |
| npm | 11.17.0 | 11.17.0 |

> **Note:** Host Node.js is 25.8.1. Docker images use `node:26.3.1-alpine` as specified.
> Run `nvm install 26.3.1` or use Docker for exact parity.

## Infrastructure (Docker images)

| Service | Image |
|---|---|
| PostgreSQL | postgres:18.3 |
| Redis | redis:8.8.0-alpine |
| Nginx | nginx:alpine |

## apps/api

| Package | Version |
|---|---|
| express | 5.2.1 |
| pg | 8.22.0 |
| ioredis | ^5.0.0 (latest 5.x) |
| passport | ^0.7.0 |
| passport-google-oauth20 | ^2.0.0 |
| jsonwebtoken | ^9.0.0 |
| nodemailer | ^6.0.0 |
| multer | ^1.4.5-lts.2 |
| helmet | ^8.0.0 |
| cors | ^2.8.5 |
| morgan | ^1.10.0 |
| dotenv | ^16.0.0 |
| nodemon (dev) | ^3.0.0 |

## apps/web

| Package | Version |
|---|---|
| next | 16.2.9 |
| react | ^19.0.0 |
| react-dom | ^19.0.0 |
| tailwindcss | 4.3.1 |
| recharts | 3.8.1 |
| gsap | ^3.12.0 |
| @tiptap/react | ^2.11.0 |
| @tiptap/starter-kit | ^2.11.0 |
| @tiptap/extension-image | ^2.11.0 |
| @tiptap/extension-link | ^2.11.0 |
| @tiptap/extension-placeholder | ^2.11.0 |
| @tiptap/html | ^2.11.0 |
| typescript | ^5.8.0 |

## packages/db

| Package | Version |
|---|---|
| pg | 8.22.0 |
| dotenv | ^16.0.0 |

## Root (dev)

| Package | Version |
|---|---|
| eslint | ^9.0.0 |
| prettier | ^3.0.0 |
| typescript | ^5.8.0 |
| husky | ^9.0.0 |
| lint-staged | ^15.0.0 |

## External / client-side (no npm package)

| Tool | Notes |
|---|---|
| Giscus | Client-side script embed. Configure via `NEXT_PUBLIC_GISCUS_*` env vars |
| Google Fonts | Loaded via `next/font/google` (Space Grotesk, Inter, JetBrains Mono) |
