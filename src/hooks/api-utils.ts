
// Define the API base URL with correct path prefix for all API requests
export const getApiBaseUrl = (): string => {
  // For production environments
  if (process.env.NODE_ENV === 'production') {
    // Use /api path prefix for the Cloudflare tunnel configuration
    return `${window.location.origin}/api`;
  }
  
  // For custom domains like habit.j551n.com
  if (window.location.hostname === 'habit.j551n.com') {
    return `${window.location.origin}/api`;
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
  console.log(`Fetching data from: ${apiBaseUrl}/${key}`);
  
  const response = await fetch(`${apiBaseUrl}/${key}`);
  
  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType}`);
  }
  
  return await response.json();
};

// Helper function to save data
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  const apiBaseUrl = getApiBaseUrl();
  console.log(`Saving data to: ${apiBaseUrl}/${key}`);
  
  const response = await fetch(`${apiBaseUrl}/${key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
  
  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }
};
