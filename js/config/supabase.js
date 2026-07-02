const SUPABASE_URL = 'https://nysjhyfidbtptnfmgcnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2poeWZpZGJ0cHRuZm1nY25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjQzMjAsImV4cCI6MjA5ODE0MDMyMH0.KNfsZNGhTdQUv_bctNFJ0hLN0d0rycxm91KosyDfWp0';

// إنشاء كائن الاتصال
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
