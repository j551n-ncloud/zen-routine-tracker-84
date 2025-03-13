
import mysql, { Pool, QueryResult, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import config from './api-config';
import { toast } from 'sonner';

// Define a global variable to hold the connection pool
let pool: Pool | null = null;

// Initialize mock mode (disabled by default)
let mockMode = false;

// Console log the environment for debugging
console.log(`Running in ${typeof window !== 'undefined' ? 'browser' : 'server'} environment, mock mode: ${mockMode}`);

// Create a connection pool if not in mock mode
function getPool() {
  if (mockMode) {
    console.log('Using mock database mode');
    return null;
  }
  
  if (!pool) {
    console.log('Creating new database connection pool');
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  
  return pool;
}

// Initialize the database
export async function initDatabase() {
  try {
    // If we're in mock mode, just pretend everything is fine
    if (mockMode) {
      console.log('Mock database mode activated - skipping real database initialization');
      return true;
    }
    
    // Test the connection
    const pool = getPool();
    if (!pool) {
      throw new Error('Failed to create database pool');
    }
    
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

// Set mock mode explicitly
export function setMockMode(enabled: boolean) {
  mockMode = enabled;
  localStorage.setItem('zentracker-mock-mode', enabled ? 'true' : 'false');
  console.log(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  return mockMode;
}

// Check if mock mode is enabled
export function isMockMode() {
  return mockMode;
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

// Interface for key-value data
interface KeyValueRow extends RowDataPacket {
  value_data: string;
}

// Execute a query with parameters
export async function executeQuery<T extends RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
  try {
    if (mockMode) {
      console.log('Mock executeQuery:', sql, params);
      return [] as unknown as T;
    }
    
    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    
    const [results] = await pool.query<T>(sql, params);
    return results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Get data from the key_value_store
export async function getData(key: string) {
  try {
    // Check if mock mode is enabled
    if (mockMode) {
      console.log(`[Mock] Getting data for key: ${key}`);
      // In mock mode, try to get from localStorage
      const data = localStorage.getItem(`zentracker-${key}`);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return null;
    }
    
    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    
    const [rows] = await pool.query<KeyValueRow[]>(
      'SELECT value_data FROM key_value_store WHERE key_name = ?',
      [key]
    );
    
    if (rows && Array.isArray(rows) && rows.length > 0 && rows[0]?.value_data) {
      return JSON.parse(rows[0].value_data as string);
    }
    return null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    throw error;
  }
}

// Save data to the key_value_store
export async function saveData(key: string, value: any) {
  try {
    // For mock mode, use localStorage
    if (mockMode) {
      console.log(`[Mock] Saving data for key: ${key}`);
      localStorage.setItem(`zentracker-${key}`, JSON.stringify(value));
      return true;
    }
    
    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    
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
    throw error;
  }
}

// Delete data from the key_value_store
export async function deleteData(key: string) {
  try {
    // For mock mode, use localStorage
    if (mockMode) {
      console.log(`[Mock] Deleting data for key: ${key}`);
      localStorage.removeItem(`zentracker-${key}`);
      return true;
    }
    
    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    
    await pool.query('DELETE FROM key_value_store WHERE key_name = ?', [key]);
    return true;
  } catch (error) {
    console.error(`Error deleting data for key ${key}:`, error);
    throw error;
  }
}

// Clean up database connections
export async function closeDatabase() {
  try {
    if (mockMode || !pool) {
      console.log('No active database connections to close');
      return true;
    }
    
    await pool.end();
    console.log('Database connections closed');
    pool = null;
    return true;
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}
