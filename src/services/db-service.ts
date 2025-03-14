
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import config from './api-config';

// Type definitions for different responses from the database
export interface KeyValueData {
  key_name: string;
  value_data: string;
}

export interface CountResult {
  count: number;
}

// Table names as literal types to match Supabase type system
type TableName = 'key_value_store' | 'users' | 'profiles' | 'tasks' | 'habits' | 'habit_completions';

// State variables
let mockMode = false;

// Detect if running in browser environment
const isBrowser = typeof window !== 'undefined';

// Check if environment is mock mode
export function isMockMode(): boolean {
  return mockMode;
}

// Set mock mode explicitly
export function setMockMode(value: boolean): void {
  console.log(`Setting mock mode to: ${value}`);
  mockMode = value;
  
  // Save the setting to localStorage if in browser
  if (isBrowser) {
    localStorage.setItem('zentracker-mock-mode', value.toString());
  }
}

// Execute SQL queries using Supabase
export async function executeQuery<T>(
  table: TableName,
  action: 'select' | 'insert' | 'update' | 'delete',
  data?: any,
  filters?: Record<string, any>
): Promise<T> {
  try {
    console.log(`Executing Supabase query:`, { table, action, data, filters });
    
    let query;
    
    switch (action) {
      case 'select':
        query = supabase.from(table).select('*');
        break;
      case 'insert':
        return await supabase.from(table).insert(data).select() as unknown as T;
      case 'update':
        return await supabase.from(table).update(data).match(filters || {}).select() as unknown as T;
      case 'delete':
        return await supabase.from(table).delete().match(filters || {}) as unknown as T;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    
    // Apply filters if provided
    if (filters && action === 'select') {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data: result, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return result as unknown as T;
  } catch (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
}

// Store data in key-value format
export async function saveData(key: string, value: any): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    
    // Check if key exists
    const { data: existingData } = await supabase
      .from('key_value_store')
      .select('*')
      .eq('key_name', key)
      .single();
    
    if (existingData) {
      // Update existing key
      await supabase
        .from('key_value_store')
        .update({ value_data: serializedValue })
        .eq('key_name', key);
    } else {
      // Insert new key
      await supabase
        .from('key_value_store')
        .insert({ key_name: key, value_data: serializedValue });
    }
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    toast.error(`Failed to save data for key ${key}`);
    throw error;
  }
}

// Retrieve data from key-value store
export async function getData(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('key_value_store')
      .select('value_data')
      .eq('key_name', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      throw error;
    }
    
    if (data && data.value_data) {
      return JSON.parse(data.value_data);
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return null;
  }
}

// Create default admin user if no users exist
export async function createDefaultUserIfNeeded(): Promise<boolean> {
  try {
    console.log('Checking if default admin user needs to be created...');
    
    // Check if any users exist
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    // If no users exist, create a default admin user
    if (!existingUsers || existingUsers.length === 0) {
      console.log('No users found, creating default admin user...');
      
      // First, create the auth user
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'admin123',
      });
      
      if (authError) {
        throw authError;
      }
      
      if (authUser && authUser.user) {
        console.log('Created auth user:', authUser.user.id);
        
        // Then, insert into users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            username: 'admin',
            password: 'admin123', // This is just for reference, actual auth happens via Supabase Auth
            is_admin: true
          });
          
        if (userError) {
          throw userError;
        }
        
        console.log('Default admin user created successfully');
        toast.success('Default admin user created (admin/admin123)');
        return true;
      }
    } else {
      console.log('Users already exist, skipping default user creation');
    }
    
    return false;
  } catch (error) {
    console.error('Error creating default admin user:', error);
    toast.error('Failed to create default admin user');
    return false;
  }
}

// Initialize the database - check if Supabase is available
export async function initDatabase(): Promise<boolean> {
  // Check for localStorage setting first
  if (isBrowser) {
    const storedMockMode = localStorage.getItem('zentracker-mock-mode') === 'true';
    if (storedMockMode) {
      console.log('Mock mode enabled from localStorage settings');
      setMockMode(true);
      return true;
    }
  }
  
  // Don't automatically use mock mode in browser anymore
  // Only use mock mode if explicitly set
  if (mockMode) {
    console.log('Mock mode is enabled, skipping database connection');
    return true;
  }
  
  try {
    console.log('Attempting to connect to Supabase at:', config.supabase.url);
    // Test the Supabase connection with a simple query
    const { data, error } = await supabase.from('key_value_store').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('Successfully connected to Supabase');
    
    // Create default admin user if needed
    await createDefaultUserIfNeeded();
    
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    toast.error('Failed to connect to database. Switching to mock mode.');
    setMockMode(true);
    return false;
  }
}
