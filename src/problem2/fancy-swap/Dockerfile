# syntax=docker/dockerfile:1.7
# ------------------------------------------------------------
# Stage 1 — Build
# ------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first so this layer is cached across rebuilds
# whenever only source files change.
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the source and build.
COPY tsconfig*.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ------------------------------------------------------------
# Stage 2 — Runtime (nginx serving the static bundle)
# ------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# SPA-friendly nginx config: serve static files, fall back to index.html
# so client-side routes resolve without 404s.
RUN rm /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen       8080;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # Long-cache hashed assets, short-cache the entrypoint.
    location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Basic security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

COPY --from=builder /app/dist /usr/share/nginx/html

# Run as non-root for least-privilege. The base image already has a
# nginx user; we just need a writeable temp dir.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
 && touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

# Healthcheck against the index so `docker run` / orchestrators can
# detect readiness without an external endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
