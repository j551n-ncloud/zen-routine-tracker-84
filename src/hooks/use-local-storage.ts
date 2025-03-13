
import { useState, useEffect } from "react";
import { fetchData, saveData } from "./api-utils";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // If the server-side data changes, update the local state
  useEffect(() => {
    // Sync with server when the component mounts - with rate limiting
    const syncFromServer = async () => {
      try {
        setIsLoading(true);
        console.log(`Syncing from server for key: ${key}`);
        // Try to get from server using our helper
        const data = await fetchData<T>(key);
        
        if (data) {
          setStoredValue(data);
          console.log(`Successfully synced ${key} from server`);
        } else {
          console.log(`No data found on server for key: ${key}, using initial value`);
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
      } catch (error) {
        console.error("Error syncing from server:", error);
        // Use initial value if server sync fails
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
      }
    };

    // Use a staggered delay strategy to avoid overwhelming the server
    // Calculate delay based on the key's string content for deterministic but varied delays
    const calculateDelay = () => {
      // Hash the key to a number (simple hash function)
      const hash = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      // Use the hash to create a delay between 1-5 seconds
      return 1000 + (hash % 4000);
    };

    const timeoutId = setTimeout(() => {
      syncFromServer();
    }, calculateDelay());

    return () => clearTimeout(timeoutId);
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to the server only (no localStorage).
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Send to server using our helper with a small delay to reduce concurrent requests
      setTimeout(() => {
        saveData(key, valueToStore).then(() => {
          console.log(`Successfully saved ${key} to server`);
        }).catch(error => {
          console.error("Error saving to server:", error);
        });
      }, 300); // Small delay to batch potential multiple updates
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return [storedValue, setValue] as const;
}
