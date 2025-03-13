
import { useState, useEffect } from "react";
import fs from 'fs';
import path from 'path';

// Define data directory path - this will be relative to where the server is running
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
try {
  if (typeof window === 'undefined' && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (error) {
  console.error("Failed to create data directory:", error);
}

export function useServerStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== "undefined") {
      // We're in the browser, so fallback to localStorage
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error("Error reading from localStorage:", error);
        return initialValue;
      }
    } else {
      // We're on the server
      try {
        const filePath = path.join(DATA_DIR, `${key}.json`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(data);
        }
        return initialValue;
      } catch (error) {
        console.error(`Error reading from server for key ${key}:`, error);
        return initialValue;
      }
    }
  });

  // Function to save both to localStorage (client-side) and the file system (server-side)
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage if we're in the browser
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      // Save to file system if we're on the server
      if (typeof window === "undefined") {
        const filePath = path.join(DATA_DIR, `${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(valueToStore, null, 2));
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // Sync with localStorage if we're in the browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedItem = localStorage.getItem(key);
      if (savedItem) {
        try {
          setStoredValue(JSON.parse(savedItem));
        } catch (e) {
          console.error("Error parsing stored JSON:", e);
        }
      }
    }
  }, [key]);

  return [storedValue, setValue] as const;
}
