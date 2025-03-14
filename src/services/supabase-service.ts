import { createClient } from '@supabase/supabase-js';
import config from './api-config';
import { toast } from 'sonner';

// Create Supabase client
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

// Check if Supabase configuration is valid
const hasValidConfig = supabaseUrl && supabaseKey;

// Create the client if we have valid config
export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Mock mode state
let mockMode = !hasValidConfig;

// Check if in mock mode
export function isMockMode(): boolean {
  return mockMode;
}

// Set mock mode explicitly
export function setMockMode(value: boolean): void {
  console.log(`Setting mock mode to: ${value}`);
  mockMode = value;
  
  // Save the setting to localStorage if in browser
  if (typeof window !== 'undefined') {
    localStorage.setItem('zentracker-mock-mode', value.toString());
  }
}

// Initialize the Supabase connection
export async function initSupabase(): Promise<boolean> {
  // Check for localStorage setting first
  if (typeof window !== 'undefined') {
    const storedMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    if (storedMockMode) {
      console.log('Mock mode enabled from localStorage settings');
      setMockMode(true);
      return true;
    }
  }
  
  // If already in mock mode, return
  if (mockMode) {
    console.log('Mock mode is enabled, skipping Supabase connection');
    return true;
  }
  
  // Check if Supabase client was created
  if (!supabase) {
    console.error('Supabase client not initialized - missing URL or API key');
    setMockMode(true);
    return false;
  }
  
  try {
    // Test the Supabase connection with a simple query
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        // This is expected if the table doesn't exist but connection works
        console.log('Supabase connection successful (table does not exist but that\'s expected)');
        return true;
      }
      
      // For other errors, check if it's just permissions or real connection issue
      if (error.code.startsWith('PGRST')) {
        // PostgREST error - connection works but permissions issue
        console.log('Supabase connected but with permissions error:', error.message);
        return true;
      }
      
      // Other errors mean connection failed
      throw error;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    toast.error('Failed to connect to Supabase. Switching to mock mode.');
    setMockMode(true);
    return false;
  }
}

// Mock storage (used in mock mode)
const mockStorage = new Map<string, any>();

// Store data (using either Supabase or mock storage)
export async function saveData(key: string, value: any): Promise<void> {
  if (mockMode) {
    console.log('Mock saveData:', { key, value });
    
    if (value === null || value === undefined) {
      // Remove from mock storage
      mockStorage.delete(key);
      
      // Also clean up from localStorage if available
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      // Store in mock storage
      mockStorage.set(key, value);
      
      // Also store in localStorage if available
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    return;
  }
  
  try {
    const { error } = await supabase!
      .from('key_value_store')
      .upsert({ 
        key: key, 
        value: value === null ? null : JSON.stringify(value),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'key' 
      });
      
    if (error) throw error;
  } catch (error) {
    console.error(`Error saving data to Supabase for key ${key}:`, error);
    // Fall back to mock implementation
    setMockMode(true);
    return saveData(key, value);
  }
}

// Get data (from either Supabase or mock storage)
export async function getData(key: string): Promise<any> {
  if (mockMode) {
    console.log('Mock getData:', { key });
    
    // First check our in-memory mock storage
    if (mockStorage.has(key)) {
      return mockStorage.get(key);
    }
    
    // Then check localStorage if available
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // Cache it in our mock storage
          mockStorage.set(key, parsed);
          return parsed;
        } catch (error) {
          console.error('Error parsing data from localStorage:', error);
        }
      }
    }
    
    return null;
  }
  
  try {
    const { data, error } = await supabase!
      .from('key_value_store')
      .select('value')
      .eq('key', key)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST104') {
        // Table or row doesn't exist
        return null;
      }
      throw error;
    }
    
    return data.value ? JSON.parse(data.value) : null;
  } catch (error) {
    console.error(`Error retrieving data from Supabase for key ${key}:`, error);
    // Fall back to mock implementation
    setMockMode(true);
    return getData(key);
  }
}

// Execute a query (for auth and other operations)
export async function executeQuery<T>(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  params: any = {}
): Promise<T> {
  if (mockMode) {
    console.log('Mock executeQuery:', { table, operation, params });
    
    // Handle login query in mock mode
    if (table === 'users' && operation === 'select' && params.eq?.username) {
      const username = params.eq.username;
      const password = params.eq.password;
      
      // Only allow login for admin/admin or if username and password match
      if ((username === 'admin' && password === 'admin') || (username === password)) {
        const isAdmin = username.toLowerCase() === 'admin';
        
        // Mock user authentication
        const mockResult = [{
          username: username,
          is_admin: isAdmin ? 1 : 0
        }] as unknown as T;
        
        return mockResult;
      }
      
      return [] as unknown as T;
    }
    
    // For other queries, return empty result
    return [] as unknown as T;
  }
  
  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }
  
  try {
    let query = supabase.from(table);
    
    switch (operation) {
      case 'select':
        query = query.select(params.select || '*');
        
        // Apply filters
        if (params.eq) {
          Object.entries(params.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        if (params.limit) {
          query = query.limit(params.limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data as T;
        
      case 'insert':
        const { data: insertData, error: insertError } = await query.insert(params.data);
        if (insertError) throw insertError;
        return insertData as T;
        
      case 'update':
        const { data: updateData, error: updateError } = await query
          .update(params.data)
          .eq(params.eq.column, params.eq.value);
        if (updateError) throw updateError;
        return updateData as T;
        
      case 'delete':
        const { data: deleteData, error: deleteError } = await query
          .delete()
          .eq(params.eq.column, params.eq.value);
        if (deleteError) throw deleteError;
        return deleteData as T;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Supabase query error (${table}.${operation}):`, error);
    throw error;
  }
}
