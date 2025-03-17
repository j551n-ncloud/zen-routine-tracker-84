import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import syncService from '@/services/sync-service';

export function useSyncService() {
  const { user } = useAuth();
  
  // Start sync service when user is logged in
  useEffect(() => {
    if (user) {
      syncService.init();
      
      return () => {
        // Cleanup when component unmounts
        syncService.stop();
      };
    }
  }, [user]);
  
  return {
    registerKey: (key: string) => syncService.registerKey(key),
    unregisterKey: (key: string) => syncService.unregisterKey(key),
    syncNow: () => syncService.syncNow()
  };
}