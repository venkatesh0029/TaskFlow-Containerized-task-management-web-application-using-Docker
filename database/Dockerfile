# Database Dockerfile
# Extends the official PostgreSQL image with custom configuration

FROM postgres:15-alpine

# Set environment variables (can be overridden in docker-compose.yml)
ENV POSTGRES_USER=taskflow
ENV POSTGRES_PASSWORD=taskflow123
ENV POSTGRES_DB=taskflow

# Copy initialization scripts
# Note: These are also mounted as volumes in docker-compose.yml
# The docker-entrypoint-initdb.d directory runs scripts in alphabetical order
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY schema.sql /docker-entrypoint-initdb.d/02-schema.sql
COPY seed.sql /docker-entrypoint-initdb.d/03-seed.sql

# Set proper permissions
RUN chmod 644 /docker-entrypoint-initdb.d/*.sql

# Expose PostgreSQL port
EXPOSE 5432

# The official postgres image automatically runs scripts in
# /docker-entrypoint-initdb.d/ when the database is first initialized
# No need to override CMD or ENTRYPOINT unless custom behavior is needed

