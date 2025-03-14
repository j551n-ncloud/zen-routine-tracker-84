
// Configuration for backend services
const config = {
  // SQLite REST API configuration (deprecated, using Supabase instead)
  sqliteRest: {
    url: import.meta.env.VITE_SQLITE_REST_URL || 'http://localhost:8080',
    database: import.meta.env.VITE_SQLITE_DATABASE || '/data/zentracker.db',
    forceMockInBrowser: false
  },
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    // Fallback to mock mode if Supabase config is missing
    forceMockIfMissing: true
  }
};

export default config;
