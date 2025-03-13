
import { toast } from "sonner";
import initSqlJs from 'sql.js';

// Initialize flag
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;
let db: any = null;

// Performance timer
let initStartTime = 0;

// Function to initialize the database
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
  
  // Preload the WASM file at startup to improve performance
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.href = '/sql-wasm.wasm';
  preloadLink.as = 'fetch';
  preloadLink.type = 'application/wasm';
  preloadLink.crossOrigin = 'anonymous';
  document.head.appendChild(preloadLink);
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Initializing SQL.js database');
      
      // Initialize SQL.js
      const SQL = await initSqlJs({
        // Specify location of wasm file
        locateFile: file => `/${file}`
      });
      
      // Create a new database
      db = new SQL.Database();
      
      // Create tables
      await createTables();
      
      isInitialized = true;
      isInitializing = false;
      
      const initTime = Math.round(performance.now() - initStartTime);
      console.log(`Database initialized successfully in ${initTime}ms`);
      resolve();
    } catch (error) {
      console.error("Failed to initialize database:", error);
      isInitializing = false;
      reject(error);
      
      toast.error("Failed to initialize database. Some features may not work properly.");
    }
  });
  
  return initPromise;
};

// Create the database tables
const createTables = async () => {
  // Initialize table creation performance metrics
  const tableStartTime = performance.now();
  
  // Table for generic key-value pairs
  await executeWrite(`
    CREATE TABLE IF NOT EXISTS key_value_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  
  // Table for habits
  await executeWrite(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      streak INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      category TEXT,
      icon TEXT
    );
  `);
  
  // Table for daily habit status
  await executeWrite(`
    CREATE TABLE IF NOT EXISTS daily_habits (
      date TEXT,
      habit_id INTEGER,
      completed BOOLEAN DEFAULT 0,
      PRIMARY KEY (date, habit_id)
    );
  `);
  
  // Table for tasks
  await executeWrite(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('high', 'medium', 'low')),
      completed BOOLEAN DEFAULT 0,
      start_date TEXT,
      due_date TEXT NOT NULL
    );
  `);
  
  // Table for calendar data
  await executeWrite(`
    CREATE TABLE IF NOT EXISTS calendar_data (
      date TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
  `);
  
  // Table for users (if it doesn't exist)
  await executeWrite(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0
    );
  `);
  
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
};

// Create a more efficient query executor with caching
const queryCache = new Map<string, any[]>();

// Function to execute a query and return the results
export const executeQuery = async <T>(
  query: string, 
  params: any[] = [],
  useCache = false
): Promise<T[]> => {
  await ensureDatabaseInitialized();
  
  try {
    // Replace ? with actual values (simple implementation)
    let finalQuery = query;
    if (params.length > 0) {
      params.forEach((param) => {
        finalQuery = finalQuery.replace('?', typeof param === 'string' ? `'${param}'` : String(param));
      });
    }
    
    // Check cache for read operations
    if (useCache && finalQuery.trim().toLowerCase().startsWith('select')) {
      const cacheKey = finalQuery;
      if (queryCache.has(cacheKey)) {
        return queryCache.get(cacheKey) as T[];
      }
    }
    
    const startTime = performance.now();
    const stmt = db.prepare(finalQuery);
    const results: T[] = [];
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    
    // Add to cache for read operations
    if (useCache && finalQuery.trim().toLowerCase().startsWith('select')) {
      queryCache.set(finalQuery, results);
    }
    
    const queryTime = Math.round(performance.now() - startTime);
    if (queryTime > 50) {
      console.warn(`Slow query (${queryTime}ms): ${finalQuery}`);
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
    // Replace ? with actual values (simple implementation)
    let finalQuery = query;
    if (params.length > 0) {
      params.forEach((param) => {
        finalQuery = finalQuery.replace('?', typeof param === 'string' ? `'${param}'` : String(param));
      });
    }
    
    const startTime = performance.now();
    db.run(finalQuery);
    
    // Clear cache on write operations as data may have changed
    queryCache.clear();
    
    const writeTime = Math.round(performance.now() - startTime);
    if (writeTime > 50) {
      console.warn(`Slow write operation (${writeTime}ms): ${finalQuery}`);
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

// Function to save the database to localStorage
export const saveDatabaseToStorage = (): void => {
  if (!db) return;
  
  try {
    const startTime = performance.now();
    const data = db.export();
    const buffer = new Uint8Array(data);
    const blob = new Blob([buffer]);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = function() {
      if (typeof reader.result === 'string') {
        localStorage.setItem('zentracker-database', reader.result);
        const saveTime = Math.round(performance.now() - startTime);
        console.log(`Database saved to localStorage in ${saveTime}ms`);
      }
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Failed to save database to localStorage:', error);
  }
};

// Function to load the database from localStorage with improved performance
export const loadDatabaseFromStorage = async (): Promise<boolean> => {
  try {
    const startTime = performance.now();
    const data = localStorage.getItem('zentracker-database');
    if (!data) return false;
    
    // Convert from base64
    const binary = atob(data.split(',')[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    
    // Initialize SQL.js if needed
    if (!db) {
      const SQL = await initSqlJs({
        locateFile: file => `/${file}`
      });
      db = new SQL.Database(array);
      isInitialized = true;
      
      const loadTime = Math.round(performance.now() - startTime);
      console.log(`Database loaded from localStorage in ${loadTime}ms`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to load database from localStorage:', error);
    return false;
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
    
    // Save database to localStorage after write operations
    saveDatabaseToStorage();
  } catch (error) {
    console.error(`Error saving data for key '${key}':`, error);
    throw error;
  }
};
