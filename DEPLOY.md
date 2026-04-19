# Deploying Teacher

Teacher is a full-stack IDE platform. It does **not** run on Vercel or any serverless platform — it needs a persistent Node backend, writable filesystem, WebSocket connections, and child-process spawning for the plugin host.

Three supported deployment paths.

---

## 1. Docker (self-hosted browser Teacher)

Recommended for teams and individuals who want a shared in-browser IDE.

### Build and run locally

```bash
docker build -t teacher:latest .
docker compose up -d
# http://localhost:3000
```

`docker-compose.yml` starts two services:
- **teacher** — the IDE backend on port 3000
- **ollama** — local AI models, shared volume, port 11434

First-time model pull (after the stack is up):

```bash
docker compose exec ollama ollama pull qwen2.5:7b
```

### Deploying to a VPS

Any provider that runs containers works — [Fly.io](https://fly.io), [Railway](https://railway.app), [Render](https://render.com), DigitalOcean, Hetzner, AWS EC2, Oracle Free Tier, self-hosted Proxmox.

**Fly.io example:**

```bash
flyctl launch --dockerfile Dockerfile --name teacher --region mia
flyctl volumes create teacher_workspace --size 10 --region mia
flyctl deploy
flyctl scale vm shared-cpu-2x --memory 4096
```

**Resource minimums**
- 2 vCPU, 4 GB RAM for the Teacher backend alone
- +8 GB RAM and ~5 GB disk if Ollama is on the same host running `qwen2.5:7b`
- Persistent volume for `/workspace` (user files) and `/root/.theia` (config)

### TLS and auth

Put Teacher behind a reverse proxy (Caddy, Traefik, nginx) with HTTPS and your own auth layer. Teacher has no built-in authentication — **do not expose it directly to the public internet.**

Minimal Caddy example:

```
teacher.yourdomain.com {
    reverse_proxy teacher:3000
    basicauth {
        alex {$TEACHER_BCRYPT_HASH}
    }
}
```

---

## 2. Electron Desktop (signed binaries)

For distribution as a downloadable desktop app — the closest analogue to VS Code's install experience.

Teacher doesn't ship its own Electron packager; instead, fork [Theia Blueprint](https://github.com/eclipse-theia/theia-blueprint) and swap the Theia dependency for Teacher.

### Step-by-step

```bash
# 1. Fork Theia Blueprint on GitHub
gh repo fork eclipse-theia/theia-blueprint --clone --org PenelopePoi
cd theia-blueprint

# 2. Replace upstream Theia deps with Teacher
#    In applications/electron/package.json, point @theia/* dependencies at
#    your published Teacher fork, or use `npm link` for local dev.

# 3. Rebrand
#    - applications/electron/package.json: name, productName, description, author
#    - applications/electron/resources/icons/* : replace with logo/teacher-* exports
#    - applications/electron/resources/license.txt
#    - electron-builder config (appId com.xelastudio.teacher, publisherName "XELA Creative Studio")

# 4. Build
npm install
npm run build
npm run package  # produces DMG / MSI / AppImage
```

### Code signing (required for macOS + Windows distribution)

- **macOS** — Apple Developer Program ($99/yr), Developer ID Application certificate, notarize via `notarytool`
- **Windows** — EV or Standard Code Signing certificate from DigiCert, Sectigo, etc.
- **Linux** — AppImage unsigned is fine; Snap/Flatpak optional

Electron Builder config (in `applications/electron/electron-builder.yml` of the Blueprint fork) handles signing and notarization. Set these env vars in your CI:

```
APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID
CSC_LINK, CSC_KEY_PASSWORD   # Windows signing cert (base64)
```

### Auto-update

Use `electron-updater` with GitHub Releases as the provider. Config in `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: PenelopePoi
  repo: theia-blueprint
```

Each tagged release on the Blueprint fork auto-pushes updates to installed clients.

---

## 3. Marketing site (Vercel)

The marketing / landing site is a separate repository, deployable to Vercel.

**Repo:** [github.com/PenelopePoi/teacher-site](https://github.com/PenelopePoi/teacher-site)

**Deploy:**

```bash
cd teacher-site
vercel link
vercel --prod
```

It's a Next.js App Router site. Pure Jamstack — no runtime dependency on Teacher itself. Production URL is configured to `teacher.xela.studio`.

To update the marketing site: edit content in `app/page.tsx`, commit, push → Vercel auto-deploys via Git integration.

---

## What about Vercel for the IDE itself?

**No.** Vercel is a serverless platform optimized for Next.js and edge functions. Its constraints make it structurally incompatible with Teacher:

| Vercel limit | Teacher needs |
|---|---|
| 10s–60s function timeout | 24/7 persistent backend |
| Ephemeral `/tmp` only | Writable workspace filesystem |
| No long-lived WebSockets | WebSocket RPC per connection |
| 50 MB function size | 100+ MB bundle |
| No `spawn()` with lifetime | Per-frontend plugin host subprocess |

If someone tells you they've "deployed Theia on Vercel" they've deployed a non-functional stub. Use Docker.

---

## Quick reference

| Goal | Path | Time to live |
|---|---|---|
| Personal use | `npm run start:electron` | 15 min |
| Team-shared IDE | Docker on Fly.io | 1 hour |
| Public desktop app | Electron Blueprint fork + signing certs | 1–2 days first time, 10 min per release |
| Marketing site | Vercel via teacher-site repo | 10 min |
