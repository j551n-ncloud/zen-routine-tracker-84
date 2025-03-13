
import { toast } from "sonner";
import axios from "axios";
import apiConfig from "./api-config";

// Initialize flag
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Performance timer
let initStartTime = 0;

// Function to initialize the database connection
export const initDatabase = async (): Promise<void> => {
  if (isInitialized) {
    return Promise.resolve();
  }
  
  if (isInitializing) {
    // If already initializing, return the existing promise
    return initPromise!;
  }
  
  isInitializing = true;
  initStartTime = performance.now();
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Initializing MariaDB database connection');
      
      // Test connection to MariaDB API
      const response = await axios.get(apiConfig.endpoints.status);
      
      if (response.status === 200) {
        isInitialized = true;
        isInitializing = false;
        
        const initTime = Math.round(performance.now() - initStartTime);
        console.log(`Database connection initialized successfully in ${initTime}ms`);
        
        resolve();
      } else {
        throw new Error(`Failed to connect to MariaDB API: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      isInitializing = false;
      reject(error);
      
      toast.error("Failed to connect to database. Some features may not work properly.");
    }
  });
  
  return initPromise;
};

// Create a query cache
const queryCache = new Map<string, any[]>();

// Function to execute a query and return the results
export const executeQuery = async <T>(
  query: string, 
  params: any[] = [],
  useCache = false
): Promise<T[]> => {
  await ensureDatabaseInitialized();
  
  try {
    // Create a unique cache key if using cache
    const cacheKey = useCache ? `${query}_${JSON.stringify(params)}` : '';
    
    // Check cache for read operations
    if (useCache && query.trim().toLowerCase().startsWith('select')) {
      if (queryCache.has(cacheKey)) {
        return queryCache.get(cacheKey) as T[];
      }
    }
    
    const startTime = performance.now();
    
    // Send query to MariaDB API
    const response = await axios.post(apiConfig.endpoints.query, {
      query,
      params
    });
    
    const results = response.data.results as T[];
    
    // Add to cache for read operations
    if (useCache && query.trim().toLowerCase().startsWith('select')) {
      queryCache.set(cacheKey, results);
    }
    
    const queryTime = Math.round(performance.now() - startTime);
    if (queryTime > 200) {
      console.warn(`Slow query (${queryTime}ms): ${query}`);
    }
    
    return results;
  } catch (error) {
    console.error("Query execution error:", error, "Query:", query, "Params:", params);
    throw error;
  }
};

// Function to execute a write operation (INSERT, UPDATE, DELETE)
export const executeWrite = async (
  query: string, 
  params: any[] = []
): Promise<void> => {
  await ensureDatabaseInitialized();
  
  try {
    const startTime = performance.now();
    
    // Send write operation to MariaDB API
    await axios.post(apiConfig.endpoints.execute, {
      query,
      params
    });
    
    // Clear cache on write operations as data may have changed
    queryCache.clear();
    
    const writeTime = Math.round(performance.now() - startTime);
    if (writeTime > 200) {
      console.warn(`Slow write operation (${writeTime}ms): ${query}`);
    }
  } catch (error) {
    console.error("Write operation error:", error, "Query:", query, "Params:", params);
    throw error;
  }
};

// Function to ensure the database is initialized before use
const ensureDatabaseInitialized = async (): Promise<void> => {
  if (!isInitialized) {
    await initDatabase();
  }
};

// Function to get data from key-value store with caching
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const results = await executeQuery<{ value: string }>(
      "SELECT value FROM key_value_store WHERE `key` = ?",
      [key],
      true // use cache
    );
    
    if (results.length > 0) {
      return JSON.parse(results[0].value) as T;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting data for key '${key}':`, error);
    return null;
  }
};

// Function to save data to key-value store
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const valueJson = JSON.stringify(value);
    
    // Check if key exists
    const exists = await executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM key_value_store WHERE `key` = ?",
      [key]
    );
    
    if (exists.length > 0 && exists[0].count > 0) {
      // Update existing record
      await executeWrite(
        "UPDATE key_value_store SET value = ? WHERE `key` = ?",
        [valueJson, key]
      );
    } else {
      // Insert new record
      await executeWrite(
        "INSERT INTO key_value_store (`key`, value) VALUES (?, ?)",
        [key, valueJson]
      );
    }
  } catch (error) {
    console.error(`Error saving data for key '${key}':`, error);
    throw error;
  }
};
