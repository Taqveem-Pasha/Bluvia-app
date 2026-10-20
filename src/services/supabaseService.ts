import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dbStorage } from '../db/indexedDB';
import { BusinessSettings } from '../types';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl: string | null = null;
  private currentKey: string | null = null;

  constructor() {
    this.initFromSettings();
  }

  private async initFromSettings() {
    try {
      const settings = await dbStorage.getById<BusinessSettings>('settings', 'business_settings');
      if (settings?.supabaseUrl && settings?.supabaseAnonKey) {
        this.configure(settings.supabaseUrl, settings.supabaseAnonKey);
      }
    } catch {
      // offline or not seeded yet
    }
  }

  public configure(url: string, anonKey: string): boolean {
    if (!url || !anonKey) return false;
    try {
      this.client = createClient(url, anonKey);
      this.currentUrl = url;
      this.currentKey = anonKey;
      return true;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return false;
    }
  }

  public isConfigured(): boolean {
    return !!this.client && !!this.currentUrl && !!this.currentKey;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Tests the Supabase connection by pinging the profiles or products table
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return {
        success: false,
        message: 'Supabase is not configured yet. Please enter your Project URL and Anon Public Key in Settings.',
      };
    }

    try {
      const { error } = await this.client.from('products').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        return {
          success: false,
          message: `Connection test response: ${error.message} (Code: ${error.code})`,
        };
      }
      return {
        success: true,
        message: 'Successfully connected to Supabase PostgreSQL database!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network error: ${err.message || 'Could not reach Supabase endpoint'}`,
      };
    }
  }
}

export const supabaseService = new SupabaseService();
