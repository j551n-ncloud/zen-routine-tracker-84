
import { useEffect, useState } from 'react';
import { initSupabase, isMockMode, setMockMode } from '../services/supabase-service';
import { toast } from 'sonner';
import config from '../services/api-config';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    let isMounted = true;
    
    // Check if running in a browser environment
    const isBrowser = typeof window !== 'undefined';
    
    // Check if mock mode is enabled in localStorage
    const storedMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    
    if (storedMockMode) {
      console.log('Mock mode enabled from localStorage');
      setMockMode(true);
      
      if (isMounted) {
        setIsInitialized(true);
        setIsLoading(false);
        setError(null);
      }
      return;
    }
    
    const init = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing Supabase connection...');
        const success = await initSupabase();
        
        if (isMounted) {
          setIsInitialized(success);
          if (success) {
            console.log('Supabase initialized successfully');
            if (isMockMode()) {
              toast.warning("Supabase not available. Using mock mode.", {
                description: "Data will be stored locally in your browser."
              });
            } else {
              toast.success("Connected to Supabase successfully");
            }
          }
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          
          // Auto-enable mock mode after all retries fail
          if (retryCount >= MAX_RETRIES) {
            console.log('Max retries reached, enabling mock mode');
            toast.error("Could not connect to database. Enabling offline mode.");
            setMockMode(true);
            setIsInitialized(true);
            setError(null);
            return;
          }
          
          // Retry logic
          if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`Retrying Supabase initialization in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
              }
            }, delay);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();
    
    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  return { 
    isInitialized, 
    error, 
    isLoading, 
    retryCount, 
    maxRetries: MAX_RETRIES,
    isMockMode: isMockMode(),
    setMockMode
  };
}
