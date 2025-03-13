
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for storing JSON files
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any origin for development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Path normalization middleware - this helps with Cloudflare Tunnels path handling
app.use((req, res, next) => {
  // Normalize path by removing double slashes and ensuring a leading slash
  req.url = ('/' + req.url.replace(/\/+/g, '/')).replace(/\/+$/, '');
  if (req.url === '') req.url = '/';
  
  console.log(`Normalized URL: ${req.url}`);
  next();
});

// Support multiple path formats for data access
const handleDataGet = (req, res) => {
  try {
    const { key } = req.params;
    const filePath = path.join(DATA_DIR, `${key}.json`);
    
    console.log(`GET data for key: ${key}, checking file: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      console.log(`Data found for key: ${key}`);
      return res.json(JSON.parse(data));
    } else {
      console.log(`No data found for key: ${key}`);
      return res.json(null);
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    return res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
  }
};

const handleDataPost = (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      console.error('No data provided in request body');
      return res.status(400).json({ error: 'No data provided' });
    }
    
    const filePath = path.join(DATA_DIR, `${key}.json`);
    
    console.log(`POST data for key: ${key}`);
    
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    console.log(`Data saved for key: ${key}`);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
};

// Handle all possible path formats

// 1. /data/:key (original path format)
app.get('/data/:key', handleDataGet);
app.post('/data/:key', handleDataPost);

// 2. /api/data/:key (through Cloudflare tunnels - original)
app.get('/api/data/:key', handleDataGet);
app.post('/api/data/:key', handleDataPost);

// 3. Direct key access without /data/ prefix (new format matching client code)
app.get('/:key', handleDataGet);
app.post('/:key', handleDataPost);

// 4. /api/:key (through Cloudflare tunnels - new format)
app.get('/api/:key', handleDataGet);
app.post('/api/:key', handleDataPost);

// 5. Handle root requests of /api to support Cloudflare tunnel configuration
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Add explicit handling for OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Fallback for all other routes with useful error message
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not found',
    message: 'Valid endpoints are /:key, /data/:key, /api/:key, /api/data/:key',
    method: req.method,
    url: req.originalUrl,
    normalizedUrl: req.url
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
