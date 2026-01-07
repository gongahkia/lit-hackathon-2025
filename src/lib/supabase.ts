/**
 * Re-export supabase client from root lib directory
 * This allows @/lib/supabase imports to work correctly
 */

export { supabase, getSupabaseAdmin } from '../../lib/supabase';

