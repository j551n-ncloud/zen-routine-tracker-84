
FROM node:18-alpine

# Install dependencies for MySQL and nginx
RUN apk add --no-cache python3 make g++ wget nginx mysql-client

# Create app directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Setup nginx config
RUN mkdir -p /etc/nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Create start script and ensure it exists with proper formatting
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'cd /app/dist && NODE_ENV=production npx serve -s . -l 8080' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    cat /app/start.sh && \
    ls -la /app/start.sh

# Expose the port
EXPOSE 8080

# Start nginx and the application
CMD ["/bin/sh", "/app/start.sh"]
