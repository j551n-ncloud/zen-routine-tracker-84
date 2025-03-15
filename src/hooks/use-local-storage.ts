
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // If the database data changes, update the local state
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log(`Loading data for key: ${key}`);
        
        // Try to get from Supabase
        const { data, error } = await supabase
          .from('key_value_store')
          .select('value_data')
          .eq('key_name', key)
          .single();
        
        if (error && !error.message.includes('No rows found')) {
          throw error;
        }
        
        if (data) {
          setStoredValue(JSON.parse(data.value_data) as T);
          console.log(`Successfully loaded ${key} from database`);
        } else {
          console.log(`No data found in database for key: ${key}, using initial value`);
          setStoredValue(initialValue);
          
          // Save the initial value to the database
          try {
            await supabase.from('key_value_store').upsert({
              key_name: key,
              value_data: JSON.stringify(initialValue)
            });
            console.log(`Successfully saved initial value for key: ${key}`);
          } catch (saveError) {
            console.warn(`Could not save initial value for ${key}:`, saveError);
          }
        }
      } catch (error) {
        console.error("Error loading from database:", error);
        // Use initial value if database load fails
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to the database.
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to database
      await supabase.from('key_value_store').upsert({
        key_name: key,
        value_data: JSON.stringify(valueToStore)
      });
      console.log(`Successfully saved ${key} to database`);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return [storedValue, setValue, isLoading] as const;
}
