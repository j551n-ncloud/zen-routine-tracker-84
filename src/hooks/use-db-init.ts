
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createDefaultAdminUser } from '@/services/auth-service';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing database connection...');
        
        // Test the Supabase connection with a simple query
        const { error } = await supabase.from('key_value_store').select('*').limit(1);
        
        if (error && !error.message.includes('does not exist')) {
          throw error;
        }
        
        if (isMounted) {
          setIsInitialized(true);
          setError(null);
          
          // Create default admin if needed
          await createDefaultAdminUser();
          
          console.log('Database initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          
          // Retry logic
          if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`Retrying database initialization in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            
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
