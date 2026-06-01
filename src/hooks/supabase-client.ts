import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://yoyscueorzeapqolutvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveXNjdWVvcnplYXBxb2x1dHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzE1MjQsImV4cCI6MjA5NTAwNzUyNH0.t5OBmTQto4435r9ilfjO3TMPyxEdDB001v0E6C63bNI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

