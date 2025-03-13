
import { toast } from "sonner";
import axios from "axios";

// Initialize flag
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Performance timer
let initStartTime = 0;

// Base URL for SQLite container API
const SQLITE_API_URL = 'http://sqlite:3000/api';

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
      console.log('Initializing SQLite database connection');
      
      // Test connection to SQLite container
      const response = await axios.get(`${SQLITE_API_URL}/status`);
      
      if (response.status === 200) {
        isInitialized = true;
        isInitializing = false;
        
        const initTime = Math.round(performance.now() - initStartTime);
        console.log(`Database connection initialized successfully in ${initTime}ms`);
        
        // Ensure tables exist
        await createTables();
        
        resolve();
      } else {
        throw new Error(`Failed to connect to SQLite container: ${response.statusText}`);
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

// Create the database tables
const createTables = async () => {
  // Initialize table creation performance metrics
  const tableStartTime = performance.now();
  
  const tables = [
    // Table for generic key-value pairs
    `CREATE TABLE IF NOT EXISTS key_value_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
    
    // Table for habits
    `CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      streak INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      category TEXT,
      icon TEXT
    );`,
    
    // Table for daily habit status
    `CREATE TABLE IF NOT EXISTS daily_habits (
      date TEXT,
      habit_id INTEGER,
      completed BOOLEAN DEFAULT 0,
      PRIMARY KEY (date, habit_id)
    );`,
    
    // Table for tasks
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('high', 'medium', 'low')),
      completed BOOLEAN DEFAULT 0,
      start_date TEXT,
      due_date TEXT NOT NULL
    );`,
    
    // Table for calendar data
    `CREATE TABLE IF NOT EXISTS calendar_data (
      date TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );`,
    
    // Table for users
    `CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0
    );`
  ];
  
  try {
    // Execute each table creation query
    for (const query of tables) {
      await executeWrite(query);
    }
    
    // Check if any users exist
    const users = await executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );
    
    // If no users exist, create a default admin user
    if (users.length === 0 || users[0].count === 0) {
      await executeWrite(
        "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
        ["admin", "admin", 1]
      );
      console.log("Created default admin user");
    }
    
    const tableTime = Math.round(performance.now() - tableStartTime);
    console.log(`Database tables created or verified in ${tableTime}ms`);
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
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
    
    // Send query to SQLite container
    const response = await axios.post(`${SQLITE_API_URL}/query`, {
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
    
    // Send write operation to SQLite container
    await axios.post(`${SQLITE_API_URL}/execute`, {
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
      "SELECT value FROM key_value_store WHERE key = ?",
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
      "SELECT COUNT(*) as count FROM key_value_store WHERE key = ?",
      [key]
    );
    
    if (exists.length > 0 && exists[0].count > 0) {
      // Update existing record
      await executeWrite(
        "UPDATE key_value_store SET value = ? WHERE key = ?",
        [valueJson, key]
      );
    } else {
      // Insert new record
      await executeWrite(
        "INSERT INTO key_value_store (key, value) VALUES (?, ?)",
        [key, valueJson]
      );
    }
  } catch (error) {
    console.error(`Error saving data for key '${key}':`, error);
    throw error;
  }
};

// Functions for database export/import are removed as they're not applicable
// with the container approach (container will handle persistence)
