
import { useEffect, useState } from 'react';
import { initDatabase } from '../services/db-service';
import { toast } from 'sonner';

export function useDbInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    // Skip if already initialized or max attempts reached
    if (isInitialized || initAttempts >= MAX_ATTEMPTS) return;

    const init = async () => {
      try {
        console.log(`Database initialization attempt ${initAttempts + 1}`);
        await initDatabase();
        setIsInitialized(true);
        if (initAttempts > 0) {
          toast.success("Database initialized successfully!");
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // If we haven't reached max attempts, schedule another try
        if (initAttempts < MAX_ATTEMPTS - 1) {
          const delay = Math.pow(2, initAttempts) * 1000; // Exponential backoff
          toast.error(`Database initialization failed. Retrying in ${delay/1000} seconds...`);
          setTimeout(() => {
            setInitAttempts(prev => prev + 1);
          }, delay);
        } else {
          toast.error("Could not initialize database after multiple attempts. Please refresh the page.");
        }
      }
    };

    init();
  }, [initAttempts, isInitialized]);

  return { isInitialized, error, initAttempts };
}
