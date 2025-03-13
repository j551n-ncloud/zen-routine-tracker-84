
import { toast } from 'sonner';
import axios from 'axios';
import config from './api-config';

// Type definitions for different responses from the database
export interface KeyValueData {
  value_data: string;
}

export interface CountResult {
  count: number;
}

// State variables
let mockMode = false;

// SQLite REST API configuration
const SQLITE_REST_BASE_URL = config.sqliteRest.url;
const SQLITE_DATABASE = config.sqliteRest.database;

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

// SQLite REST query execution
async function sqliteRestQuery<T>(sql: string, params: any[] = []): Promise<T> {
  try {
    console.log('Executing SQLite REST query:', { sql, params, url: SQLITE_REST_BASE_URL });
    const response = await axios.post(`${SQLITE_REST_BASE_URL}/exec`, {
      sql,
      params,
      db: SQLITE_DATABASE
    });
    
    console.log('SQLite REST response:', response.data);
    
    // SQLite REST returns results in a specific format
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0].rows as T;
    }
    
    return [] as unknown as T;
  } catch (error) {
    console.error('SQLite REST API error:', error);
    throw error;
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

// Initialize the database - check if SQLite REST API is available
export async function initDatabase(): Promise<boolean> {
  // Check for localStorage setting first
  if (isBrowser) {
    const storedMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    if (storedMockMode) {
      console.log('Mock mode enabled from localStorage settings');
      setMockMode(true);
      return true;
    }
  }
  
  // Don't automatically use mock mode in browser anymore
  // Only use mock mode if explicitly set
  if (mockMode) {
    console.log('Mock mode is enabled, skipping database connection');
    return true;
  }
  
  try {
    console.log('Attempting to connect to SQLite REST API at:', SQLITE_REST_BASE_URL);
    // Test the SQLite REST API connection with a simple query
    await sqliteRestQuery('SELECT 1');
    console.log('Successfully connected to SQLite REST API');
    
    // Create necessary tables if they don't exist
    await setupDatabase();
    
    return true;
  } catch (error) {
    console.error('Failed to connect to SQLite REST API:', error);
    toast.error('Failed to connect to database. Switching to mock mode.');
    setMockMode(true);
    return false;
  }
}

// Setup the database with necessary tables
async function setupDatabase(): Promise<void> {
  try {
    // Create key_value_store table
    await sqliteRestQuery(`
      CREATE TABLE IF NOT EXISTS key_value_store (
        key_name TEXT PRIMARY KEY,
        value_data TEXT
      )
    `);
    
    // Create users table
    await sqliteRestQuery(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0
      )
    `);
    
    // Create default admin user if it doesn't exist
    const users = await sqliteRestQuery<any[]>('SELECT username FROM users WHERE username = ?', ['admin']);
    if (!users || users.length === 0) {
      await sqliteRestQuery(
        'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
        ['admin', 'admin', 1]
      );
    }
    
    // Create other necessary tables (habits, tasks, etc.)
    await sqliteRestQuery(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        streak INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        category TEXT,
        icon TEXT
      )
    `);
    
    await sqliteRestQuery(`
      CREATE TABLE IF NOT EXISTS daily_habits (
        date TEXT,
        habit_id INTEGER,
        completed INTEGER DEFAULT 0,
        PRIMARY KEY (date, habit_id),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      )
    `);
    
    await sqliteRestQuery(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority TEXT,
        completed INTEGER DEFAULT 0,
        start_date TEXT,
        due_date TEXT NOT NULL
      )
    `);
    
    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
}

// Execute SQL queries safely
export async function executeQuery<T>(
  sql: string, 
  params: any[] = []
): Promise<T> {
  // In mock mode, use mock implementation
  if (mockMode) {
    return mockExecuteQuery<T>(sql, params);
  }
  
  try {
    return await sqliteRestQuery<T>(sql, params);
  } catch (error) {
    console.error('Query execution error:', error);
    
    // If error occurs, fall back to mock mode for this query
    console.warn('Falling back to mock mode for this query due to error');
    return mockExecuteQuery<T>(sql, params);
  }
}

// Store data in key-value format (using a key_value_store table in SQLite)
export async function saveData(key: string, value: any): Promise<void> {
  // In mock mode, use mock implementation
  if (mockMode) {
    return mockSaveData(key, value);
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    
    // First check if the table exists, if not create it
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS key_value_store (
        key_name TEXT PRIMARY KEY,
        value_data TEXT
      )
    `);
    
    // Then insert or update the key-value pair
    const sql = `
      INSERT OR REPLACE INTO key_value_store (key_name, value_data) 
      VALUES (?, ?)
    `;
    
    await executeQuery(sql, [key, serializedValue]);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    // Fall back to mock implementation on error
    return mockSaveData(key, value);
  }
}

// Retrieve data from key-value store
export async function getData(key: string): Promise<any> {
  // In mock mode, use mock implementation
  if (mockMode) {
    return mockGetData(key);
  }
  
  try {
    // First check if the table exists, if not create it
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS key_value_store (
        key_name TEXT PRIMARY KEY,
        value_data TEXT
      )
    `);
    
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
