
import { useState, useEffect } from "react";
import { fetchData, saveData } from "./api-utils";

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
    // Sync with server when the component mounts - with rate limiting
    const syncFromServer = async () => {
      try {
        console.log(`Syncing from server for key: ${key}`);
        // Try to get from server using our helper
        const data = await fetchData<T>(key);
        
        if (data) {
          setStoredValue(data);
          // Update localStorage with server data
          localStorage.setItem(key, JSON.stringify(data));
          console.log(`Successfully synced ${key} from server`);
        } else {
          console.log(`No data found on server for key: ${key}, using local value`);
        }
      } catch (error) {
        console.error("Error syncing from server:", error);
        
        // If server sync fails, fall back to local storage
        const savedItem = localStorage.getItem(key);
        if (savedItem) {
          try {
            const parsedItem = JSON.parse(savedItem);
            console.log(`Using local data for key: ${key}`);
            setStoredValue(parsedItem);
          } catch (parseError) {
            console.error("Error parsing localStorage item:", parseError);
          }
        }
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
        
        // Send to server using our helper with a small delay to reduce concurrent requests
        setTimeout(() => {
          saveData(key, valueToStore).then(() => {
            console.log(`Successfully saved ${key} to server`);
          }).catch(error => {
            console.error("Error saving to server:", error);
            // We're intentionally not showing toasts for these errors
            // as they can be noisy if the server is temporarily unavailable
            // and we have the data safely in localStorage
          });
        }, 300); // Small delay to batch potential multiple updates
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}
