
// Define the API base URL with correct path prefix for all API requests
export const getApiBaseUrl = (): string => {
  // For production environments
  if (process.env.NODE_ENV === 'production') {
    // Use /api path prefix for the Cloudflare tunnel configuration
    return `${window.location.origin}/api`;
  }
  
  // For custom domains like habit.j551n.com
  if (window.location.hostname === 'habit.j551n.com') {
    // For this domain, we return the origin without /api suffix
    // The endpoint function will handle the proper path construction
    return window.location.origin;
  }
  
  // For local development
  // Check if accessing from a mobile device on the same network
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${window.location.origin}/api`;
  }
  
  // Default for localhost
  return 'http://localhost:3001';
};

// Enhanced logging function
const logApiCall = (message: string, data?: any) => {
  console.log(`[API] ${message}`, data ? data : '');
};

// Helper function to make data requests with retry logic for custom domain
export const fetchData = async <T>(key: string): Promise<T | null> => {
  const apiBaseUrl = getApiBaseUrl();
  
  // Ensure the key matches patterns recognized by the server
  const formattedKey = ensureValidKey(key);
  const isCustomDomain = window.location.hostname === 'habit.j551n.com';
  const isRecognizedKey = isRecognizedPattern(formattedKey);
  
  // Create an array of endpoints to try in order
  const endpointsToTry = [];
  
  if (isCustomDomain) {
    // For custom domain, try these patterns in order
    if (isRecognizedKey) {
      // Direct access without /api prefix for recognized patterns
      endpointsToTry.push(`${apiBaseUrl}/${formattedKey}`);
    }
    
    // With /api prefix
    endpointsToTry.push(`${apiBaseUrl}/api/${formattedKey}`);
    
    // Try with data prefix as fallback
    if (!formattedKey.startsWith('data/')) {
      endpointsToTry.push(`${apiBaseUrl}/api/data/${formattedKey.replace('data/', '')}`);
    }
  } else {
    // Standard endpoint for other environments
    endpointsToTry.push(`${apiBaseUrl}/${formattedKey}`);
  }
  
  logApiCall(`Trying to fetch data for key: ${key}`);
  logApiCall(`Endpoints to try: ${JSON.stringify(endpointsToTry)}`);
  
  let lastError = null;
  
  // Try each endpoint in sequence until one works
  for (const endpoint of endpointsToTry) {
    try {
      logApiCall(`Fetching from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        logApiCall(`Endpoint ${endpoint} responded with ${response.status}`);
        lastError = new Error(`Server responded with ${response.status}`);
        continue; // Try the next endpoint
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logApiCall(`Expected JSON response but got ${contentType}`);
        lastError = new Error(`Expected JSON response but got ${contentType}`);
        continue; // Try the next endpoint
      }
      
      const data = await response.json();
      logApiCall(`Successfully fetched data from ${endpoint}`, { keyLength: key.length, hasData: !!data });
      return data;
    } catch (error) {
      logApiCall(`Error fetching from ${endpoint}:`, error);
      lastError = error;
      // Continue to the next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  if (lastError) {
    throw lastError;
  }
  
  return null;
};

// Helper function to save data with retry logic for custom domain
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  const apiBaseUrl = getApiBaseUrl();
  
  // Ensure the key matches patterns recognized by the server
  const formattedKey = ensureValidKey(key);
  const isCustomDomain = window.location.hostname === 'habit.j551n.com';
  const isRecognizedKey = isRecognizedPattern(formattedKey);
  
  // Create an array of endpoints to try in order
  const endpointsToTry = [];
  
  if (isCustomDomain) {
    // For custom domain, try these patterns in order
    if (isRecognizedKey) {
      // Direct access without /api prefix for recognized patterns
      endpointsToTry.push(`${apiBaseUrl}/${formattedKey}`);
    }
    
    // With /api prefix
    endpointsToTry.push(`${apiBaseUrl}/api/${formattedKey}`);
    
    // Try with data prefix as fallback
    if (!formattedKey.startsWith('data/')) {
      endpointsToTry.push(`${apiBaseUrl}/api/data/${formattedKey.replace('data/', '')}`);
    }
  } else {
    // Standard endpoint for other environments
    endpointsToTry.push(`${apiBaseUrl}/${formattedKey}`);
  }
  
  logApiCall(`Trying to save data for key: ${key}`);
  logApiCall(`Endpoints to try: ${JSON.stringify(endpointsToTry)}`);
  
  let lastError = null;
  
  // Try each endpoint in sequence until one works
  for (const endpoint of endpointsToTry) {
    try {
      logApiCall(`Saving to: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      
      if (!response.ok) {
        logApiCall(`Endpoint ${endpoint} responded with ${response.status}`);
        lastError = new Error(`Server responded with ${response.status}`);
        continue; // Try the next endpoint
      }
      
      logApiCall(`Successfully saved data to ${endpoint}`);
      return; // Success, exit the function
    } catch (error) {
      logApiCall(`Error saving to ${endpoint}:`, error);
      lastError = error;
      // Continue to the next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  if (lastError) {
    throw lastError;
  }
};

// Helper function to check if a key is a recognized pattern
export const isRecognizedPattern = (key: string): boolean => {
  return (
    key.startsWith('zen-tracker-') || 
    key.startsWith('calendar-') || 
    key === 'habits' || 
    key === 'tasks'
  );
};

// Helper function to ensure keys match the patterns recognized by the server
export const ensureValidKey = (key: string): string => {
  // If it's already a recognized pattern, return as is
  if (isRecognizedPattern(key)) {
    return key;
  }
  
  // Otherwise, prefix with 'data/' to use the more permissive route
  return `data/${key}`;
};
