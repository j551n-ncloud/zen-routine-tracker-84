
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
# Build and start all services (frontend and backend)
docker-compose up

# Or run in detached mode
docker-compose up -d

# Stop the services
docker-compose down
```

The application will be available at http://localhost:89, with the backend API available at http://localhost:3001.

## Deploying with Cloudflare Tunnels

This application consists of two main components that need to be properly routed:
1. Frontend (React application)
2. Backend API (Express server)

### Required Path Configuration for habits.j551n.com

For your specific setup with habits.j551n.com and habits.j551n.com/api, you'll need to configure a Cloudflare Tunnel with the following routes:

1. **Frontend (main domain)**:
   - Service: `http://localhost:89`
   - This routes all traffic on habits.j551n.com to your frontend application

2. **API (subfolder path)**:
   - Service: `http://localhost:3001`
   - Path: `/api/*`
   - This routes API requests on habits.j551n.com/api/* to your backend

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
   cloudflared tunnel create habits-app
   ```

4. **Configure Your Tunnel for habits.j551n.com**:
   Create a config file at `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <YOUR_TUNNEL_ID>
   credentials-file: /path/to/credentials-file.json
   
   ingress:
     # Route API requests to the backend
     - hostname: habits.j551n.com
       path: /api/*
       service: http://localhost:3001
     
     # Route all other traffic to the frontend
     - hostname: habits.j551n.com
       service: http://localhost:89
     
     # Catch-all rule
     - service: http_status:404
   ```

5. **Start the Tunnel**:
   ```bash
   cloudflared tunnel run habits-app
   ```

6. **DNS Configuration**:
   ```bash
   cloudflared tunnel route dns habits-app habits.j551n.com
   ```

### Important Notes for Your Setup

1. **Path Handling**: The frontend should make API requests using the `/api` path prefix (e.g., `https://habits.j551n.com/api/data/key`).

2. **CORS Configuration**: Since both your frontend and API are on the same domain (just different paths), CORS issues should be minimal.

3. **Checking Configuration**: You can verify your setup is working by:
   - Accessing habits.j551n.com (should show your frontend)
   - Accessing habits.j551n.com/api/health (should return `{"status":"ok"}`)

4. **Debugging**: If you encounter issues:
   - Check server logs for any routing problems
   - Ensure the ports (89 for frontend, 3001 for backend) match your Docker configuration
   - Verify that Cloudflare Tunnel is running and connected

5. **Data Persistence**: The application stores data in a `/data` directory. Ensure this directory is persisted between deployments.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
