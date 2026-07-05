// js/config/supabase.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// بيانات الربط المستخرجة من مشروعك (Durrat_ERP_V2)
const SUPABASE_URL = 'https://axwzvrrvlnyeoiffvbck.supabase.co';
const SUPABASE_ANON_KEY = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d3p2cnJ2bG55ZW9pZmZ2YmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTY3OTQsImV4cCI6MjA5ODc3Mjc5NH0.loth7vSqVdbEoueaAI45zC4NbIXx29Zi0eeMCc43YJg';

// إنشاء كائن الاتصال الموحد
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// إتاحته عالمياً لتسهيل التعامل معه في أجزاء النظام الأخرى
window.supabase = supabase;
