
import initSqlJs, { SqlJsStatic, Database } from 'sql.js';
import { toast } from "sonner";

// We'll use a singleton pattern to ensure only one database connection exists
let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// List of local paths and CDNs to try for the WASM file
const WASM_SOURCES = [
  // First, try local paths
  '/sql-wasm.wasm',                                                      // In public folder
  '/assets/sql-wasm.wasm',                                               // In assets folder
  
  // Then try raw CDNs from GitHub
  'https://raw.githubusercontent.com/sql-js/sql.js/master/dist/sql-wasm.wasm',
  
  // Then try regular CDNs
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm',
  'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.wasm',
  'https://unpkg.com/sql.js@1.8.0/dist/sql-wasm.wasm',
  'https://sql.js.org/dist/sql-wasm.wasm'
];

// IndexedDB database name and store constants
const IDB_NAME = 'zentracker-db';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'sqlitedb';
const IDB_KEY_NAME = 'db';

// Function to download the WASM file from a URL and save it as a blob
async function downloadWasmFile(url: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Attempting to download WASM from: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'force-cache',
      headers: {
        'Accept': 'application/wasm',
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to download WASM from ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('Content-Type');
    if (contentType && !contentType.includes('application/wasm') && !contentType.includes('application/octet-stream')) {
      console.warn(`Unexpected Content-Type: ${contentType} from ${url}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 100) {
      console.warn(`WASM file from ${url} seems too small (${arrayBuffer.byteLength} bytes)`);
      return null;
    }
    
    console.log(`Successfully downloaded WASM from ${url} (${arrayBuffer.byteLength} bytes)`);
    return arrayBuffer;
  } catch (err) {
    console.warn(`Error downloading WASM from ${url}:`, err);
    return null;
  }
}

// Function to open the IndexedDB database
const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    
    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event);
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
  });
};

// Function to load the database from IndexedDB
const loadDbFromIndexedDB = async (): Promise<Uint8Array | null> => {
  try {
    const idb = await openIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction([IDB_STORE_NAME], 'readonly');
      const store = transaction.objectStore(IDB_STORE_NAME);
      const request = store.get(IDB_KEY_NAME);
      
      request.onerror = () => {
        console.error('Error reading from IndexedDB');
        reject(new Error('Error reading from IndexedDB'));
      };
      
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          resolve(new Uint8Array(data));
        } else {
          resolve(null);
        }
        idb.close();
      };
    });
  } catch (error) {
    console.error('Error accessing IndexedDB:', error);
    return null;
  }
};

// Function to save the database to IndexedDB
const saveDbToIndexedDB = async (data: Uint8Array): Promise<void> => {
  try {
    const idb = await openIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction([IDB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IDB_STORE_NAME);
      const request = store.put(data, IDB_KEY_NAME);
      
      request.onerror = () => {
        console.error('Error writing to IndexedDB');
        reject(new Error('Error writing to IndexedDB'));
      };
      
      request.onsuccess = () => {
        resolve();
        idb.close();
      };
    });
  } catch (error) {
    console.error('Error accessing IndexedDB for saving:', error);
    throw error;
  }
};

// Function to initialize the database
export const initDatabase = async (): Promise<void> => {
  if (isInitializing) {
    // If already initializing, return the existing promise
    return initPromise!;
  }
  
  isInitializing = true;
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Try to initialize SQL.js directly first
      for (const wasmSource of WASM_SOURCES) {
        try {
          console.log(`Trying to initialize SQL.js with WASM from: ${wasmSource}`);
          SQL = await initSqlJs({
            locateFile: () => wasmSource
          });
          console.log(`Successfully initialized SQL.js with WASM from: ${wasmSource}`);
          break;
        } catch (err) {
          console.warn(`Failed to initialize SQL.js with WASM from: ${wasmSource}`, err);
        }
      }

      if (!SQL) {
        // If direct initialization failed, try to download the WASM file and use it
        let wasmBuffer = null;
        for (const wasmSource of WASM_SOURCES) {
          wasmBuffer = await downloadWasmFile(wasmSource);
          if (wasmBuffer) {
            try {
              // Create a Blob URL from the downloaded WASM
              const blob = new Blob([wasmBuffer], { type: 'application/wasm' });
              const blobUrl = URL.createObjectURL(blob);
              
              console.log(`Creating SQL.js from downloaded WASM blob: ${blobUrl}`);
              SQL = await initSqlJs({
                locateFile: () => blobUrl
              });
              
              console.log(`Successfully initialized SQL.js with downloaded WASM`);
              break;
            } catch (err) {
              console.warn('Failed to initialize SQL.js with downloaded WASM:', err);
            }
          }
        }
      }

      if (!SQL) {
        throw new Error('Failed to initialize SQL.js. Please check your internet connection and try again.');
      }
      
      // Try to load existing database from IndexedDB
      const savedDbData = await loadDbFromIndexedDB();
      
      if (savedDbData) {
        try {
          // Open the database with the saved data
          db = new SQL.Database(savedDbData);
          console.log("Database loaded from IndexedDB");
        } catch (loadError) {
          console.error("Failed to load database from IndexedDB, creating new:", loadError);
          db = new SQL.Database();
          createTables();
        }
      } else {
        // Create a new database
        db = new SQL.Database();
        createTables();
        console.log("New database created");
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
};

// Save the database to IndexedDB
export const saveDatabase = async () => {
  if (!db) return;
  
  try {
    // Export the database to a Uint8Array
    const data = db.export();
    
    // Save to IndexedDB
    await saveDbToIndexedDB(data);
    console.log("Database saved to IndexedDB");
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
    
    // Save changes to IndexedDB
    await saveDatabase();
    
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
    
    // Save changes to IndexedDB
    await saveDatabase();
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
