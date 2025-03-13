
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

// Helper function to make data requests
export const fetchData = async <T>(key: string): Promise<T | null> => {
  const apiBaseUrl = getApiBaseUrl();
  
  // Ensure the key matches patterns recognized by the server
  const formattedKey = ensureValidKey(key);
  let endpoint = '';
  
  // For the custom domain, we need a different endpoint structure
  if (window.location.hostname === 'habit.j551n.com') {
    // Special handling for recognized patterns that can be accessed directly
    if (isRecognizedPattern(formattedKey)) {
      // Try direct access first (no /api prefix)
      endpoint = `${apiBaseUrl}/${formattedKey}`;
    } else {
      // For other keys, use the /api/data/ prefix
      endpoint = `${apiBaseUrl}/api/${formattedKey}`;
    }
  } else {
    // For other environments, just use the regular endpoint
    endpoint = `${apiBaseUrl}/${formattedKey}`;
  }
  
  console.log(`Fetching data from: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      // If the first attempt fails and we're on the custom domain,
      // try the alternative pattern as a fallback
      if (window.location.hostname === 'habit.j551n.com') {
        // If we tried direct access first, now try with /api prefix
        if (isRecognizedPattern(formattedKey) && !endpoint.includes('/api/')) {
          const alternateEndpoint = `${apiBaseUrl}/api/${formattedKey}`;
          console.log(`First attempt failed, trying alternate endpoint: ${alternateEndpoint}`);
          
          const alternateResponse = await fetch(alternateEndpoint);
          if (alternateResponse.ok) {
            return await alternateResponse.json();
          }
        }
      }
      
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
    // Special handling for recognized patterns that can be accessed directly
    if (isRecognizedPattern(formattedKey)) {
      // Try direct access first (no /api prefix)
      endpoint = `${apiBaseUrl}/${formattedKey}`;
    } else {
      // For other keys, use the /api/data/ prefix
      endpoint = `${apiBaseUrl}/api/${formattedKey}`;
    }
  } else {
    // For other environments, just use the regular endpoint
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
      // If the first attempt fails and we're on the custom domain,
      // try the alternative pattern as a fallback
      if (window.location.hostname === 'habit.j551n.com') {
        // If we tried direct access first, now try with /api prefix
        if (isRecognizedPattern(formattedKey) && !endpoint.includes('/api/')) {
          const alternateEndpoint = `${apiBaseUrl}/api/${formattedKey}`;
          console.log(`First attempt failed, trying alternate endpoint: ${alternateEndpoint}`);
          
          const alternateResponse = await fetch(alternateEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value }),
          });
          
          if (alternateResponse.ok) {
            return;
          }
        }
      }
      
      throw new Error(`Server responded with ${response.status}`);
    }
  } catch (error) {
    console.error(`Error saving to ${endpoint}:`, error);
    throw error;
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
