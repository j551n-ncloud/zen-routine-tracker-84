
import mysql from 'mysql2/promise';
import config from './api-config';
import { toast } from 'sonner';

// Create a connection pool
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize the database
export async function initDatabase() {
  try {
    // Test the connection
    const connection = await pool.getConnection();
    console.log('Successfully connected to MariaDB');
    
    // Create necessary tables if they don't exist
    await initializeTables(connection);
    
    // Release the connection back to the pool
    connection.release();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Helper to initialize tables
async function initializeTables(connection) {
  try {
    // Create users table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create key_value store table for app data
    await connection.query(`
      CREATE TABLE IF NOT EXISTS key_value_store (
        key_name VARCHAR(255) PRIMARY KEY,
        value_data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default admin user if no users exist
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      await connection.query(
        'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
        ['admin', 'admin', true]
      );
      console.log('Created default admin user');
    }
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
}

// Execute a query with parameters
export async function executeQuery(sql, params = []) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Get data from the key_value_store
export async function getData(key) {
  try {
    const [rows] = await pool.query(
      'SELECT value_data FROM key_value_store WHERE key_name = ?',
      [key]
    );
    
    if (rows && Array.isArray(rows) && rows.length > 0 && rows[0].value_data) {
      return JSON.parse(rows[0].value_data);
    }
    return null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    
    // Check if mock mode is enabled
    const isMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    if (isMockMode) {
      // In mock mode, try to get from localStorage
      const data = localStorage.getItem(`zentracker-${key}`);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
    }
    
    throw error;
  }
}

// Save data to the key_value_store
export async function saveData(key, value) {
  try {
    // Always store as JSON
    const jsonValue = JSON.stringify(value);
    
    // Use REPLACE to handle both insert and update
    await pool.query(
      'REPLACE INTO key_value_store (key_name, value_data) VALUES (?, ?)',
      [key, jsonValue]
    );
    
    return true;
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    
    // Check if mock mode is enabled
    const isMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    if (isMockMode) {
      // In mock mode, fallback to localStorage
      try {
        localStorage.setItem(`zentracker-${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('LocalStorage fallback failed:', e);
      }
    }
    
    throw error;
  }
}

// Delete data from the key_value_store
export async function deleteData(key) {
  try {
    await pool.query('DELETE FROM key_value_store WHERE key_name = ?', [key]);
    return true;
  } catch (error) {
    console.error(`Error deleting data for key ${key}:`, error);
    
    // Check if mock mode is enabled
    const isMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    if (isMockMode) {
      // In mock mode, remove from localStorage
      localStorage.removeItem(`zentracker-${key}`);
      return true;
    }
    
    throw error;
  }
}

// Clean up database connections
export async function closeDatabase() {
  try {
    await pool.end();
    console.log('Database connections closed');
    return true;
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}
