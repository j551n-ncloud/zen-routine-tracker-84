
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

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
