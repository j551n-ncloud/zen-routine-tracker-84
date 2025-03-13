
import { useEffect, useState } from 'react';
import { initDatabase, setMockMode, isMockMode } from '../services/db-service';
import { toast } from 'sonner';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing local storage...');
        const success = await initDatabase();
        
        if (isMounted) {
          setIsInitialized(success);
          if (success) {
            console.log('Storage initialized successfully');
            toast.success("Local storage initialized successfully");
          }
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          toast.error("Could not initialize storage. Using in-memory mode.");
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
  }, []);

  return { 
    isInitialized, 
    error, 
    isLoading,
    isMockMode: isMockMode(),
    setMockMode
  };
}
