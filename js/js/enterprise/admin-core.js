import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const AdminApp = {
    async init() {
        await AuthCore.init(true); // التحقق من صلاحيات المدير
        this.createModalContainer(); // بناء هيكل النوافذ المنبثقة
        this.showSection('dashboard');
    },

    toast(msg, type='info') {
        const t = document.createElement('div'); t.className = `enterprise-toast`;
        t.style.borderLeft = `4px solid ${type === 'danger' ? '#ef4444' : '#10b981'}`;
        t.innerText = msg; document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    // بناء النافذة المخفية وتجهيزها للاستخدام
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
        if(event && event.currentTarget) event.currentTarget.classList.add('active');
        
        const area = document.getElementById('content-area');
        document.getElementById('page-title').innerText = section.toUpperCase();
        area.innerHTML = '<h3 style="text-align:center; color:#94a3b8; margin-top:50px;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</h3>';

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
                <div class="card"><h3 style="color:#2563eb;"><i class="fas fa-chart-line"></i> نظرة عامة</h3><p>مرحباً بك في لوحة تحكم درة العالم. النظام السحابي يعمل بكفاءة.</p></div>
                <div class="card"><h3 style="color:#10b981;"><i class="fas fa-server"></i> حالة النظام</h3><p>جميع قواعد البيانات مشفرة ومتصلة بنجاح.</p></div>
            </div>
        `;
    },

    // ===================================
    // إدارة الفروع (إنشاء، عرض، إيقاف)
    // ===================================
    async renderBranches(area) {
        const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب الفروع", "danger");
        
        let html = `<div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>الفروع المسجلة</h3>
                <button class="btn btn-primary" onclick="AdminApp.openBranchForm()"><i class="fas fa-plus"></i> إضافة فرع جديد</button>
            </div>
        <table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>تسلسل البداية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(b => {
            html += `<tr>
                <td><strong>${b.code}</strong></td>
                <td>${b.name}</td>
                <td>${b.start_seq}</td>
                <td><span style="color:${b.is_active ? '#10b981' : '#ef4444'}; font-weight:bold;">${b.is_active ? 'نشط' : 'موقوف'}</span></td>
                <td><button class="btn" style="background:#f59e0b; color:white; padding:5px 10px; font-size:0.8rem;" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})">${b.is_active ? 'إيقاف' : 'تفعيل'}</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    openBranchForm() {
        const body = `
            <div class="form-group"><label>كود الفرع (حرف إنجليزي أو كود قصير):</label><input type="text" id="b_code" class="form-control" placeholder="مثال: JED أو S"></div>
            <div class="form-group"><label>اسم الفرع (بالعربي):</label><input type="text" id="b_name" class="form-control" placeholder="مثال: فرع جدة المركزي"></div>
            <div class="form-group"><label>بداية تسلسل البوليصات:</label><input type="number" id="b_seq" class="form-control" value="10000"></div>
        `;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveBranch()">حفظ واعتماد</button>`;
        this.openModal("إضافة فرع جديد", body, footer);
    },

    async saveBranch() {
        const code = document.getElementById('b_code').value.trim().toUpperCase();
        const name = document.getElementById('b_name').value.trim();
        const seq = parseInt(document.getElementById('b_seq').value);

        if(!code || !name) return this.toast("يرجى تعبئة الكود والاسم", "danger");

        const btn = document.querySelector('#ent-modal-footer .btn');
        btn.innerText = "جاري الحفظ..."; btn.disabled = true;

        const { error } = await supabase.from('branches').insert([{ code, name, start_seq: seq }]);
        if(error) {
            if(error.code === '23505') this.toast("كود الفرع مستخدم مسبقاً!", "danger");
            else this.toast("حدث خطأ أثناء الحفظ", "danger");
        } else {
            this.toast("تمت إضافة الفرع بنجاح", "success");
            this.closeModal(); this.showSection('branches');
        }
        btn.innerText = "حفظ واعتماد"; btn.disabled = false;
    },

    async toggleBranchStatus(id, newStatus) {
        const { error } = await supabase.from('branches').update({ is_active: newStatus }).eq('id', id);
        if(error) this.toast("خطأ في تحديث الحالة", "danger");
        else { this.toast("تم التحديث بنجاح", "success"); this.showSection('branches'); }
    },

    // ===================================
    // إدارة المستخدمين (إنشاء، عرض، إيقاف)
    // ===================================
    async renderUsers(area) {
        const { data, error } = await supabase.from('app_users').select('*, branches(name)').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب المستخدمين", "danger");
        
        let html = `<div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>الموظفون والمستخدمون</h3>
                <button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> مستخدم جديد</button>
            </div>
        <table class="data-table"><thead><tr><th>المستخدم للدخول</th><th>الفرع التابع له</th><th>الصلاحية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(u => {
            let roleAr = u.role === 'super_admin' ? 'مدير نظام' : (u.role === 'branch_manager' ? 'مدير فرع' : 'موظف بوليصة');
            html += `<tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.branches?.name || 'صلاحية عامة'}</td>
                <td>${roleAr}</td>
                <td><span style="color:${u.is_active ? '#10b981' : '#ef4444'}; font-weight:bold;">${u.is_active ? 'نشط' : 'موقوف'}</span></td>
                <td><button class="btn" style="background:#f59e0b; color:white; padding:5px 10px; font-size:0.8rem;" onclick="AdminApp.toggleUserStatus('${u.id}', ${!u.is_active})">${u.is_active ? 'إيقاف' : 'تفعيل'}</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async openUserForm() {
        const { data: branches } = await supabase.from('branches').select('code, name').eq('is_active', true);
        let branchOptions = branches.map(b => `<option value="${b.code}">${b.name} (كود: ${b.code})</option>`).join('');

        const body = `
            <div class="form-group"><label>اختر فرع الموظف:</label><select id="u_branch" class="form-control">${branchOptions}</select></div>
            <div class="form-group"><label>اسم المستخدم (يُستخدم لتسجيل الدخول):</label><input type="text" id="u_name" class="form-control" placeholder="حروف إنجليزية أو أرقام (بدون مسافات)"></div>
            <div class="form-group"><label>كلمة المرور:</label><input type="password" id="u_pass" class="form-control" placeholder="ادخل رقم سري قوي"></div>
            <div class="form-group"><label>الصلاحية:</label>
                <select id="u_role" class="form-control">
                    <option value="employee">موظف إدخال وطباعة بوليصات</option>
                    <option value="branch_manager">مدير فرع (تقارير فقط)</option>
                    <option value="super_admin">مدير عام للنظام (إدارة كاملة)</option>
                </select>
            </div>
        `;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveUser()">تشفير وحفظ</button>`;
        this.openModal("تسجيل موظف/مستخدم جديد", body, footer);
    },

    async saveUser() {
        const branch_code = document.getElementById('u_branch').value;
        const username = document.getElementById('u_name').value.trim().toLowerCase();
        const password = document.getElementById('u_pass').value;
        const role = document.getElementById('u_role').value;

        if(!username || !password) return this.toast("يرجى كتابة اسم المستخدم وكلمة المرور", "danger");

        const btn = document.querySelector('#ent-modal-footer .btn');
        btn.innerText = "جاري الاتصال السحابي..."; btn.disabled = true;

        try {
            // استخدام دالة RPC التي برمجناها في المرحلة الأولى لتشفير الباسورد بأمان
            const { data, error } = await supabase.rpc('create_app_user', {
                p_branch_code: branch_code,
                p_username: username,
                p_password: password,
                p_role: role
            });

            if(error) {
                if(error.message.includes('unique constraint')) this.toast("اسم المستخدم محجوز مسبقاً", "danger");
                else this.toast("خطأ في إنشاء المستخدم", "danger");
            } else {
                this.toast("تم إنشاء الموظف بتشفير آمن", "success");
                this.closeModal(); this.showSection('users');
            }
        } catch(e) { this.toast("خطأ في الاتصال", "danger"); }
        
        btn.innerText = "تشفير وحفظ"; btn.disabled = false;
    },

    async toggleUserStatus(id, newStatus) {
        const { error } = await supabase.from('app_users').update({ is_active: newStatus }).eq('id', id);
        if(error) this.toast("خطأ في تحديث الحالة", "danger");
        else { this.toast("تم التحديث", "success"); this.showSection('users'); }
    },

    // ===================================
    // إدارة قالب الحقول (الموجودة مسبقاً)
    // ===================================
    async renderTemplates(area) {
        const { data, error } = await supabase.from('waybill_field_templates').select('*');
        let html = `<div class="card"><h3>تخصيص الحقول (مركزياً لكافة الفروع)</h3>
        <p style="color:#64748b; font-size:0.9rem; margin-bottom:15px;">تعديل هذه الحقول سيغير التسميات عند الموظفين بدون كسر التصميم الأصلي للطباعة.</p>
        <table class="data-table"><thead><tr><th>معرف الحقل</th><th>الاسم الجديد (Label)</th><th>إجباري؟</th><th>مخفي؟</th><th>حفظ</th></tr></thead><tbody>`;
        
        const demoFields = ['consignee_name', 'shipper_name', 'goods_desc', 'notes', 'pieces'];
        demoFields.forEach(id => {
            const t = data?.find(x => x.field_id === id) || { label: '', is_required: false, is_visible: true };
            html += `<tr>
                <td style="direction:ltr; text-align:right;"><strong>${id}</strong></td>
                <td><input type="text" class="form-control" id="lbl_${id}" value="${t.label || ''}" placeholder="تجاوز الاسم الافتراضي" style="margin:0; padding:6px; width:150px;"></td>
                <td><input type="checkbox" id="req_${id}" ${t.is_required ? 'checked' : ''} style="width:18px;height:18px;"></td>
                <td><input type="checkbox" id="vis_${id}" ${!t.is_visible ? 'checked' : ''} style="width:18px;height:18px;"></td>
                <td><button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;" onclick="AdminApp.saveTemplate('${id}')">تحديث</button></td>
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
        else this.toast("تم التحديث بنجاح، سيطبق على جميع الفروع", "success");
    },

    // ===================================
    // سجل التدقيق المتقدم (Audit Log)
    // ===================================
    async renderAudit(area) {
        const { data, error } = await supabase.from('audit_logs').select('*, branches(name)').order('created_at', { ascending: false }).limit(50);
        if(error) return this.toast("خطأ في جلب السجل", "danger");
        
        let html = `<div class="card"><h3>سجل المراقبة والتدقيق (آخر 50 حركة)</h3>
        <table class="data-table" style="font-size:0.9rem;"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الفرع</th><th>العملية المسجلة</th></tr></thead><tbody>`;
        data.forEach(log => {
            const time = new Date(log.created_at).toLocaleString('ar-SA');
            let actionAr = log.action === 'login' ? 'تسجيل دخول للنظام' : log.action;
            html += `<tr>
                <td><span style="color:#64748b; direction:ltr; display:inline-block;">${time}</span></td>
                <td><strong>${log.username}</strong></td>
                <td>${log.branches?.name || '-'}</td>
                <td><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:4px; font-weight:bold;">${actionAr}</span></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    }
};

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
