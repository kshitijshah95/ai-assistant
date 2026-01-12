# Deployment Guide

This guide explains how to deploy the AI Assistant application to production.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│    (Vercel)     │     │   (Railway)     │     │   + pgvector    │
└─────────────────┘     └─────────────────┘     │   (Railway)     │
                                                └─────────────────┘
```

## Option 1: Railway + Vercel (Recommended)

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select this repository

3. **Add PostgreSQL with pgvector**:
   - In your project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - After creation, go to the PostgreSQL service settings
   - In "Deploy" tab, add this to the start command to enable pgvector:
     ```
     docker-entrypoint.sh postgres -c 'shared_preload_libraries=vector'
     ```

4. **Configure Backend Service**:
   - Click on the backend service
   - Go to "Settings" → "Root Directory" → Set to `backend`
   - Go to "Variables" and add:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     OPENAI_API_KEY=sk-your-key-here
     ANTHROPIC_API_KEY=sk-ant-your-key-here (optional)
     DEFAULT_LLM_PROVIDER=openai
     NODE_ENV=production
     CORS_ORIGIN=https://your-frontend-domain.vercel.app
     ```

5. **Deploy**: Railway will automatically deploy when you push to GitHub

6. **Get Backend URL**: After deployment, go to "Settings" → "Domains" → Generate a domain
   - Example: `https://your-app.up.railway.app`

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select this repository

3. **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   ```

5. **Deploy**: Click "Deploy"

6. **Update Backend CORS**: Go back to Railway and update `CORS_ORIGIN` to your Vercel domain

---

## Option 2: Fly.io (All-in-One)

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### Step 2: Create fly.toml in backend/
```toml
app = "ai-assistant-api"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

### Step 3: Create Postgres with pgvector
```bash
fly postgres create --name ai-assistant-db
fly postgres attach ai-assistant-db
```

### Step 4: Set Secrets
```bash
fly secrets set OPENAI_API_KEY=sk-your-key
fly secrets set ANTHROPIC_API_KEY=sk-ant-your-key
fly secrets set DEFAULT_LLM_PROVIDER=openai
fly secrets set CORS_ORIGIN=https://your-frontend.vercel.app
```

### Step 5: Deploy
```bash
cd backend
fly deploy
```

---

## Option 3: Self-Hosted (VPS/Docker)

### docker-compose.production.yml
```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DEFAULT_LLM_PROVIDER: ${DEFAULT_LLM_PROVIDER}
      CORS_ORIGIN: ${CORS_ORIGIN}
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Frontend Dockerfile (frontend/Dockerfile)
```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Environment Variables Reference

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key |
| `DEFAULT_LLM_PROVIDER` | No | `openai` or `anthropic` (default: openai) |
| `CORS_ORIGIN` | Yes | Frontend URL(s), comma-separated |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `production` or `development` |

*At least one LLM API key is required

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

---

## Post-Deployment Checklist

- [ ] Backend health check: `curl https://your-api.com/api/health`
- [ ] Frontend loads without errors
- [ ] WebSocket connection works (chat sends/receives)
- [ ] Database operations work (create a note via chat)
- [ ] Both LLM providers work (try switching in the UI)

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in backend matches your frontend URL exactly
- Include protocol (`https://`)

### WebSocket Connection Failed
- Ensure your hosting supports WebSocket connections
- Railway and Fly.io support WebSockets by default

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure pgvector extension is enabled
- Run `npx prisma db push` to sync schema

### Build Failures
- Check Node.js version (requires 18+)
- Ensure all dependencies are in `package.json`
