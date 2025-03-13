
import { toast } from 'sonner';

// Type definitions for different responses from the database
export interface KeyValueData {
  value_data: string;
}

export interface CountResult {
  count: number;
}

// State variables
let mockMode = false;

// Detect if running in browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize mock storage if in browser
const mockStorage = new Map<string, any>();

// Check if environment is mock mode
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

// Mock implementation for browser environment
const mockExecuteQuery = async <T>(
  sql: string, 
  params: any[] = []
): Promise<T> => {
  console.log('Mock executeQuery:', { sql, params });
  
  // Handle login query in mock mode
  if (sql.includes('SELECT username, is_admin FROM users WHERE')) {
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
};

// Mock implementation for browser environment
const mockSaveData = async (key: string, value: any): Promise<void> => {
  console.log('Mock saveData:', { key, value });
  
  if (value === null || value === undefined) {
    // Remove from mock storage
    mockStorage.delete(key);
    
    // Also clean up from localStorage if available
    if (isBrowser) {
      localStorage.removeItem(key);
    }
  } else {
    // Store in mock storage
    mockStorage.set(key, value);
    
    // Also store in localStorage if available
    if (isBrowser) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
};

// Mock implementation for browser environment
const mockGetData = async (key: string): Promise<any> => {
  console.log('Mock getData:', { key });
  
  // First check our in-memory mock storage
  if (mockStorage.has(key)) {
    return mockStorage.get(key);
  }
  
  // Then check localStorage if available
  if (isBrowser) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Cache it in our mock storage
        mockStorage.set(key, parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing data from localStorage:', error);
      }
    }
  }
  
  return null;
};

// Create actual MariaDB pool only in non-browser environments
let pool: any = null;

// Only import mysql2 if we're not in the browser
if (!isBrowser) {
  try {
    // Dynamic import to avoid bundling mysql2 in the browser
    const importDynamic = new Function('modulePath', 'return import(modulePath)');
    
    importDynamic('mysql2/promise').then((mysql2) => {
      const { createPool } = mysql2;
      
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
      
      pool = createPool(dbConfig);
      console.log('MariaDB pool created successfully');
    }).catch(err => {
      console.error('Failed to import mysql2/promise:', err);
      setMockMode(true);
    });
  } catch (error) {
    console.error('Error loading mysql2:', error);
    setMockMode(true);
  }
} else {
  console.log('Browser environment detected, using mock database implementation');
  setMockMode(true);
}

// Initialize the database - connect to MariaDB if in Node.js, use mock mode if in browser
export async function initDatabase(): Promise<boolean> {
  // If we're in a browser, we always use mock mode
  if (isBrowser) {
    console.log('Browser environment detected, using mock mode');
    setMockMode(true);
    return true;
  }
  
  // If mock mode is explicitly set, don't try to connect to the database
  if (mockMode) {
    console.log('Mock mode is enabled, skipping database connection');
    return true;
  }
  
  try {
    // Test the database connection if we have a pool
    if (pool) {
      const connection = await pool.getConnection();
      console.log('Successfully connected to MariaDB database');
      connection.release();
      return true;
    }
    
    console.error('Database pool not initialized');
    setMockMode(true);
    return false;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    setMockMode(true);
    throw error;
  }
}

// Execute SQL queries safely
export async function executeQuery<T>(
  sql: string, 
  params: any[] = []
): Promise<T> {
  // In mock mode, use mock implementation
  if (mockMode || isBrowser) {
    return mockExecuteQuery<T>(sql, params);
  }
  
  // Not in mock mode, use actual database
  if (!pool) {
    console.error('Database not initialized. Falling back to mock mode.');
    setMockMode(true);
    return mockExecuteQuery<T>(sql, params);
  }
  
  let connection: any = null;
  
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
  // In mock mode, use mock implementation
  if (mockMode || isBrowser) {
    return mockSaveData(key, value);
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    const sql = `
      INSERT INTO key_value_store (key_name, value_data) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE value_data = ?
    `;
    
    await executeQuery(sql, [key, serializedValue, serializedValue]);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    // Fall back to mock implementation on error
    return mockSaveData(key, value);
  }
}

// Retrieve data from key-value store
export async function getData(key: string): Promise<any> {
  // In mock mode, use mock implementation
  if (mockMode || isBrowser) {
    return mockGetData(key);
  }
  
  try {
    const sql = `SELECT value_data FROM key_value_store WHERE key_name = ?`;
    const results = await executeQuery<KeyValueData[]>(sql, [key]);
    
    if (results && results.length > 0) {
      return JSON.parse(results[0].value_data);
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    // Fall back to mock implementation on error
    return mockGetData(key);
  }
}
