import { createPool, Pool, PoolConnection, ResultSetHeader, RowDataPacket, OkPacket } from 'mysql2/promise';
import { toast } from 'sonner';

// Type definitions for different responses from the database
export interface KeyValueData extends RowDataPacket {
  value_data: string;
}

export interface CountResult extends RowDataPacket {
  count: number;
}

// Database connection configuration
const dbConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: Number(import.meta.env.VITE_DB_PORT) || 3306,
  user: import.meta.env.VITE_DB_USER || 'zentracker',
  password: import.meta.env.VITE_DB_PASSWORD || 'password',
  database: import.meta.env.VITE_DB_NAME || 'zentracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// State variables
let pool: Pool | null = null;
let mockMode = false;

// Detect if running in browser environment
const isBrowser = typeof window !== 'undefined';

// Check if environment is browser
export function isMockMode(): boolean {
  return mockMode;
}

// Set mock mode explicitly
export function setMockMode(value: boolean): void {
  console.log(`Setting mock mode to: ${value}`);
  mockMode = value;
  
  // Save the setting to localStorage if in browser
  if (isBrowser) {
    localStorage.setItem('zentracker-mock-mode', value.toString());
  }
}

// Initialize the database - connect to MariaDB if in Node.js, use localStorage if in browser
export async function initDatabase(): Promise<boolean> {
  try {
    // If we're in a browser, we can't use MySQL directly
    if (isBrowser) {
      console.log('Browser environment detected, switching to mock mode');
      setMockMode(true);
      return true;
    }
    
    // Otherwise, try to connect to MariaDB
    console.log('Connecting to MariaDB database...');
    
    // Create the connection pool if it doesn't exist
    if (!pool) {
      pool = createPool(dbConfig);
      
      // Test the connection
      const connection = await pool.getConnection();
      console.log('Successfully connected to MariaDB database');
      connection.release();
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Execute SQL queries safely
export async function executeQuery<T extends RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader>(
  sql: string, 
  params: any[] = []
): Promise<T> {
  // In mock mode, we handle special cases for authentication and other operations
  if (mockMode) {
    if (sql.includes('SELECT username, is_admin FROM users WHERE')) {
      // Handle login query in mock mode
      const username = params[0];
      const isAdmin = username.toLowerCase() === 'admin';
      
      // Mock user authentication
      const mockResult = [{
        username: username,
        is_admin: isAdmin ? 1 : 0
      }] as unknown as T;
      
      return mockResult;
    }
    
    // For other queries, return empty result
    return [] as unknown as T;
  }
  
  // Not in mock mode, use actual database
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first');
  }
  
  let connection: PoolConnection | null = null;
  
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Store data in key-value format
export async function saveData(key: string, value: any): Promise<void> {
  try {
    if (mockMode) {
      // In mock mode, use localStorage
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return;
    }
    
    const serializedValue = JSON.stringify(value);
    const sql = `
      INSERT INTO key_value_store (key_name, value_data) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE value_data = ?
    `;
    
    await executeQuery(sql, [key, serializedValue, serializedValue]);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    throw error;
  }
}

// Retrieve data from key-value store
export async function getData(key: string): Promise<any> {
  try {
    if (mockMode) {
      // In mock mode, use localStorage
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    
    const sql = `SELECT value_data FROM key_value_store WHERE key_name = ?`;
    const results = await executeQuery<KeyValueData[]>(sql, [key]);
    
    if (results && results.length > 0) {
      return JSON.parse(results[0].value_data);
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    throw error;
  }
}
