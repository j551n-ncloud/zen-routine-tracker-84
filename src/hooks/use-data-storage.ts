
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Base URL for API - adjust based on your deployment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

export function useDataStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Load data from server on initial mount
  useEffect(() => {
    if (!user) return; // Don't fetch data if not authenticated
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Try to get from localStorage first (faster)
        const localData = localStorage.getItem(`${user.userId}_${key}`);
        if (localData) {
          setStoredValue(JSON.parse(localData));
        }
        
        // Then fetch from server (might be more up-to-date)
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;
        
        const response = await fetch(`${API_BASE_URL}/api/data/${key}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data) {
          setStoredValue(data);
          // Update localStorage with server data
          localStorage.setItem(`${user.userId}_${key}`, JSON.stringify(data));
        } else if (!localData) {
          // If no data on server and no local data, use initial value
          setStoredValue(initialValue);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fall back to localStorage if server fetch fails
        const localData = localStorage.getItem(`${user.userId}_${key}`);
        if (localData) {
          setStoredValue(JSON.parse(localData));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, initialValue, user]);

  // Function to save data both to localStorage and server
  const setValue = async (value: T | ((val: T) => T)) => {
    if (!user) return; // Don't save data if not authenticated
    
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage for immediate access
      localStorage.setItem(`${user.userId}_${key}`, JSON.stringify(valueToStore));
      
      // Save to server in background
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      
      const response = await fetch(`${API_BASE_URL}/api/data/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
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
  } as const;
}
