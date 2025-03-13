
FROM node:18-alpine

# Install dependencies for SQLite
RUN apk add --no-cache python3 make g++ wget

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

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Make sure the WASM file exists in the build directory
RUN ls -la ./dist || true
RUN cp -v public/sql-wasm.wasm dist/ 2>/dev/null || echo "sql-wasm.wasm not copied to dist/"

# Set proper WASM MIME type for caddy server
RUN echo 'application/wasm wasm' > /app/dist/mime.types

# Expose the port
EXPOSE 8080

# Start the application with proper error logging and network binding
CMD ["sh", "-c", "cd dist && NODE_ENV=production npx serve -s . -l 8080"]
