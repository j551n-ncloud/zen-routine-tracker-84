
// SQLite REST API configuration
const config = {
  // SQLite REST API connection details from environment variables
  sqliteRest: {
    url: import.meta.env.VITE_SQLITE_REST_URL || 'http://localhost:8080',
    database: import.meta.env.VITE_SQLITE_DATABASE || '/data/zentracker.db',
    // Don't force mock mode in browser environment
    forceMockInBrowser: false
  }
};

export default config;
