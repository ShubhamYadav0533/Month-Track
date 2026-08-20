import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kgjixulwpzurcedwwnor.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnaml4dWx3cHp1cmNlZHd3bm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjQ3NzQsImV4cCI6MjEwMTUwMDc3NH0.AyR8ajQAmQ0BR8Qh7pEj57wli2AVk74Ll9JQoj1rW-o';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

