
// Configuration for backend services
const config = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://wpbmlyfwfvedfmvtuehd.supabase.co',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYm1seWZ3ZnZlZGZtdnR1ZWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTI5MTUsImV4cCI6MjA1NzUyODkxNX0.igFY12tH6xhCf7aobI192fkVhUcGwGxcpiw1p0prdsk',
    forceMockIfMissing: false
  }
};

export default config;
