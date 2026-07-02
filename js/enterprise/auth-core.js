import { supabase } from '../config/supabase.js';

export const AuthCore = {
    session: null,

    async init(requireAdmin = false) {
        const stored = localStorage.getItem('enterprise_session');
        if (stored) {
            this.session = JSON.parse(stored);
            if (requireAdmin && this.session.user.role !== 'super_admin') {
                window.location.href = 'index.html'; 
            }
            if(document.getElementById('auth-guard')) document.getElementById('auth-guard').style.display = 'none';
            if(document.getElementById('admin-name')) document.getElementById('admin-name').innerText = this.session.user.username;
            return true;
        } else {
            if (requireAdmin) window.location.href = 'index.html';
            return false;
        }
    },

    async login(username, password) {
        try {
            const { data, error } = await supabase.rpc('login_user', { p_username: username, p_password: password });
            if (error) throw error;
            if (data && data.success) {
                localStorage.setItem('enterprise_session', JSON.stringify(data));
                localStorage.setItem('waybill_active_user', data.user.username);
                localStorage.setItem('waybill_branch_prefix', data.branch.code);
                localStorage.setItem('waybill_branch_title', data.branch.name);
                localStorage.setItem(`awb_counter_${data.branch.code}`, data.branch.start_seq);
                return { success: true, data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (e) {
            console.error(e);
            return { success: false, error: "حدث خطأ في الاتصال بالخادم" };
        }
    },

    logout() {
        localStorage.removeItem('enterprise_session');
        localStorage.removeItem('waybill_active_user');
        window.location.href = 'index.html';
    }
};
window.AuthCore = AuthCore;
