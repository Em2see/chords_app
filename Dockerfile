FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development uses Debian (glibc) so Playwright's Chrome binary can run
FROM node:20-bookworm-slim AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npx playwright install-deps chromium webkit
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS builder
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
