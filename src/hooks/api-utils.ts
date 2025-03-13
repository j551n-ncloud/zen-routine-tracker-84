
// Define the API base URL with correct path prefix for all API requests
export const getApiBaseUrl = (): string => {
  // For production environments
  if (process.env.NODE_ENV === 'production') {
    // Use /api path prefix for the Cloudflare tunnel configuration
    return `${window.location.origin}/api`;
  }
  
  // For custom domains like habit.j551n.com
  if (window.location.hostname === 'habit.j551n.com') {
    // Make sure we're using the right path format for this domain
    return `${window.location.origin}`;
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

// Helper function to make data requests
export const fetchData = async <T>(key: string): Promise<T | null> => {
  const apiBaseUrl = getApiBaseUrl();
  
  // Ensure the key matches patterns recognized by the server
  const formattedKey = ensureValidKey(key);
  let endpoint = '';
  
  // For the custom domain, we need a different endpoint structure
  if (window.location.hostname === 'habit.j551n.com') {
    endpoint = `${apiBaseUrl}/api/${formattedKey}`;
  } else {
    endpoint = `${apiBaseUrl}/${formattedKey}`;
  }
  
  console.log(`Fetching data from: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Expected JSON response but got ${contentType}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to save data
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  const apiBaseUrl = getApiBaseUrl();
  
  // Ensure the key matches patterns recognized by the server
  const formattedKey = ensureValidKey(key);
  let endpoint = '';
  
  // For the custom domain, we need a different endpoint structure
  if (window.location.hostname === 'habit.j551n.com') {
    endpoint = `${apiBaseUrl}/api/${formattedKey}`;
  } else {
    endpoint = `${apiBaseUrl}/${formattedKey}`;
  }
  
  console.log(`Saving data to: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
  } catch (error) {
    console.error(`Error saving to ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to ensure keys match the patterns recognized by the server
export const ensureValidKey = (key: string): string => {
  // These are the key formats the server recognizes directly in routes.js
  const isRecognizedPattern = 
    key.startsWith('zen-tracker-') || 
    key.startsWith('calendar-') || 
    key === 'habits' || 
    key === 'tasks';
  
  // If it's already a recognized pattern, return as is
  if (isRecognizedPattern) {
    return key;
  }
  
  // Otherwise, prefix with 'data/' to use the more permissive route
  return `data/${key}`;
};
