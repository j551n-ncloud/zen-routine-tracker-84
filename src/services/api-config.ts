
// API configuration
const apiBaseUrl = import.meta.env.VITE_SQLITE_API_URL || 'http://sqlite:3000/api';

export default {
  baseUrl: apiBaseUrl,
  endpoints: {
    status: `${apiBaseUrl}/status`,
    query: `${apiBaseUrl}/query`,
    execute: `${apiBaseUrl}/execute`
  }
};
