import { toast } from "sonner";

// Calculate the API base URL - prefer environment variables, fallback to current origin, then try localhost ports
const getApiBaseUrl = () => {
  // If we have an environment variable, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production, try to use the same origin
  if (process.env.NODE_ENV === 'production') {
    // If we're not in a browser, return a default localhost URL
    if (typeof window === 'undefined') {
      return 'http://localhost:3001';
    }
    
    // Check if we're on a different port than API (common in some deployments)
    const currentPort = window.location.port;
    if (currentPort === '8080' || currentPort === '5173') {
      // Likely a dev server, API probably on 3001
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    
    // Same origin
    return window.location.origin;
  }
  
  // In development, try localhost:3001
  return 'http://localhost:3001';
};

// API base URL
const API_BASE_URL = getApiBaseUrl();

class SyncService {
  syncInterval: number | null = null;
  lastSyncTime: Record<string, string> = {};
  keysToSync: Set<string> = new Set();
  syncing: boolean = false;
  
  // Initialize the sync service
  init() {
    if (this.syncInterval) {
      // Already initialized
      return;
    }
    
    // Start the sync interval
    this.syncInterval = window.setInterval(() => {
      this.performSync();
    }, 30000); // Sync every 30 seconds
    
    // Register unload event to sync before page is closed
    window.addEventListener('beforeunload', () => {
      this.performSync(true);
    });
    
    console.log('SyncService initialized');
  }
  
  // Stop the sync service
  stop() {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Register a key to be synced
  registerKey(key: string) {
    this.keysToSync.add(key);
  }
  
  // Remove a key from syncing
  unregisterKey(key: string) {
    this.keysToSync.delete(key);
  }
  
  // Perform sync with the server
  async performSync(immediate: boolean = false) {
    // Don't sync if another sync is in progress
    if (this.syncing) return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    // No keys to sync
    if (this.keysToSync.size === 0) return;
    
    this.syncing = true;
    
    try {
      // First, check which keys need updating from the server
      const keysArray = Array.from(this.keysToSync);
      
      // Fetch timestamps from server
      const timestampResponse = await fetch(`${API_BASE_URL}/api/data/sync/timestamps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ keys: keysArray })
      });
      
      if (!timestampResponse.ok) {
        throw new Error(`Server responded with ${timestampResponse.status}`);
      }
      
      const timestamps = await timestampResponse.json();
      const keysToDownload: string[] = [];
      
      // Determine which keys need updating
      Object.entries(timestamps).forEach(([key, timestamp]) => {
        if (timestamp && (!this.lastSyncTime[key] || this.lastSyncTime[key] < timestamp as string)) {
          keysToDownload.push(key);
        }
      });
      
      // If there are keys to download, fetch them
      if (keysToDownload.length > 0) {
        const dataResponse = await fetch(`${API_BASE_URL}/api/data/sync/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ keys: keysToDownload })
        });
        
        if (!dataResponse.ok) {
          throw new Error(`Server responded with ${dataResponse.status}`);
        }
        
        const batchData = await dataResponse.json();
        
        // Update local storage with the downloaded data
        Object.entries(batchData).forEach(([key, value]) => {
          if (value !== null) {
            try {
              // Extract user ID (simple implementation - in production use proper JWT parsing)
              let userId = 'user';
              try {
                // Try to get user ID from token if it's a JWT
                if (authToken.includes('.')) {
                  const payload = JSON.parse(atob(authToken.split('.')[1]));
                  userId = payload.sub || payload.userId || 'user';
                }
              } catch (e) {
                console.error('Error parsing auth token:', e);
              }
              
              // Update localStorage with server data
              localStorage.setItem(`${userId}_${key}`, JSON.stringify(value));
              
              // Update last sync time
              if (timestamps[key]) {
                this.lastSyncTime[key] = timestamps[key] as string;
              }
              
              // Inform about sync (only for immediate syncs)
              if (immediate && keysToDownload.length > 0) {
                toast.info(`Synchronized data from server (${keysToDownload.length} items)`);
              }
            } catch (error) {
              console.error(`Error updating local data for ${key}:`, error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (immediate) {
        toast.error('Failed to synchronize with server');
      }
    } finally {
      this.syncing = false;
    }
  }
  
  // Trigger an immediate sync
  async syncNow() {
    return this.performSync(true);
  }
}

// Create singleton instance
const syncService = new SyncService();

export default syncService;