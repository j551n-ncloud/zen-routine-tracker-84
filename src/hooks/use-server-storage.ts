
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
          setStoredValue(data);
        } else {
          // If no data on server, use initial value
          setStoredValue(initialValue);
          
          // Try to save the initial value to server with a small delay
          setTimeout(async () => {
            try {
              await saveData(key, initialValue);
            } catch (saveError) {
              console.warn(`Could not save initial value for ${key}:`, saveError);
              // Don't show toast for this case
            }
          }, Math.random() * 1000); // Random delay up to 1 second
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStoredValue(initialValue);
        
        // Only show the toast for unexpected errors
        // Skip 404 errors on the custom domain as they're expected during initial setup
        if (!(window.location.hostname === 'habit.j551n.com' && String(err).includes('404'))) {
          toast.error("Failed to load data from server");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Add a substantial delay to prevent too many simultaneous requests
    // This is especially important on initial page load
    const timeoutId = setTimeout(() => {
      fetchDataFromServer();
    }, 1000 + Math.random() * 3000); // Random delay between 1s and 4s

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
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Only show the toast for unexpected errors
      // Skip 404 errors on the custom domain as they're expected during initial setup
      if (!(window.location.hostname === 'habit.j551n.com' && String(err).includes('404'))) {
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
