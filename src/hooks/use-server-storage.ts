
import { useState, useEffect } from "react";
import { fetchData, saveData } from "./api-utils";
import { toast } from "sonner";

export function useServerStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data from API on initial mount
  useEffect(() => {
    const fetchDataFromServer = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching data from server for key: ${key}`);
        
        // Fetch from server using our helper
        const data = await fetchData<T>(key);
        
        if (data) {
          console.log(`Successfully fetched data for key: ${key}`);
          setStoredValue(data);
        } else {
          console.log(`No data found for key: ${key}, using initial value`);
          // If no data on server, use initial value
          setStoredValue(initialValue);
          
          // Try to save the initial value to server with a small delay
          setTimeout(async () => {
            try {
              await saveData(key, initialValue);
              console.log(`Successfully saved initial value for key: ${key}`);
            } catch (saveError) {
              console.warn(`Could not save initial value for ${key}:`, saveError);
            }
          }, 300); // Small consistent delay
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStoredValue(initialValue);
        
        // Only show the toast for unexpected errors
        // Skip errors on the custom domain as they're expected during initial setup
        if (window.location.hostname !== 'habit.j551n.com') {
          toast.error("Failed to load data from server");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Calculate a deterministic but varied delay based on the key
    const calculateDelay = () => {
      // Hash the key to a number (simple hash function)
      const hash = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      // Use the hash to create a delay between 1-3 seconds
      return 1000 + (hash % 2000);
    };

    const timeoutId = setTimeout(() => {
      fetchDataFromServer();
    }, calculateDelay());

    return () => clearTimeout(timeoutId);
  }, [key, initialValue]);

  // Function to save data to the server
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state locally first
      setStoredValue(valueToStore);
      
      // Save to server using our helper
      await saveData(key, valueToStore);
      console.log(`Successfully saved data for key: ${key}`);
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Only show the toast for unexpected errors
      // Skip errors on the custom domain as they're expected during initial setup
      if (window.location.hostname !== 'habit.j551n.com') {
        toast.error("Failed to save data to server");
      }
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
