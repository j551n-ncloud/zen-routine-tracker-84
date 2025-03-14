
import { useEffect, useState } from 'react';
import { initSupabase } from '../services/supabase-service';
import { toast } from 'sonner';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing Supabase connection...');
        const success = await initSupabase();
        
        if (isMounted) {
          setIsInitialized(success);
          if (success) {
            console.log('Supabase initialized successfully');
            toast.success("Connected to Supabase successfully");
          }
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          
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
    maxRetries: MAX_RETRIES
  };
}
