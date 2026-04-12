import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

console.log('--- SUPABASE CONFIG INIT ---');
console.log('URL:', supabaseUrl ? 'Loaded: ' + supabaseUrl : 'MISSING');
console.log('KEY:', supabaseAnonKey ? 'Loaded (Length: ' + supabaseAnonKey.length + ')' : 'MISSING');
console.log('----------------------------');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
