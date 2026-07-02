import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const AdminApp = {
    async init() {
        await AuthCore.init(true); 
        this.showSection('dashboard');
    },

    toast(msg, type='info') {
        const t = document.createElement('div'); t.className = `enterprise-toast`;
        t.style.borderLeft = `4px solid ${type === 'danger' ? '#ef4444' : '#10b981'}`;
        t.innerText = msg; document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    async showSection(section) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        event.currentTarget?.classList?.add('active');
        const area = document.getElementById('content-area');
        document.getElementById('page-title').innerText = section.toUpperCase();
        area.innerHTML = '<h3 style="text-align:center; color:#94a3b8; margin-top:50px;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</h3>';

        switch(section) {
            case 'branches': await this.renderBranches(area); break;
            case 'users': await this.renderUsers(area); break;
            case 'templates': await this.renderTemplates(area); break;
            case 'dashboard': default: this.renderDashboard(area); break;
        }
    },

    renderDashboard(area) {
        area.innerHTML = `
            <div class="grid-2">
                <div class="card"><h3 style="color:#2563eb;">نظرة عامة</h3><p>مرحباً بك في نظام الإدارة المؤسسي.</p></div>
                <div class="card"><h3 style="color:#10b981;">حالة النظام</h3><p>متصل بقاعدة البيانات (Supabase) بنجاح.</p></div>
            </div>
        `;
    },

    async renderBranches(area) {
        const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب الفروع", "danger");
        
        let html = `<div class="card"><h3>إدارة الفروع</h3>
        <table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>بداية التسلسل</th><th>الحالة</th></tr></thead><tbody>`;
        data.forEach(b => {
            html += `<tr><td>${b.code}</td><td>${b.name}</td><td>${b.start_seq}</td><td>${b.is_active ? 'نشط' : 'موقوف'}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async renderUsers(area) {
        const { data, error } = await supabase.from('app_users').select('*, branches(name)').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب المستخدمين", "danger");
        
        let html = `<div class="card"><h3>إدارة المستخدمين</h3>
        <table class="data-table"><thead><tr><th>المستخدم</th><th>الفرع</th><th>الصلاحية</th><th>الحالة</th></tr></thead><tbody>`;
        data.forEach(u => {
            html += `<tr><td>${u.username}</td><td>${u.branches?.name || '-'}</td><td>${u.role}</td><td>${u.is_active ? 'نشط' : 'موقوف'}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async renderTemplates(area) {
        const { data, error } = await supabase.from('waybill_field_templates').select('*');
        let html = `<div class="card"><h3>تخصيص الحقول (مركزياً)</h3>
        <table class="data-table"><thead><tr><th>معرف الحقل (ID)</th><th>الاسم الجديد (Label)</th><th>إجباري؟</th><th>مخفي؟</th><th>حفظ</th></tr></thead><tbody>`;
        
        const demoFields = ['consignee_name', 'shipper_name', 'goods_desc', 'notes'];
        
        demoFields.forEach(id => {
            const t = data?.find(x => x.field_id === id) || { label: '', is_required: false, is_visible: true };
            html += `<tr>
                <td><strong style="color:#2563eb">${id}</strong></td>
                <td><input type="text" class="form-control" id="lbl_${id}" value="${t.label}" placeholder="تجاوز الاسم الافتراضي" style="margin:0; padding:5px;"></td>
                <td><input type="checkbox" id="req_${id}" ${t.is_required ? 'checked' : ''}></td>
                <td><input type="checkbox" id="vis_${id}" ${!t.is_visible ? 'checked' : ''}></td>
                <td><button class="btn btn-primary" onclick="AdminApp.saveTemplate('${id}')">حفظ</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async saveTemplate(id) {
        const label = document.getElementById(`lbl_${id}`).value;
        const is_req = document.getElementById(`req_${id}`).checked;
        const is_vis = !document.getElementById(`vis_${id}`).checked; 

        const { error } = await supabase.from('waybill_field_templates').upsert({
            field_id: id, label: label, is_required: is_req, is_visible: is_vis
        });
        if(error) this.toast("خطأ في الحفظ", "danger");
        else this.toast("تم التحديث بنجاح", "success");
    }
};
window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
