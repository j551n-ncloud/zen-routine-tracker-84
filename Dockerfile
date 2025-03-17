
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files into the container
COPY . .

# Build the application
RUN npm run build

# Expose the frontend port
EXPOSE 8080

# Start the development server with host flag to make it accessible
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
