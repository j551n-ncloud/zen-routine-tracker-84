
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

// Reserved routes that should not be treated as data keys
const RESERVED_ROUTES = ['health', 'api'];

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

// ------ Route handlers ------

// Special root handler for API
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// 1. Original path formats with /data/ prefix
app.get('/data/:key', handleDataGet);
app.post('/data/:key', handleDataPost);

// 2. API routes with /data/ prefix (for Cloudflare tunnels)
app.get('/api/data/:key', handleDataGet);
app.post('/api/data/:key', handleDataPost);

// 3. API routes without /data/ prefix (new format)
app.get('/api/:key', (req, res, next) => {
  // Skip reserved routes like '/api/health'
  if (RESERVED_ROUTES.includes(req.params.key)) {
    return next();
  }
  handleDataGet(req, res);
});

app.post('/api/:key', (req, res, next) => {
  // Skip reserved routes
  if (RESERVED_ROUTES.includes(req.params.key)) {
    return next();
  }
  handleDataPost(req, res);
});

// 4. Root level keys (/:key) - only for data keys, not for other routes
// This needs to be at the end of the routes so it doesn't catch everything
app.get('/:key', (req, res, next) => {
  // Skip reserved routes like '/health' and avoid catching everything
  if (RESERVED_ROUTES.includes(req.params.key)) {
    return next();
  }
  
  // Make sure this is actually a data key request, not some other route
  const key = req.params.key;
  
  // Check if it's a common ZenTracker key pattern
  const isZenTrackerKey = key.startsWith('zen-tracker-') || 
                          key.startsWith('calendar-') || 
                          key === 'habits' ||
                          key === 'tasks';
  
  if (isZenTrackerKey) {
    handleDataGet(req, res);
  } else {
    // If it doesn't look like a data key, pass to the next handler
    next();
  }
});

app.post('/:key', (req, res, next) => {
  // Skip reserved routes
  if (RESERVED_ROUTES.includes(req.params.key)) {
    return next();
  }
  
  // Make sure this is actually a data key request, not some other route
  const key = req.params.key;
  
  // Check if it's a common ZenTracker key pattern
  const isZenTrackerKey = key.startsWith('zen-tracker-') || 
                          key.startsWith('calendar-') || 
                          key === 'habits' ||
                          key === 'tasks';
  
  if (isZenTrackerKey) {
    handleDataPost(req, res);
  } else {
    // If it doesn't look like a data key, pass to the next handler
    next();
  }
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
