
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'mariadb',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'zentracker',
  password: process.env.DB_PASSWORD || 'zentracker',
  database: process.env.DB_NAME || 'zentracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MariaDB connection successful');
    connection.release();
  } catch (err) {
    console.error('Error connecting to MariaDB:', err);
  }
})();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API routes
app.get('/api/status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.status(200).json({ status: 'ok', message: 'MariaDB API is running' });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Execute a query (SELECT operations)
app.post('/api/query', async (req, res) => {
  const { query, params = [] } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  // Validate that this is a read-only query for security
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery.startsWith('select')) {
    return res.status(400).json({ error: 'Only SELECT queries are allowed on this endpoint' });
  }
  
  try {
    const [results] = await pool.query(query, params);
    res.json({ results });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a write operation (INSERT, UPDATE, DELETE)
app.post('/api/execute', async (req, res) => {
  const { query, params = [] } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  // Validate that this is not a dangerous operation
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.includes('drop table') || normalizedQuery.includes('drop database')) {
    return res.status(403).json({ error: 'Operation not permitted' });
  }
  
  try {
    const [result] = await pool.query(query, params);
    res.json({ 
      changes: result.affectedRows,
      lastID: result.insertId
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MariaDB API server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database pool');
  pool.end();
  process.exit(0);
});
