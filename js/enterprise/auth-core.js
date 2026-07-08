import { supabase } from '../config/supabase.js';

export const AuthCore = {
    session: null,

    async init() {
        const stored = localStorage.getItem('enterprise_session');
        if (stored) {
            this.session = JSON.parse(stored);
            
            // السماح للمدير العام أو مدير الفرع/المستخدم إذا كانت لديه صلاحيات لوحة الإدارة
            const adminAllowed = await this.canOpenAdminPanel();
            if (!adminAllowed) {
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


    async canOpenAdminPanel() {
        try {
            if (this.session?.user?.role === 'super_admin') return true;
            const username = this.session?.user?.username;
            if (!username) return false;
            const { data } = await supabase.from('user_permissions').select('*').eq('username', username).maybeSingle();
            if (data) {
                localStorage.setItem('enterprise_user_permissions', JSON.stringify(data));
                return !!(data.can_view_reports || data.can_delete_request || data.can_manage_users || data.can_manage_branches || data.can_edit_fields);
            }
            return this.session?.user?.role === 'branch_manager';
        } catch (e) {
            console.warn('فشل قراءة صلاحيات لوحة الإدارة:', e);
            return this.session?.user?.role === 'branch_manager';
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
