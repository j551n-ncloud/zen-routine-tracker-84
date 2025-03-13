
import { useEffect, useState, useCallback } from 'react';
import { initDatabase } from '../services/db-service';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const initDB = useCallback(async () => {
    if (attempts >= MAX_ATTEMPTS) {
      setError(new Error(`Failed to initialize database after ${MAX_ATTEMPTS} attempts. Please reload the page or check your internet connection.`));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Database initialization attempt ${attempts + 1}`);
      await initDatabase();
      setIsInitialized(true);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize database:', err);
      // Increment attempts counter
      setAttempts(prev => prev + 1);
      // Use exponential backoff for retries (1s, 2s, 4s)
      const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
      console.log(`Retrying database initialization in ${delay}ms (attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
      
      setTimeout(() => {
        initDB();
      }, delay);
      
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [attempts]);

  useEffect(() => {
    initDB();
    
    // Cleanup function
    return () => {
      // Any cleanup needed
    };
  }, [initDB]);

  return { isInitialized, error, isLoading, attempts, maxAttempts: MAX_ATTEMPTS };
}
