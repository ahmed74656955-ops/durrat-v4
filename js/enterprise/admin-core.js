import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const AdminApp = {
    async init() {
        try {
            await AuthCore.init(true);
            const loader = document.getElementById('auth-loading') || document.getElementById('loading-overlay');
            if(loader) loader.style.display = 'none';

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
                <div class="card"><h3 style="color:#2563eb;"><i class="fas fa-chart-line"></i> نظرة عامة</h3><p>أهلاً بك في لوحة تحكم درة العالم. النظام السحابي يعمل بكفاءة عالية.</p></div>
                <div class="card"><h3 style="color:#10b981;"><i class="fas fa-server"></i> حالة النظام</h3><p>الاتصال بقاعدة البيانات (Supabase) نشط ومشفر بالكامل.</p></div>
            </div>
        `;
    },

    async renderBranches(area) {
        const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب الفروع", "danger");
        
        let html = `<div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>الفروع المسجلة بالنظام</h3>
                <button class="btn btn-primary" onclick="AdminApp.openBranchForm()"><i class="fas fa-plus"></i> إضافة فرع جديد</button>
            </div>
        <table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>تسلسل البداية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(b => {
            html += `<tr><td><strong>${b.code}</strong></td><td>${b.name}</td><td>${b.start_seq}</td>
            <td><span style="color:${b.is_active ? '#10b981' : '#ef4444'}; font-weight:bold;">${b.is_active ? 'نشط' : 'موقوف'}</span></td>
            <td><button class="btn" style="background:#f59e0b; color:white; padding:5px 10px; font-size:0.8rem;" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})">تبديل الحالة</button></td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    openBranchForm() {
        const body = `
            <div class="form-group"><label>كود الفرع (إنجليزي):</label><input type="text" id="b_code" class="form-control" placeholder="مثال: TAIZ"></div>
            <div class="form-group"><label>اسم الفرع:</label><input type="text" id="b_name" class="form-control" placeholder="فرع تعز"></div>
            <div class="form-group"><label>تسلسل البداية:</label><input type="number" id="b_seq" class="form-control" value="10000"></div>`;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveBranch()">حفظ واعتماد</button>`;
        this.openModal("إضافة فرع", body, footer);
    },

    async saveBranch() {
        const code = document.getElementById('b_code').value.toUpperCase();
        const name = document.getElementById('b_name').value;
        const seq = document.getElementById('b_seq').value;
        await supabase.from('branches').insert([{ code, name, start_seq: seq }]);
        this.closeModal(); this.showSection('branches');
    },

    async renderUsers(area) {
        const { data } = await supabase.from('app_users').select('*, branches(name)');
        let html = `<div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>المستخدمون</h3>
                <button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> تسجيل مستخدم</button>
            </div>
        <table class="data-table"><thead><tr><th>المستخدم</th><th>الفرع</th><th>الصلاحية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(u => {
            html += `<tr><td><strong>${u.username}</strong></td><td>${u.branches?.name || 'عام'}</td><td>${u.role}</td>
            <td><span style="color:${u.is_active ? '#10b981' : '#ef4444'};">${u.is_active ? 'نشط' : 'موقوف'}</span></td>
            <td><button class="btn" style="background:#f59e0b; color:white; padding:5px 10px; font-size:0.8rem;" onclick="AdminApp.toggleUserStatus('${u.id}', ${!u.is_active})">تبديل الحالة</button></td></tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async openUserForm() {
        const { data: branches } = await supabase.from('branches').select('code, name').eq('is_active', true);
        let branchOptions = branches.map(b => `<option value="${b.code}">${b.name}</option>`).join('');
        const body = `
            <div class="form-group"><label>الفرع:</label><select id="u_branch" class="form-control">${branchOptions}</select></div>
            <div class="form-group"><label>المستخدم:</label><input type="text" id="u_name" class="form-control" placeholder="admin_taiz"></div>
            <div class="form-group"><label>كلمة المرور:</label><input type="password" id="u_pass" class="form-control"></div>
            <div class="form-group"><label>الصلاحية:</label>
                <select id="u_role" class="form-control"><option value="employee">موظف إدخال</option><option value="branch_manager">مدير فرع</option><option value="super_admin">مدير نظام</option></select>
            </div>`;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveUser()">تشفير وحفظ</button>`;
        this.openModal("مستخدم جديد", body, footer);
    },

    async saveUser() {
        const b = document.getElementById('u_branch').value;
        const u = document.getElementById('u_name').value.toLowerCase();
        const p = document.getElementById('u_pass').value;
        const r = document.getElementById('u_role').value;
        await supabase.rpc('create_app_user', { p_branch_code: b, p_username: u, p_password: p, p_role: r });
        this.closeModal(); this.showSection('users');
    },

    // استعادة جدول القوالب الاحترافي بالكامل
    async renderTemplates(area) {
        const { data } = await supabase.from('waybill_field_templates').select('*');
        let html = `<div class="card"><h3>تخصيص أسماء واتجاهات الحقول</h3>
        <table class="data-table"><thead><tr><th>معرف الحقل</th><th>الاسم في الواجهة</th><th>المحاذاة</th><th>إجباري؟</th><th>مخفي؟</th><th>حفظ</th></tr></thead><tbody>`;
        
        const demoFields = ['consignee_name', 'shipper_name', 'goods_desc', 'notes', 'pieces'];
        demoFields.forEach(id => {
            const t = data?.find(x => x.field_id === id) || { label: '', is_required: false, is_visible: true, text_align: 'right' };
            html += `<tr>
                <td style="direction:ltr; text-align:right;"><strong>${id}</strong></td>
                <td><input type="text" class="form-control" id="lbl_${id}" value="${t.label || ''}" style="margin:0; padding:6px; width:120px;"></td>
                <td>
                    <select id="align_${id}" class="form-control" style="padding:6px; margin:0;">
                        <option value="right" ${t.text_align === 'right' || !t.text_align ? 'selected' : ''}>يمين</option>
                        <option value="center" ${t.text_align === 'center' ? 'selected' : ''}>وسط</option>
                        <option value="left" ${t.text_align === 'left' ? 'selected' : ''}>يسار</option>
                    </select>
                </td>
                <td><input type="checkbox" id="req_${id}" ${t.is_required ? 'checked' : ''} style="width:18px;height:18px;"></td>
                <td><input type="checkbox" id="vis_${id}" ${!t.is_visible ? 'checked' : ''} style="width:18px;height:18px;"></td>
                <td><button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;" onclick="AdminApp.saveTemplate('${id}')">تحديث</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async saveTemplate(id) {
        const lbl = document.getElementById(`lbl_${id}`).value;
        const align = document.getElementById(`align_${id}`).value;
        const req = document.getElementById(`req_${id}`).checked;
        const vis = !document.getElementById(`vis_${id}`).checked; 
        await supabase.from('waybill_field_templates').upsert({ field_id: id, label: lbl, text_align: align, is_required: req, is_visible: vis });
        this.toast("تم تحديث الحقل مركزياً", "success");
    },

    // استعادة سجل المراقبة الاحترافي المجدول
    async renderAudit(area) {
        const { data } = await supabase.from('audit_logs').select('*, branches(name)').order('created_at', { ascending: false }).limit(30);
        let html = `<div class="card"><h3>سجل المراقبة والتدقيق الأمني</h3>
        <table class="data-table" style="font-size:0.9rem;"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الفرع</th><th>العملية</th></tr></thead><tbody>`;
        data.forEach(log => {
            const time = new Date(log.created_at).toLocaleString('ar-YE');
            html += `<tr>
                <td><span style="color:#64748b; direction:ltr; display:inline-block;">${time}</span></td>
                <td><strong>${log.username}</strong></td>
                <td>${log.branches?.name || 'النظام العام'}</td>
                <td><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:4px;">${log.action}</span></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async toggleUserStatus(id, status) {
        await supabase.from('app_users').update({ is_active: status }).eq('id', id);
        this.showSection('users');
    },
    async toggleBranchStatus(id, status) {
        await supabase.from('branches').update({ is_active: status }).eq('id', id);
        this.showSection('branches');
    }
};

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
