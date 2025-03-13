
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Database connection
const db = new sqlite3.Database('/db/zentracker.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API routes
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SQLite API is running' });
});

// Execute a query (SELECT operations)
app.post('/api/query', (req, res) => {
  const { query, params = [] } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  // Validate that this is a read-only query for security
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery.startsWith('select')) {
    return res.status(400).json({ error: 'Only SELECT queries are allowed on this endpoint' });
  }
  
  db.all(query, params, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ results });
  });
});

// Execute a write operation (INSERT, UPDATE, DELETE)
app.post('/api/execute', (req, res) => {
  const { query, params = [] } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  // Validate that this is not a dangerous operation
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.includes('drop table') || normalizedQuery.includes('drop database')) {
    return res.status(403).json({ error: 'Operation not permitted' });
  }
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Execution error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      changes: this.changes,
      lastID: this.lastID
    });
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SQLite API server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection');
  db.close();
  process.exit(0);
});
