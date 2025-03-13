
// Storage configuration
const config = {
  // App data storage configuration
  storage: {
    // Use local storage by default
    useLocalStorage: true,
    
    // Data directory path (for docker volume in server environment)
    dataPath: '/app/data',
    
    // Determines if we should attempt to use server storage for data synchronization
    tryServerStorage: false, // Not implemented yet - would require a real backend
    
    // Information about data persistence
    persistenceInfo: {
      message: "Data is currently stored in browser's local storage and will not sync across devices.",
      infoUrl: "/settings"
    }
  }
};

export default config;
