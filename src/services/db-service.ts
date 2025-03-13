
import { toast } from "sonner";
import mysql from "mysql2/promise";
import apiConfig from "./api-config";

// Create a connection pool
let pool: mysql.Pool | null = null;

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
      
      // Create connection pool
      pool = mysql.createPool({
        host: apiConfig.db.host,
        port: apiConfig.db.port,
        user: apiConfig.db.user,
        password: apiConfig.db.password,
        database: apiConfig.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      // Test connection
      const connection = await pool.getConnection();
      connection.release();
      
      isInitialized = true;
      isInitializing = false;
      
      const initTime = Math.round(performance.now() - initStartTime);
      console.log(`Database connection initialized successfully in ${initTime}ms`);
      
      resolve();
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
  
  if (!pool) {
    throw new Error("Database connection not initialized");
  }
  
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
    
    // Execute query with MariaDB
    const [results] = await pool.query<any>(query, params);
    
    // Add to cache for read operations
    if (useCache && query.trim().toLowerCase().startsWith('select')) {
      queryCache.set(cacheKey, results);
    }
    
    const queryTime = Math.round(performance.now() - startTime);
    if (queryTime > 200) {
      console.warn(`Slow query (${queryTime}ms): ${query}`);
    }
    
    return results as T[];
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
  
  if (!pool) {
    throw new Error("Database connection not initialized");
  }
  
  try {
    const startTime = performance.now();
    
    // Execute write operation with MariaDB
    await pool.query(query, params);
    
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
