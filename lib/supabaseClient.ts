import { createClient } from '@supabase/supabase-js';

// Hardcoding the keys temporarily to completely bypass Vercel's caching bug
const supabaseUrl = 'https://qwuurofqumhoiikumxlg.supabase.co';
const supabaseAnonKey = 'sb_publishable_LPouw16DZly6LqleGNFp-Q_sbx3JD-B';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
