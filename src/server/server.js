
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

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any origin for development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET endpoint to retrieve data by key
app.get('/data/:key', (req, res) => {
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
app.post('/data/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const filePath = path.join(DATA_DIR, `${key}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    console.log(`Data saved for key: ${key}`);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Failed to save data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
