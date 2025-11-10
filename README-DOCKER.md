# TaskFlow - Docker Containerization

This project is containerized using Docker with three separate containers:

1. **Frontend Container** - React/Vite application served via Nginx
2. **Backend Container** - Node.js/Express API server
3. **Database Container** - PostgreSQL database

## Prerequisites

- Docker and Docker Compose installed on your system
- Ports 3000, 4000, and 5432 available

## Quick Start

1. **Build and start all containers:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/api
   - Database: localhost:5432 (user: taskflow, password: taskflow123)

## Container Details

### Database Container
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Credentials:** 
  - User: taskflow
  - Password: taskflow123
  - Database: taskflow
- **Volume:** `postgres_data` (persistent storage)
- **Init Script:** Automatically runs `database/init.sql` on first startup

### Backend Container
- **Base Image:** node:20-alpine
- **Port:** 4000
- **Environment Variables:**
  - `DATABASE_URL`: PostgreSQL connection string
  - `PORT`: Server port (4000)
  - `ALLOWED_ORIGIN`: CORS origin
- **Health Check:** `/api/health` endpoint

### Frontend Container
- **Base Image:** nginx:alpine
- **Port:** 3000 (mapped to internal port 80)
- **Features:**
  - Serves built React application
  - Proxies `/api` requests to backend container
  - SPA routing support

## Docker Commands

### Start containers:
```bash
docker-compose up
```

### Start in detached mode:
```bash
docker-compose up -d
```

### Stop containers:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### View logs for specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Rebuild containers:
```bash
docker-compose up --build
```

### Stop and remove volumes (clean reset):
```bash
docker-compose down -v
```

## Development Workflow

### Make changes to code:

1. **Backend changes:**
   ```bash
   docker-compose restart backend
   # Or rebuild:
   docker-compose up --build backend
   ```

2. **Frontend changes:**
   ```bash
   docker-compose restart frontend
   # Or rebuild:
   docker-compose up --build frontend
   ```

### Access container shell:

```bash
# Backend
docker-compose exec backend sh

# Database
docker-compose exec database psql -U taskflow -d taskflow

# Frontend
docker-compose exec frontend sh
```

## Database Management

### Connect to database:
```bash
docker-compose exec database psql -U taskflow -d taskflow
```

### Backup database:
```bash
docker-compose exec database pg_dump -U taskflow taskflow > backup.sql
```

### Restore database:
```bash
docker-compose exec -T database psql -U taskflow taskflow < backup.sql
```

## Troubleshooting

### Containers won't start:
1. Check if ports are already in use:
   ```bash
   netstat -an | grep -E ':(3000|4000|5432)'
   ```

2. Check logs:
   ```bash
   docker-compose logs
   ```

### Database connection errors:
- Ensure database container is healthy before backend starts
- Check `DATABASE_URL` environment variable in backend container
- Verify database credentials match in `docker-compose.yml`

### Frontend can't reach backend:
- Check network connectivity: `docker network ls`
- Verify nginx proxy configuration in frontend Dockerfile
- Check backend health: `curl http://localhost:4000/api/health`

## Production Considerations

For production deployment:

1. **Environment Variables:** Use `.env` file or Docker secrets
2. **SSL/TLS:** Add reverse proxy (nginx/traefik) with SSL certificates
3. **Database Backups:** Set up automated backup strategy
4. **Resource Limits:** Add resource constraints in docker-compose.yml
5. **Monitoring:** Add health checks and logging aggregation

## Registry Push (for Capstone Project)

To push containers to a registry:

1. **Tag images:**
   ```bash
   docker tag taskflow-frontend your-registry/taskflow-frontend:latest
   docker tag taskflow-backend your-registry/taskflow-backend:latest
   ```

2. **Push to registry:**
   ```bash
   docker push your-registry/taskflow-frontend:latest
   docker push your-registry/taskflow-backend:latest
   ```

3. **Note:** Database uses official postgres image, no need to push

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Nginx:80)    │
│   Port: 3000    │
└────────┬────────┘
         │
         │ /api/* (proxy)
         │
┌────────▼────────┐
│   Backend        │
│   (Node:4000)    │
│   Port: 4000     │
└────────┬────────┘
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│   Database      │
│   (Postgres:5432)│
│   Port: 5432     │
└─────────────────┘
```

