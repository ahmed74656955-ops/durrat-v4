import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const AdminApp = {
    async init() {
        try {
            const isAuth = await AuthCore.init();
            if(!isAuth) return;

            this.createModalContainer(); 
            this.showSection('dashboard');
        } catch (error) {
            console.error("خطأ في تهيئة الإدارة:", error);
        }
    },

    toast(msg, type='success') {
        // يمكنك لاحقاً إضافة أكواد للإشعارات الفخمة هنا، حالياً نكتفي بـ alert للتجربة
        alert(msg);
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
                    <button onclick="AdminApp.closeModal()" style="background:none; border:none; font-size:1.8rem; cursor:pointer; color:var(--danger); transition:0.2s;">&times;</button>
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
        const modal = document.getElementById('ent-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    },
    
    closeModal() { 
        const modal = document.getElementById('ent-modal');
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    },

    async showSection(section) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(section));
        if(activeLink) activeLink.classList.add('active');
        
        const area = document.getElementById('content-area');
        if(!area) return;

        const titles = { dashboard: 'الرئيسية', branches: 'إدارة الفروع', users: 'نظام المستخدمين', templates: 'التحكم بالحقول', audit: 'سجل المراقبة' };
        document.getElementById('page-title').innerText = titles[section] || section;
        
        area.innerHTML = '<div style="display:flex; justify-content:center; padding:100px;"><div class="spinner"></div></div>';

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
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="card glass-panel"><h3 style="color:var(--primary); margin-bottom:10px;"><i class="fas fa-satellite-dish"></i> الحالة السحابية</h3><p style="color:var(--text-muted); line-height:1.8;">النظام متصل بقاعدة بيانات Supabase ويعمل بكفاءة عالية. جميع البيانات مشفرة وآمنة.</p></div>
                <div class="card glass-panel"><h3 style="color:var(--accent); margin-bottom:10px;"><i class="fas fa-shield-alt"></i> مستوى الأمان</h3><p style="color:var(--text-muted); line-height:1.8;">نظام PWA مفعل. وضع عدم الاتصال (Offline-first) جاهز لحفظ البوالص عند انقطاع الإنترنت.</p></div>
            </div>
        `;
    },

    async renderBranches(area) {
        const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
        if(error) return area.innerHTML = '<p style="color:red">خطأ في جلب البيانات</p>';
        
        let html = `<div class="card glass-panel">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;"><i class="fas fa-code-branch" style="color:var(--primary);"></i> فروع المؤسسة</h3>
                <button class="btn btn-primary" onclick="AdminApp.openBranchForm()"><i class="fas fa-plus-circle"></i> إضافة فرع</button>
            </div>
        <table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>تسلسل البداية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(b => {
            html += `<tr>
                <td><strong style="color:var(--primary);">${b.code}</strong></td>
                <td>${b.name}</td>
                <td>${b.start_seq}</td>
                <td><span style="color:${b.is_active ? 'var(--accent)' : 'var(--danger)'}; font-weight:bold;">${b.is_active ? 'نشط' : 'موقوف'}</span></td>
                <td><button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})"><i class="fas fa-sync-alt"></i> تبديل</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    openBranchForm() {
        const body = `
            <div class="form-group"><label>كود الفرع (إنجليزي/أرقام فقط):</label><input type="text" id="b_code" class="form-control" placeholder="مثال: TAIZ"></div>
            <div class="form-group"><label>اسم الفرع:</label><input type="text" id="b_name" class="form-control" placeholder="فرع تعز"></div>
            <div class="form-group"><label>تسلسل البداية للبوليصة:</label><input type="number" id="b_seq" class="form-control" value="10000"></div>`;
        const footer = `<button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="AdminApp.saveBranch()">حفظ الفرع الجديد</button>`;
        this.openModal("إضافة فرع جديد", body, footer);
    },

    async saveBranch() {
        const code = document.getElementById('b_code').value.toUpperCase();
        const name = document.getElementById('b_name').value;
        const seq = document.getElementById('b_seq').value;
        if(!code || !name) return alert("يرجى تعبئة الحقول");
        await supabase.from('branches').insert([{ code, name, start_seq: seq }]);
        this.closeModal(); this.showSection('branches');
    },

    async renderUsers(area) {
        const { data } = await supabase.from('app_users').select('*, branches(name)');
        let html = `<div class="card glass-panel">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;"><i class="fas fa-users" style="color:var(--accent);"></i> إدارة الصلاحيات والمستخدمين</h3>
                <button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> مستخدم جديد</button>
            </div>
        <table class="data-table"><thead><tr><th>المستخدم</th><th>الفرع التابع له</th><th>الصلاحية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(u => {
            html += `<tr>
                <td><strong style="color:var(--primary);">${u.username}</strong></td>
                <td>${u.branches?.name || 'عام / الإدارة'}</td>
                <td><span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.85rem;">${u.role}</span></td>
                <td><span style="color:${u.is_active ? 'var(--accent)' : 'var(--danger)'};">${u.is_active ? 'مصرح له' : 'موقوف'}</span></td>
                <td><button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="AdminApp.toggleUserStatus('${u.id}', ${!u.is_active})"><i class="fas fa-ban"></i> تبديل</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async openUserForm() {
        const { data: branches } = await supabase.from('branches').select('code, name').eq('is_active', true);
        let branchOptions = branches.map(b => `<option value="${b.code}" style="background:#0f172a;">${b.name}</option>`).join('');
        const body = `
            <div class="form-group"><label>الفرع:</label><select id="u_branch" class="form-control">${branchOptions}</select></div>
            <div class="form-group"><label>اسم المستخدم (للدخول):</label><input type="text" id="u_name" class="form-control" placeholder="مثال: ali_taiz"></div>
            <div class="form-group"><label>كلمة المرور:</label><input type="password" id="u_pass" class="form-control"></div>
            <div class="form-group"><label>مستوى الصلاحية:</label>
                <select id="u_role" class="form-control">
                    <option value="employee" style="background:#0f172a;">موظف إدخال</option>
                    <option value="branch_manager" style="background:#0f172a;">مدير فرع</option>
                    <option value="super_admin" style="background:#0f172a;">مدير نظام</option>
                </select>
            </div>`;
        const footer = `<button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="AdminApp.saveUser()"><i class="fas fa-lock"></i> تشفير واعتماد</button>`;
        this.openModal("تسجيل مستخدم بنظام ERP", body, footer);
    },

    async saveUser() {
        const b = document.getElementById('u_branch').value;
        const u = document.getElementById('u_name').value.toLowerCase();
        const p = document.getElementById('u_pass').value;
        const r = document.getElementById('u_role').value;
        if(!u || !p) return alert("يجب كتابة اسم المستخدم وكلمة المرور");
        
        // استدعاء دالة الإضافة التي أنشأناها في قاعدة البيانات
        await supabase.rpc('create_app_user', { p_branch_code: b, p_username: u, p_password: p, p_role: r });
        this.closeModal(); this.showSection('users');
    },

    async renderTemplates(area) {
        const { data } = await supabase.from('waybill_field_templates').select('*');
        let html = `<div class="card glass-panel"><h3 style="margin-bottom:20px;"><i class="fas fa-sliders-h" style="color:var(--warning);"></i> تخصيص الواجهة المركزية للبوالص</h3>
        <table class="data-table"><thead><tr><th>الحقل البرمجي</th><th>الاسم المعروض</th><th>المحاذاة</th><th>إجباري؟</th><th>مخفي؟</th><th>حفظ</th></tr></thead><tbody>`;
        
        const demoFields = ['consignee_name', 'shipper_name', 'goods_desc', 'notes', 'pieces'];
        demoFields.forEach(id => {
            const t = data?.find(x => x.field_id === id) || { label: '', is_required: false, is_visible: true, text_align: 'right' };
            html += `<tr>
                <td style="direction:ltr; text-align:right;"><code style="color:var(--warning); background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:4px;">${id}</code></td>
                <td><input type="text" class="form-control" id="lbl_${id}" value="${t.label || ''}" style="padding:8px; margin:0;"></td>
                <td>
                    <select id="align_${id}" class="form-control" style="padding:8px; margin:0;">
                        <option value="right" style="background:#0f172a;" ${t.text_align === 'right' || !t.text_align ? 'selected' : ''}>يمين</option>
                        <option value="center" style="background:#0f172a;" ${t.text_align === 'center' ? 'selected' : ''}>وسط</option>
                        <option value="left" style="background:#0f172a;" ${t.text_align === 'left' ? 'selected' : ''}>يسار</option>
                    </select>
                </td>
                <td style="text-align:center;"><input type="checkbox" id="req_${id}" ${t.is_required ? 'checked' : ''} style="transform: scale(1.5); accent-color: var(--primary);"></td>
                <td style="text-align:center;"><input type="checkbox" id="vis_${id}" ${!t.is_visible ? 'checked' : ''} style="transform: scale(1.5); accent-color: var(--danger);"></td>
                <td><button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="AdminApp.saveTemplate('${id}')"><i class="fas fa-save"></i></button></td>
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
        this.toast("تم تحديث إعدادات الحقل وتطبيقها على جميع الفروع");
    },

    async renderAudit(area) {
        area.innerHTML = `<div class="card glass-panel" style="text-align:center; padding:50px;">
            <i class="fas fa-cogs fa-3x" style="color:var(--text-muted); margin-bottom:20px;"></i>
            <h3 style="color:var(--text-main);">سجل العمليات قيد التطوير</h3>
            <p style="color:var(--text-muted);">هذه الميزة ستسمح لك بمراقبة كل بوليصة يتم حفظها في الفروع بتحديث لحظي.</p>
        </div>`;
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
