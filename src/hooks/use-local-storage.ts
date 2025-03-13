
import { useState, useEffect } from "react";

// Base URL for API - adjusted to use /api path prefix
const API_BASE_URL = (() => {
  // For production environments
  if (process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/api`;
  }
  
  // For local development
  // Check if accessing from a mobile device on the same network
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${window.location.origin}/api`;
  }
  
  // Default for localhost
  return 'http://localhost:3001';
})();

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  // If the server-side data changes, update the local state
  useEffect(() => {
    // Sync with server when the component mounts
    const syncFromServer = async () => {
      try {
        console.log(`Syncing from server: ${API_BASE_URL}/data/${key}`);
        // Try to get from server
        const response = await fetch(`${API_BASE_URL}/data/${key}`);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON response but got ${contentType}`);
        }
        
        const data = await response.json();
        
        if (data) {
          setStoredValue(data);
          // Update localStorage with server data
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error syncing from server:", error);
        
        // If server sync fails, fall back to local storage
        const savedItem = localStorage.getItem(key);
        if (savedItem) {
          const parsedItem = JSON.parse(savedItem);
          setStoredValue(parsedItem);
        }
      }
    };

    syncFromServer();
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage and server.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Send to server
        console.log(`Saving to server: ${API_BASE_URL}/data/${key}`);
        fetch(`${API_BASE_URL}/data/${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: valueToStore }),
        }).catch(error => {
          console.error("Error saving to server:", error);
        });
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}
