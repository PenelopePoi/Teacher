# Teacher — self-hosted browser IDE
# Build: docker build -t teacher:latest .
# Run:   docker compose up -d   (preferred — starts Ollama sidecar too)
# See DEPLOY.md for VPS deployment, TLS, and auth guidance.

FROM node:22-bookworm AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libxkbfile-dev \
      libsecret-1-dev \
      python3 \
      git \
      ca-certificates \
      curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/teacher

COPY package.json package-lock.json lerna.json ./
COPY configs ./configs
COPY scripts ./scripts
COPY dev-packages ./dev-packages
COPY packages ./packages
COPY examples ./examples

RUN npm ci --no-audit --no-fund
RUN npm run build:browser

# --- runtime stage keeps native tooling because Theia plugins may need rebuild
FROM node:22-bookworm AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
      libxkbfile1 \
      libsecret-1-0 \
      python3 \
      git \
      ca-certificates \
      curl \
      tini \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash --uid 1001 teacher

COPY --from=build --chown=teacher:teacher /home/teacher /home/teacher

USER teacher
WORKDIR /home/teacher/examples/browser

EXPOSE 3000
VOLUME ["/home/teacher/workspace", "/home/teacher/.theia"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -fsS http://localhost:3000 || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "start", "--", "--hostname=0.0.0.0", "--port=3000", "/home/teacher/workspace"]
