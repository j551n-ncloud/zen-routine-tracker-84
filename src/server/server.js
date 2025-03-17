
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

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

// GET endpoint to retrieve data by key
app.get('/api/data/:key', (req, res) => {
  try {
    const { key } = req.params;
    const filePath = path.join(DATA_DIR, `${key}.json`);
    
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
app.post('/api/data/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const filePath = path.join(DATA_DIR, `${key}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Failed to save data' });
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

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'zen-routine-tracker-api' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
