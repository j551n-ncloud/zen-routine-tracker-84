
FROM node:18-alpine

# Install dependencies for MySQL and nginx
RUN apk add --no-cache python3 make g++ wget nginx

# Create app directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Download sql-wasm.wasm file
RUN mkdir -p public && \
    wget -O public/sql-wasm.wasm https://raw.githubusercontent.com/sql-js/sql.js/master/dist/sql-wasm.wasm || \
    wget -O public/sql-wasm.wasm https://sql.js.org/dist/sql-wasm.wasm || \
    wget -O public/sql-wasm.wasm https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm || \
    echo "Warning: Could not download sql-wasm.wasm"

# Setup nginx config
RUN mkdir -p /etc/nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Make sure the WASM file exists in the build directory
RUN ls -la ./dist || true
RUN cp -v public/sql-wasm.wasm dist/ 2>/dev/null || echo "sql-wasm.wasm not copied to dist/"

# Set proper WASM MIME type for nginx
RUN echo 'application/wasm wasm' > /app/dist/mime.types

# Create start script
RUN echo '#!/bin/sh\nnginx -g "daemon off;" &\ncd dist && NODE_ENV=production npx serve -s . -l 8080' > /app/start.sh
RUN chmod +x /app/start.sh

# Expose the port
EXPOSE 8080

# Start nginx and the application
CMD ["/app/start.sh"]
