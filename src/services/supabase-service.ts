import { createClient } from '@supabase/supabase-js';
import config from './api-config';
import { toast } from 'sonner';

// Create Supabase client
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

// Create the client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize the Supabase connection
export async function initSupabase(): Promise<boolean> {
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
    throw error;
  }
}

// Store data
export async function saveData(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabase
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
    throw error;
  }
}

// Get data
export async function getData(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
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
    throw error;
  }
}

// Execute a query (for auth and other operations)
export async function executeQuery<T>(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  params: any = {}
): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }
  
  try {
    let queryBuilder = supabase.from(table);
    
    switch (operation) {
      case 'select': {
        const query = queryBuilder.select(params.select || '*');
        
        // Apply filters
        if (params.eq) {
          Object.entries(params.eq).forEach(([key, value]) => {
            query.eq(key, value as string);
          });
        }
        
        if (params.limit) {
          query.limit(params.limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data as T;
      }
        
      case 'insert': {
        const { data, error } = await queryBuilder.insert(params.data);
        if (error) throw error;
        return data as T;
      }
        
      case 'update': {
        let query = queryBuilder.update(params.data);
        if (params.eq) {
          Object.entries(params.eq).forEach(([key, value]) => {
            query = query.eq(key, value as string);
          });
        }
        const { data, error } = await query;
        if (error) throw error;
        return data as T;
      }
        
      case 'delete': {
        let query = queryBuilder.delete();
        if (params.eq) {
          Object.entries(params.eq).forEach(([key, value]) => {
            query = query.eq(key, value as string);
          });
        }
        const { data, error } = await query;
        if (error) throw error;
        return data as T;
      }
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Supabase query error (${table}.${operation}):`, error);
    throw error;
  }
}
