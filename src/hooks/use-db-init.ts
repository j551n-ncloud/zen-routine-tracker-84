
import { useEffect, useState } from 'react';
import { initDatabase } from '../services/db-service';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    init();
  }, []);

  return { isInitialized, error };
}
