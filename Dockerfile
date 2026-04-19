# Teacher IDE — Browser Mode Docker Image
# Multi-stage build: compile TypeScript + bundle, then serve

FROM node:22-slim AS builder
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json lerna.json ./
COPY configs/ configs/
COPY dev-packages/ dev-packages/
COPY packages/ packages/
COPY examples/browser/ examples/browser/

# Install and build browser app
RUN npm install --ignore-scripts && \
    npm run build:browser

FROM node:22-slim AS runtime
WORKDIR /app

# Install Ollama for local AI
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://ollama.com/install.sh | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy built app from builder
COPY --from=builder /app/examples/browser/lib /app/lib
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/examples/browser/package.json /app/package.json

# Copy ASI system
COPY .local-asi/ /app/asi/

# Expose ports: Teacher IDE + Ollama
EXPOSE 3000 11434

# Start script
COPY <<'EOF' /app/start.sh
#!/bin/bash
# Start Ollama in background
ollama serve &
sleep 2
# Pull default model if not present
ollama pull qwen2.5:7b 2>/dev/null || true
# Start ASI bridge in background
python3 /app/asi/asi.py --serve &
# Start Teacher IDE
node /app/lib/backend/main.js --hostname 0.0.0.0 --port 3000
EOF
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
