import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgplactosejbywduljdc.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZZPfuoWQGlIHNoJhw4wfSw_UnjXGWBb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
