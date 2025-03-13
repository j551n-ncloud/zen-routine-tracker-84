FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install git (needed for cloning) and other dependencies
RUN apk add --no-cache git

# Copy project files into the container
COPY . .

# Install dependencies
RUN npm install

# Expose the Vite development server port
# Vite uses 5173 by default instead of 3000
EXPOSE 8080

# Start the development server
# Adding host flag to make the server accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]