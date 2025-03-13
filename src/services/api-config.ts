
// API configuration
const apiBaseUrl = import.meta.env.VITE_SQLITE_API_URL || '/api';

export default {
  baseUrl: apiBaseUrl,
  endpoints: {
    status: `${apiBaseUrl}/status`,
    query: `${apiBaseUrl}/query`,
    execute: `${apiBaseUrl}/execute`
  }
};
