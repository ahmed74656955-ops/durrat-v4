import { supabase } from '../config/supabase.js';

export const AuthCore = {
    session: null,

    async init() {
        const stored = localStorage.getItem('enterprise_session');
        if (!stored) {
            window.location.replace('index.html?v=' + Date.now());
            return false;
        }

        try {
            this.session = JSON.parse(stored);
        } catch {
            localStorage.removeItem('enterprise_session');
            window.location.replace('index.html?v=' + Date.now());
            return false;
        }

        if (!this.session?.user || this.session.user.role !== 'super_admin') {
            window.location.replace('index.html?v=' + Date.now());
            return false;
        }

        const guard = document.getElementById('auth-guard');
        if (guard) {
            guard.style.opacity = '0';
            setTimeout(() => guard.style.display = 'none', 500);
        }

        const nameEl = document.getElementById('admin-name');
        if (nameEl) nameEl.innerText = this.session.user.username;
        return true;
    },

    async log(action, details = {}) {
        try {
            const session = this.session || JSON.parse(localStorage.getItem('enterprise_session') || '{}');
            await supabase.rpc('log_app_event', {
                p_username: session?.user?.username || localStorage.getItem('waybill_active_user') || 'unknown',
                p_role: session?.user?.role || 'unknown',
                p_branch_code: session?.branch?.code || localStorage.getItem('waybill_branch_prefix') || null,
                p_branch_name: session?.branch?.name || localStorage.getItem('waybill_branch_title') || null,
                p_action: action,
                p_entity: 'auth',
                p_entity_id: session?.user?.username || null,
                p_details: details,
                p_user_agent: navigator.userAgent
            });
        } catch(e) { console.warn('تعذر تسجيل العملية:', e); }
    },

    async logout() {
        await this.log('logout', { from: 'admin.html' });
        localStorage.removeItem('enterprise_session');
        localStorage.removeItem('waybill_active_user');
        window.location.replace('index.html?v=' + Date.now());
    }
};

window.AuthCore = AuthCore;
