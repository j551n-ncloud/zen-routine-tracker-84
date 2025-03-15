
import { useState, useEffect } from "react";
import { getData, saveData } from "../services/supabase-service";
import { toast } from "sonner";

export function useServerStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data from database on initial mount
  useEffect(() => {
    const fetchDataFromDB = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching data from database for key: ${key}`);
        
        // Fetch from database using our helper
        const data = await getData(key);
        
        if (data) {
          console.log(`Successfully fetched data for key: ${key}`);
          setStoredValue(data as T);
        } else {
          console.log(`No data found for key: ${key}, using initial value`);
          // If no data in database, use initial value
          setStoredValue(initialValue);
          
          // Save the initial value to database
          await saveData(key, initialValue);
          console.log(`Successfully saved initial value for key: ${key}`);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        toast.error("Failed to load data from database");
      } finally {
        setIsLoading(false);
      }
    };

    // Use a small delay to prevent database congestion
    const timeoutId = setTimeout(() => {
      fetchDataFromDB();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [key, initialValue]);

  // Function to save data to the database
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state locally first
      setStoredValue(valueToStore);
      
      // Save to database using our helper
      await saveData(key, valueToStore);
      console.log(`Successfully saved data for key: ${key}`);
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to save data to database");
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
