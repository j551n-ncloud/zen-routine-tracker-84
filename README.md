
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2168413d-0709-4542-8c9d-07fd99900810

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2168413d-0709-4542-8c9d-07fd99900810) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Run with Docker**

You can also run this project using Docker and Docker Compose:

```sh
# Build and start all services (Nginx, frontend, and backend)
docker-compose up

# Or run in detached mode
docker-compose up -d

# Stop the services
docker-compose down
```

The application will be available at http://localhost:89, with Nginx proxying requests to the frontend and backend services.

## Deploying with Cloudflare Tunnels

This application consists of two main components that need to be properly routed:
1. Frontend (React application)
2. Backend API (Express server)

### Required Port Configuration

When setting up Cloudflare Tunnels, you need to configure the following:

1. **Public Hostname for Frontend**:
   - Service: `http://localhost:89`
   - This routes to your frontend application

2. **Public Hostname for API**:
   - Service: `http://localhost:3001`
   - Path: `/api/*` or `/data/*`
   - This routes API requests to your backend

### Step-by-Step Cloudflare Tunnels Setup

1. **Install Cloudflared**:
   ```bash
   # On Ubuntu/Debian
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # On macOS with Homebrew
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Authenticate Cloudflared**:
   ```bash
   cloudflared tunnel login
   ```

3. **Create a Tunnel**:
   ```bash
   cloudflared tunnel create my-habit-app
   ```

4. **Configure Your Tunnel**:
   Create a config file at `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <YOUR_TUNNEL_ID>
   credentials-file: /path/to/credentials-file.json
   
   ingress:
     # Route API requests to the backend
     - hostname: api.yourdomain.com
       service: http://localhost:3001
     
     # Route frontend requests
     - hostname: yourdomain.com
       service: http://localhost:89
     
     # Catch-all rule for handling other subdomains
     - service: http_status:404
   ```

5. **Start the Tunnel**:
   ```bash
   cloudflared tunnel run
   ```

6. **DNS Configuration**:
   ```bash
   cloudflared tunnel route dns <TUNNEL_NAME> yourdomain.com
   cloudflared tunnel route dns <TUNNEL_NAME> api.yourdomain.com
   ```

### Alternative Configuration (Single Domain)

If you prefer to use a single domain, you can use path-based routing:

```yaml
ingress:
  # Route API requests to the backend
  - hostname: yourdomain.com
    path: /api/*
    service: http://localhost:3001
  
  # Route frontend requests
  - hostname: yourdomain.com
    service: http://localhost:89
  
  # Catch-all
  - service: http_status:404
```

### Important Notes for Cloudflare Tunnels

1. **Path Handling**: The backend server has been configured to handle various path formats, including those with and without leading slashes.

2. **CORS Configuration**: The server is configured to allow requests from any origin for development purposes. For production, consider limiting this to your domain.

3. **Logging**: The server outputs detailed logs that can help with debugging any routing issues.

4. **Data Directory**: The application stores data in a `/data` directory. When deploying, ensure this directory is persisted and has proper permissions.

5. **SSL/TLS**: Cloudflare Tunnels automatically handle SSL/TLS, so you don't need to configure certificates on your server.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
