import { createClient } from '@supabase/supabase-js';

// These will be automatically provided by Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface AnalysisHistory {
  id: string;
  user_id: string;
  filename: string;
  model: string;
  results: any;
  confidence: number;
  image_url: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'dark' | 'light';
  language: string;
  confidence_threshold: number;
  default_model: string;
  notifications_enabled: boolean;
  updated_at: string;
}