
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

export function useDataStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data from API on initial mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching data from: ${API_BASE_URL}/data/${key}`);
        
        // Fetch from server
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
        } else {
          // If no data on server, use initial value
          setStoredValue(initialValue);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, initialValue]);

  // Function to save data to the server
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      console.log(`Saving data to: ${API_BASE_URL}/data/${key}`);
      
      // Save to server
      const response = await fetch(`${API_BASE_URL}/data/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: valueToStore }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return { 
    data: storedValue, 
    setData: setValue, 
    isLoading, 
    error,
    // For backward compatibility
    0: storedValue, 
    1: setValue 
  } as const;
}
