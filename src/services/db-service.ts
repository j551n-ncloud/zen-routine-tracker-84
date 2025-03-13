
import { toast } from 'sonner';
import axios from 'axios';

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
const SQLITE_REST_BASE_URL = import.meta.env.VITE_SQLITE_REST_URL || 'http://localhost:8080';

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
    const response = await axios.post(`${SQLITE_REST_BASE_URL}/exec`, {
      sql,
      params
    });
    
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
    // Test the SQLite REST API connection with a simple query
    await sqliteRestQuery('SELECT 1');
    console.log('Successfully connected to SQLite REST API');
    return true;
  } catch (error) {
    console.error('Failed to connect to SQLite REST API:', error);
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
  if (mockMode || isBrowser) {
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
  if (mockMode || isBrowser) {
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
