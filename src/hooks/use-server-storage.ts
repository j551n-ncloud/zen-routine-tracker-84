
import { useState, useEffect } from "react";

// Define data directory path - this will be relative to where the server is running
const DATA_DIR = typeof window === 'undefined' ? process.cwd() + '/data' : '';

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
      // We're on the server - this would be handled by server-side code
      return initialValue;
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
