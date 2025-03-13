
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 8080

# Start the application with proper error logging and network binding
CMD ["sh", "-c", "NODE_ENV=production npm run preview -- --host --port 8080"]
