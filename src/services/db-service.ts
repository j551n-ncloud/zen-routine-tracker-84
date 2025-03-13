
import { toast } from "sonner";

// Base URL for the SQLite API
const API_URL = import.meta.env.VITE_DATABASE_URL || 'http://localhost:3000';

// Initialize flag
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

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
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Initializing database connection to SQLite API server');
      
      // Test connection to SQLite API
      const response = await fetch(`${API_URL}/tables`);
      
      if (!response.ok) {
        throw new Error(`Failed to connect to SQLite API: ${response.statusText}`);
      }
      
      const tables = await response.json();
      console.log('Connected to SQLite API successfully, available tables:', tables);
      
      // Ensure our required tables exist
      await createTables();
      
      isInitialized = true;
      isInitializing = false;
      console.log('Database initialized successfully');
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
  
  console.log("Database tables created or verified");
};

// Function to execute a query and return the results
export const executeQuery = async <T>(
  query: string, 
  params: any[] = []
): Promise<T[]> => {
  await ensureDatabaseInitialized();
  
  try {
    // Replace ? with $1, $2, etc. for SQLite API
    const parameterizedQuery = query.replace(/\?/g, (match, index) => `$${index + 1}`);
    
    const response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: parameterizedQuery,
        params: params,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Query execution failed: ${errorText}`);
    }
    
    const result = await response.json();
    return result as T[];
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
    // Replace ? with $1, $2, etc. for SQLite API
    const parameterizedQuery = query.replace(/\?/g, (match, index) => `$${index + 1}`);
    
    const response = await fetch(`${API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: parameterizedQuery,
        params: params,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Write operation failed: ${errorText}`);
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

// Function to get data from key-value store
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const results = await executeQuery<{ value: string }>(
      "SELECT value FROM key_value_store WHERE key = ?",
      [key]
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
