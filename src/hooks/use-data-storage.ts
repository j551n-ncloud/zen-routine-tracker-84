
import { useState, useEffect } from "react";

// Base URL for API - adjust based on your deployment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

export function useDataStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data from server on initial mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Try to get from localStorage first (faster)
        const localData = localStorage.getItem(key);
        if (localData) {
          setStoredValue(JSON.parse(localData));
        }
        
        // Then fetch from server (might be more up-to-date)
        const response = await fetch(`${API_BASE_URL}/api/data/${key}`);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data) {
          setStoredValue(data);
          // Update localStorage with server data
          localStorage.setItem(key, JSON.stringify(data));
        } else if (!localData) {
          // If no data on server and no local data, use initial value
          setStoredValue(initialValue);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fall back to localStorage if server fetch fails
        const localData = localStorage.getItem(key);
        if (localData) {
          setStoredValue(JSON.parse(localData));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, initialValue]);

  // Function to save data both to localStorage and server
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage for immediate access
      localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Save to server in background
      const response = await fetch(`${API_BASE_URL}/api/data/${key}`, {
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
    // For backward compatibility with useLocalStorage
    0: storedValue, 
    1: setValue 
  } as const & { 0: T, 1: typeof setValue };
}
