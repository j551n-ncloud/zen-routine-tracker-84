import initSqlJs, { SqlJsStatic, Database } from 'sql.js';
import { toast } from "sonner";

// We'll use a singleton pattern to ensure only one database connection exists
let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// List of CDN URLs to try for the SQL.js WASM file
const WASM_CDNS = [
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm',
  'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.wasm',
  'https://unpkg.com/sql.js@1.8.0/dist/sql-wasm.wasm'
];

// Function to initialize the database with retry mechanism
export const initDatabase = async (): Promise<void> => {
  if (isInitializing) {
    // If already initializing, return the existing promise
    return initPromise!;
  }
  
  isInitializing = true;
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Try each CDN URL until one works
      let sqlInitialized = false;
      let lastError = null;
      
      console.log("Initializing SQL.js");
      
      for (const wasmUrl of WASM_CDNS) {
        try {
          // Initialize SQL.js with specific WASM URL
          SQL = await initSqlJs({
            locateFile: () => wasmUrl
          });
          
          console.log("SQL.js initialized successfully using:", wasmUrl);
          sqlInitialized = true;
          break; // Break the loop if initialization succeeds
        } catch (error) {
          console.warn(`Failed to initialize SQL.js with WASM from ${wasmUrl}:`, error);
          lastError = error;
        }
      }
      
      if (!sqlInitialized) {
        throw lastError || new Error("Failed to initialize SQL.js with any of the provided WASM URLs");
      }
      
      // Load existing database from localStorage or create a new one
      try {
        const savedDbData = localStorage.getItem('zentracker-db');
        
        if (savedDbData) {
          try {
            // Convert base64 string back to Uint8Array
            const binary = atob(savedDbData);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            
            // Open the database
            db = new SQL.Database(bytes);
            console.log("Database loaded from localStorage");
          } catch (loadError) {
            console.error("Failed to load database from localStorage, creating new:", loadError);
            db = new SQL.Database();
            createTables();
          }
        } else {
          // Create a new database
          db = new SQL.Database();
          createTables();
          console.log("New database created");
        }
      } catch (dbError) {
        console.error("Error during database creation:", dbError);
        throw dbError;
      }
      
      isInitializing = false;
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
const createTables = () => {
  if (!db) return;
  
  try {
    // Table for generic key-value pairs
    db.exec(`
      CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    // Table for habits
    db.exec(`
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
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_habits (
        date TEXT,
        habit_id INTEGER,
        completed BOOLEAN DEFAULT 0,
        PRIMARY KEY (date, habit_id)
      );
    `);
    
    // Table for tasks
    db.exec(`
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
    db.exec(`
      CREATE TABLE IF NOT EXISTS calendar_data (
        date TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
    `);
    
    console.log("Database tables created");
  } catch (error) {
    console.error("Error creating database tables:", error);
    throw error;
  }
};

// Save the database to localStorage
export const saveDatabase = () => {
  if (!db) return;
  
  try {
    // Export the database to a Uint8Array
    const data = db.export();
    
    // Convert Uint8Array to base64 string for storage
    let binary = '';
    const bytes = new Uint8Array(data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // Save to localStorage
    localStorage.setItem('zentracker-db', btoa(binary));
    console.log("Database saved to localStorage");
  } catch (error) {
    console.error("Failed to save database:", error);
    toast.error("Failed to save database. Your changes may not persist.");
  }
};

// Function to execute a query and return the results
export const executeQuery = async <T>(
  query: string, 
  params: any[] = []
): Promise<T[]> => {
  await ensureDatabaseInitialized();
  
  if (!db) throw new Error("Database not initialized");
  
  try {
    const statement = db.prepare(query);
    statement.bind(params);
    
    const results: T[] = [];
    while (statement.step()) {
      results.push(statement.getAsObject() as T);
    }
    
    statement.free();
    
    // Save changes to localStorage
    saveDatabase();
    
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
  
  if (!db) throw new Error("Database not initialized");
  
  try {
    const statement = db.prepare(query);
    statement.bind(params);
    statement.step();
    statement.free();
    
    // Save changes to localStorage
    saveDatabase();
  } catch (error) {
    console.error("Write operation error:", error, "Query:", query, "Params:", params);
    throw error;
  }
};

// Function to ensure the database is initialized before use
const ensureDatabaseInitialized = async (): Promise<void> => {
  if (!db) {
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
    
    if (exists[0].count > 0) {
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
