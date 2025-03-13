
import { toast } from 'sonner';
import config from './api-config';

// Type definitions for different responses from the database
export interface KeyValueData {
  value_data: string;
}

export interface CountResult {
  count: number;
}

// State variables
let mockMode = true; // Default to mock mode since we're using local storage

// Detect if running in browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize mock storage
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

// Initialize the database
export async function initDatabase(): Promise<boolean> {
  // Always use local storage in browser environment
  if (isBrowser) {
    console.log('Browser environment detected, enabling local storage mode');
    
    // Check if user has already seen the explanation about data not syncing
    const hasSeenSyncMessage = localStorage.getItem('has-seen-sync-message');
    if (!hasSeenSyncMessage) {
      toast.info(
        config.storage.persistenceInfo.message,
        { duration: 8000 }
      );
      localStorage.setItem('has-seen-sync-message', 'true');
    }
    
    setMockMode(true);
    return true;
  }
  
  // In Node.js environment, we could use file system storage
  // but for simplicity we'll use mock mode too
  console.log('Using mock storage mode');
  setMockMode(true);
  return true;
}

// Mock implementation for storage operations
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

// Save data to local storage
const mockSaveData = async (key: string, value: any): Promise<void> => {
  console.log('Saving data:', { key });
  
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

// Retrieve data from local storage
const mockGetData = async (key: string): Promise<any> => {
  console.log('Getting data:', { key });
  
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

// Execute SQL queries (now just a wrapper for mock implementation)
export async function executeQuery<T>(
  sql: string, 
  params: any[] = []
): Promise<T> {
  return mockExecuteQuery<T>(sql, params);
}

// Store data in key-value format
export async function saveData(key: string, value: any): Promise<void> {
  return mockSaveData(key, value);
}

// Retrieve data from storage
export async function getData(key: string): Promise<any> {
  return mockGetData(key);
}
