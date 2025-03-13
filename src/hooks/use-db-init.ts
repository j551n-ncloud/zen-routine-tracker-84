
import { useEffect, useState } from 'react';
import { initDatabase } from '../services/db-service';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return { isInitialized, error, isLoading };
}
