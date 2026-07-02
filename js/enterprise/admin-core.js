import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const AdminApp = {
    async init() {
        try {
            await AuthCore.init(true);
            
            // إصلاح ذكي: يبحث عن شاشة التحميل، إذا وجدها يخفيها، وإذا لم يجدها (في صفحة الدخول) يكمل عمله بسلام
            const loader = document.getElementById('auth-loading') || document.getElementById('loading-overlay');
            if(loader) {
                loader.style.display = 'none';
            }

            this.createModalContainer(); 
            this.showSection('dashboard');
            
        } catch (error) {
            console.log("جارٍ التحقق من الصلاحيات...");
        }
    },

    toast(msg, type='info') {
        const t = document.createElement('div'); t.className = `enterprise-toast`;
        t.style.borderLeft = `4px solid ${type === 'danger' ? '#ef4444' : '#10b981'}`;
        t.innerText = msg; document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    createModalContainer() {
        if(document.getElementById('ent-modal')) return;
        const m = document.createElement('div');
        m.id = 'ent-modal';
        m.className = 'ent-modal-overlay';
        m.innerHTML = `
            <div class="ent-modal-box">
                <div class="ent-modal-header">
                    <h3 id="ent-modal-title">العنوان</h3>
                    <button onclick="AdminApp.closeModal()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#ef4444;">&times;</button>
                </div>
                <div class="ent-modal-body" id="ent-modal-body"></div>
                <div class="ent-modal-footer" id="ent-modal-footer"></div>
            </div>
        `;
        document.body.appendChild(m);
    },

    openModal(title, bodyHTML, footerHTML) {
        document.getElementById('ent-modal-title').innerText = title;
        document.getElementById('ent-modal-body').innerHTML = bodyHTML;
        document.getElementById('ent-modal-footer').innerHTML = footerHTML;
        document.getElementById('ent-modal').style.display = 'flex';
    },

    closeModal() { document.getElementById('ent-modal').style.display = 'none'; },

    async showSection(section) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(window.event && window.event.currentTarget) window.event.currentTarget.classList.add('active');
        
        const area = document.getElementById('content-area');
        document.getElementById('page-title').innerText = section.toUpperCase();
        area.innerHTML = '<h3 style="text-align:center; color:#94a3b8; margin-top:50px;"><i class="fas fa-spinner fa-spin"></i> جاري تحميل البيانات...</h3>';

        switch(section) {
            case 'branches': await this.renderBranches(area); break;
            case 'users': await this.renderUsers(area); break;
            case 'templates': await this.renderTemplates(area); break;
            case 'audit': await this.renderAudit(area); break;
            case 'dashboard': default: this.renderDashboard(area); break;
        }
    },

    renderDashboard(area) {
        area.innerHTML = `
            <div class="grid-2">
                <div class="card"><h3 style="color:#2563eb;"><i class="fas fa-chart-line"></i> نظرة عامة</h3><p>أهلاً بك في لوحة تحكم درة العالم. النظام يعمل بكفاءة.</p></div>
                <div class="card"><h3 style="color:#10b981;"><i class="fas fa-server"></i> حالة النظام</h3><p>الاتصال بالسحابة (Supabase) نشط.</p></div>
            </div>
        `;
    },

    async renderBranches(area) {
        const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب الفروع", "danger");
        
        let html = `<div class="card"><h3>الفروع المسجلة</h3><button class="btn btn-primary" onclick="AdminApp.openBranchForm()">+ إضافة فرع</button>
        <table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(b => {
            html += `<tr><td>${b.code}</td><td>${b.name}</td><td>${b.is_active ? '✅' : '❌'}</td>
            <td><button class="btn" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})">تبديل الحالة</button></td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    openBranchForm() {
        const body = `<input type="text" id="b_code" class="form-control" placeholder="الكود"><input type="text" id="b_name" class="form-control" placeholder="الاسم">`;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveBranch()">حفظ</button>`;
        this.openModal("إضافة فرع", body, footer);
    },

    async saveBranch() {
        const code = document.getElementById('b_code').value.toUpperCase();
        const name = document.getElementById('b_name').value;
        const { error } = await supabase.from('branches').insert([{ code, name }]);
        if(!error) { this.closeModal(); this.showSection('branches'); }
    },

    async renderUsers(area) {
        const { data } = await supabase.from('app_users').select('*, branches(name)');
        let html = `<div class="card"><h3>المستخدمون</h3><button class="btn btn-primary" onclick="AdminApp.openUserForm()">+ تسجيل مستخدم</button>
        <table class="data-table"><thead><tr><th>المستخدم</th><th>الفرع</th><th>الحالة</th></tr></thead><tbody>`;
        data.forEach(u => {
            html += `<tr><td>${u.username}</td><td>${u.branches?.name || 'عام'}</td><td>${u.is_active ? 'نشط' : 'موقوف'}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    openUserForm() {
        const body = `<input type="text" id="u_name" class="form-control" placeholder="اسم المستخدم"><input type="password" id="u_pass" class="form-control" placeholder="كلمة المرور">`;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveUser()">تسجيل</button>`;
        this.openModal("مستخدم جديد", body, footer);
    },

    async saveUser() {
        const username = document.getElementById('u_name').value;
        const password = document.getElementById('u_pass').value;
        await supabase.rpc('create_app_user', { p_username: username, p_password: password, p_role: 'employee', p_branch_code: 'TAIZ' });
        this.closeModal(); this.showSection('users');
    },

    async renderTemplates(area) {
        const { data } = await supabase.from('waybill_field_templates').select('*');
        let html = `<div class="card"><h3>تخصيص الحقول</h3><table class="data-table"><tbody>`;
        data.forEach(t => {
            html += `<tr><td>${t.field_id}</td><td><input type="text" id="lbl_${t.field_id}" value="${t.label}"></td><td><button onclick="AdminApp.saveTemplate('${t.field_id}')">حفظ</button></td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async saveTemplate(id) {
        const label = document.getElementById(`lbl_${id}`).value;
        await supabase.from('waybill_field_templates').upsert({ field_id: id, label: label });
        this.toast("تم التحديث");
    },

    async renderAudit(area) {
        const { data } = await supabase.from('audit_logs').select('*').limit(20);
        let html = `<div class="card"><h3>سجل المراقبة</h3><ul>`;
        data.forEach(log => { html += `<li>${log.action} - ${log.username}</li>`; });
        html += `</ul></div>`;
        area.innerHTML = html;
    },

    async toggleBranchStatus(id, status) {
        await supabase.from('branches').update({ is_active: status }).eq('id', id);
        this.showSection('branches');
    }
};

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
