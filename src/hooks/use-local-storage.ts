
import { useState, useEffect } from "react";

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
    // In a real implementation, this would use a WebSocket or polling to listen for server changes
    // For now, we just sync with localStorage when the component mounts
    const syncFromServer = async () => {
      try {
        // In a full implementation, this would be an API call to get the latest data from the server
        // For now, we just use localStorage as our source of truth
        const savedItem = localStorage.getItem(key);
        if (savedItem) {
          const parsedItem = JSON.parse(savedItem);
          setStoredValue(parsedItem);
        }
      } catch (error) {
        console.error("Error syncing from server:", error);
      }
    };

    syncFromServer();
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
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
        
        // In a real implementation, this would also send the data to the server
        // For example: fetch('/api/save', { method: 'POST', body: JSON.stringify({ key, value: valueToStore }) });
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}
