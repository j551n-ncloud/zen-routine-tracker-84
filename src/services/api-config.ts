
// Database configuration
const config = {
  // Database connection details from environment variables
  db: {
    host: import.meta.env.VITE_MARIADB_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_MARIADB_PORT || '3306'),
    user: import.meta.env.VITE_MARIADB_USER || 'zentracker',
    password: import.meta.env.VITE_MARIADB_PASSWORD || 'zentracker',
    database: import.meta.env.VITE_MARIADB_DATABASE || 'zentracker'
  }
};

export default config;
