// js/config/supabase.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// بيانات مشروع Supabase
const SUPABASE_URL = 'https://axwzvrrvlnyeoiffvbck.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_zWOKl4ND4TSzKlTnQAu70A_DSJkVu8B';

// إنشاء الاتصال
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// للتصحيح
window.supabase = supabase;