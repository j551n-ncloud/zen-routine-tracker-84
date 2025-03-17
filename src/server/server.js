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
  } else {
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
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

// GET endpoint to retrieve data by key
app.get('/api/data/:key', authenticate, (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.userId;
    
    // Store user-specific data in their own directory
    const userDir = path.join(DATA_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    const filePath = path.join(userDir, `${key}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return res.json(JSON.parse(data));
    } else {
      return res.json(null);
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    return res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// POST endpoint to save data
app.post('/api/data/:key', authenticate, (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.userId;
    
    // Store user-specific data in their own directory
    const userDir = path.join(DATA_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    const filePath = path.join(userDir, `${key}.json`);
    
    // Add timestamp for last modification
    const dataToSave = {
      value,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Failed to save data' });
  }
});

// Add endpoint to get last modification timestamps for multiple keys
app.post('/api/data/sync/timestamps', authenticate, (req, res) => {
  try {
    const { keys } = req.body;
    const userId = req.user.userId;
    
    // Store user-specific data in their own directory
    const userDir = path.join(DATA_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
      return res.json({}); // No timestamps for new user
    }
    
    const timestamps = {};
    
    // Process each requested key
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        const filePath = path.join(userDir, `${key}.json`);
        
        if (fs.existsSync(filePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            timestamps[key] = data.lastUpdated || null;
          } catch (err) {
            console.error(`Error reading timestamp for ${key}:`, err);
            timestamps[key] = null;
          }
        } else {
          timestamps[key] = null;
        }
      });
    }
    
    return res.json(timestamps);
  } catch (error) {
    console.error('Error retrieving timestamps:', error);
    return res.status(500).json({ error: 'Failed to retrieve timestamps' });
  }
});

// Add endpoint to batch get data for multiple keys
app.post('/api/data/sync/batch', authenticate, (req, res) => {
  try {
    const { keys } = req.body;
    const userId = req.user.userId;
    
    const userDir = path.join(DATA_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
      return res.json({}); // No data for new user
    }
    
    const results = {};
    
    // Process each requested key
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        const filePath = path.join(userDir, `${key}.json`);
        
        if (fs.existsSync(filePath)) {
          try {
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            results[key] = fileData.value;
          } catch (err) {
            console.error(`Error reading data for ${key}:`, err);
            results[key] = null;
          }
        } else {
          results[key] = null;
        }
      });
    }
    
    return res.json(results);
  } catch (error) {
    console.error('Error retrieving batch data:', error);
    return res.status(500).json({ error: 'Failed to retrieve batch data' });
  }
});

// Specific endpoint for authentication
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Read users file
    const usersFilePath = path.join(DATA_DIR, 'users.json');
    
    if (!fs.existsSync(usersFilePath)) {
      // Create default admin user if users file doesn't exist
      const defaultUser = {
        username: 'admin',
        password: 'password123', // in production, this should be hashed
        userId: '9dada97d-4d28-4d25-a7fb-83f463f4dba1',
        role: 'admin'
      };
      
      fs.writeFileSync(usersFilePath, JSON.stringify([defaultUser], null, 2));
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    
    // Find user
    const user = usersData.find(u => 
      u.username === username && u.password === password
    );
    
    if (user) {
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        user: userWithoutPassword,
        token: `token_${user.userId}` // Simple token generation
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An error occurred during login' 
    });
  }
});

// Check if user is authenticated
app.get('/api/auth/user', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    // Very simple token validation - in production use JWT
    const userId = token.replace('token_', '');
    
    // Read users file
    const usersFilePath = path.join(DATA_DIR, 'users.json');
    
    if (!fs.existsSync(usersFilePath)) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = usersData.find(u => u.userId === userId);
    
    if (user) {
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        user: userWithoutPassword
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An error occurred during authentication check' 
    });
  }
});

// Add endpoint to register new users
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    const usersFilePath = path.join(DATA_DIR, 'users.json');
    let usersData = [];
    
    if (fs.existsSync(usersFilePath)) {
      usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
      
      // Check if username already exists
      if (usersData.find(u => u.username === username)) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }
    }
    
    // Generate a unique user ID
    const userId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Create new user
    const newUser = {
      userId,
      username,
      password, // In production, you should hash passwords
      email,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    // Save user
    usersData.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
    
    // Create user directory
    const userDir = path.join(DATA_DIR, userId);
    fs.mkdirSync(userDir, { recursive: true });
    
    // Don't return password to client
    const { password: _, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token: `token_${userId}`
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration'
    });
  }
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'zen-routine-tracker-api' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  
  // Create default admin user if not exists
  const usersFilePath = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFilePath)) {
    const defaultUser = {
      username: 'admin',
      password: 'password123', // In production, use hashed passwords
      userId: '9dada97d-4d28-4d25-a7fb-83f463f4dba1',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(usersFilePath, JSON.stringify([defaultUser], null, 2));
    console.log('Created default admin user');
  }
});