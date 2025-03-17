import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3001;

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for storing JSON files
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Determine allowed origins for CORS
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, allow the specified CLIENT_URL or default to the same origin
    return process.env.CLIENT_URL ? [process.env.CLIENT_URL] : '*';
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
}; else {
    // In development, allow any localhost port
    return ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'];
  }
};

// Setup CORS with more permissive options
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Origin ${origin} not allowed by CORS policy`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Helper to log API requests
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

app.use(logRequest);

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  // In a real production environment, you would verify the JWT token properly
  // For now, we'll use a simple token validation
  const userId = token.replace('token_', '');
  
  // Read users file
  const usersFilePath = path.join(DATA_DIR, 'users.json');
  
  if (!fs.existsSync(usersFilePath)) {
    return res.status(401).json({ 
      success: false, 
      error: 'User database not found' 
    });
  }
  
  try {
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = usersData.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid authentication token' 
      });
    }
    
    // Add user info to request object
    req.user = {
      userId: user.userId,
      username: user.username,
      role: user.role
    };
    
    next();
  }
