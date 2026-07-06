import { supabase } from '../config/supabase.js';

export const AuthCore = {
    session: null,

    async init() {
        const stored = localStorage.getItem('enterprise_session');
        if (stored) {
            this.session = JSON.parse(stored);
            
            // طرد أي شخص ليس لديه صلاحية "مدير نظام"
            if (this.session.user.role !== 'super_admin') {
                window.location.replace('index.html?v=' + Date.now()); 
                return false;
            }
            
            // إخفاء شاشة التحميل السينمائية بعد نجاح التحقق
            const guard = document.getElementById('auth-guard');
            if(guard) {
                guard.style.opacity = '0';
                setTimeout(() => guard.style.display = 'none', 500);
            }
            
            // وضع اسم المدير في الشريط العلوي
            const nameEl = document.getElementById('admin-name');
            if(nameEl) nameEl.innerText = this.session.user.username;
            
            return true;
        } else {
            window.location.replace('index.html?v=' + Date.now());
            return false;
        }
    },

    logout() {
        localStorage.removeItem('enterprise_session');
        localStorage.removeItem('waybill_active_user');
        window.location.replace('index.html?v=' + Date.now());
    }
};

// جعل الكائن متاحاً للواجهة
window.AuthCore = AuthCore;
