
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Calculate the API base URL - prefer environment variables, fallback to current origin, then try localhost ports
const getApiBaseUrl = () => {
  // If we have an environment variable, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production, try to use the same origin
  if (process.env.NODE_ENV === 'production') {
    // If we're not in a browser, return a default localhost URL
    if (typeof window === 'undefined') {
      return 'http://localhost:3001';
    }
    
    // Check if we're on a different port than API (common in some deployments)
    const currentPort = window.location.port;
    if (currentPort === '8080' || currentPort === '5173') {
      // Likely a dev server, API probably on 3001
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    
    // Same origin
    return window.location.origin;
  }
  
  // In development, try localhost:3001
  return 'http://localhost:3001';
};

// API base URL
const API_BASE_URL = getApiBaseUrl();

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
        
        console.log(`Fetching data from ${API_BASE_URL}/api/data/${key}`);
        const response = await fetch(`${API_BASE_URL}/api/data/${key}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server did not return valid JSON');
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
      
      console.log(`Saving data to ${API_BASE_URL}/api/data/${key}`);
      const response = await fetch(`${API_BASE_URL}/api/data/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ value: valueToStore }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
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
