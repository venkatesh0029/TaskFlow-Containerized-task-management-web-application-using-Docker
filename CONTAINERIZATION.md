# Podman Containerization Guide for TaskFlow

This guide explains how to containerize the TaskFlow application using Podman after exporting the code from Lovable.

## Architecture Overview

TaskFlow consists of:
- **Frontend**: React + Vite + TypeScript (this repository)
- **Backend**: Lovable Cloud (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL (via Lovable Cloud)

## Prerequisites

- Podman installed on your system
- Node.js 18+ and npm
- This project cloned locally

## Step 1: Create Dockerfile for Frontend

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## Step 2: Create Nginx Configuration

Create `nginx.conf` in the project root:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Step 3: Create .dockerignore

Create `.dockerignore` to exclude unnecessary files:

```
node_modules
dist
.git
.env
*.log
.DS_Store
```

## Step 4: Build with Podman

```bash
# Build the image
podman build -t taskflow-frontend:latest .

# Verify the image
podman images | grep taskflow
```

## Step 5: Run the Container

```bash
# Run the container
podman run -d \
  --name taskflow \
  -p 8080:80 \
  taskflow-frontend:latest

# Check if it's running
podman ps

# View logs
podman logs taskflow
```

## Step 6: Access the Application

Open your browser and navigate to: `http://localhost:8080`

## Environment Variables

If you need to configure environment variables, create a `.env.production` file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Then rebuild the image:

```bash
podman build --build-arg ENV_FILE=.env.production -t taskflow-frontend:latest .
```

## Podman Compose (Multi-Container Setup)

For a complete setup with PostgreSQL, create `podman-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "8080:80"
    depends_on:
      - db
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=taskflow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Run with:

```bash
podman-compose up -d
```

## Production Considerations

### 1. Security
- Use secrets management for environment variables
- Enable HTTPS with SSL certificates
- Implement rate limiting

### 2. Performance
- Enable gzip compression in nginx
- Configure proper caching headers
- Use CDN for static assets

### 3. Monitoring
```bash
# Monitor container stats
podman stats taskflow

# Check resource usage
podman inspect taskflow
```

### 4. Backup
```bash
# Export container
podman export taskflow > taskflow-backup.tar

# Save image
podman save taskflow-frontend:latest > taskflow-image.tar
```

## Troubleshooting

### Container won't start
```bash
# Check logs
podman logs taskflow

# Inspect container
podman inspect taskflow
```

### Port already in use
```bash
# Use different port
podman run -d --name taskflow -p 9090:80 taskflow-frontend:latest
```

### Build fails
```bash
# Clean build
podman build --no-cache -t taskflow-frontend:latest .
```

## Stopping and Removing

```bash
# Stop container
podman stop taskflow

# Remove container
podman rm taskflow

# Remove image
podman rmi taskflow-frontend:latest
```

## Note About Backend

The backend (Lovable Cloud) is already hosted and managed. If you need a self-hosted backend:

1. Export your Supabase project
2. Set up self-hosted Supabase or PostgreSQL
3. Update environment variables
4. Migrate database schema (found in `supabase/migrations`)

For full self-hosted setup, you would need to:
- Run PostgreSQL container
- Set up PostgREST for API
- Configure authentication system
- Deploy edge functions separately

This is beyond the scope of this guide but possible with Podman's networking capabilities.
