import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const AdminApp = {
    async init() {
        try {
            await AuthCore.init(true); // التحقق من صلاحيات المدير الآمنة
            
            // السطر الجديد: إخفاء شاشة التحميل الزرقاء بمجرد التحقق من الصلاحية
            const loader = document.getElementById('auth-loading') || document.getElementById('loading-overlay') || document.querySelector('.loading-screen');
            if(loader) loader.style.display = 'none';

            this.createModalContainer(); // بناء هيكل النوافذ المنبثقة مركزياً
            this.showSection('dashboard');
            
        } catch (error) {
            console.error("Auth Error:", error);
            // في حال لم يكن المستخدم مسجل الدخول، سيتم إعادته فوراً لشاشة البوليصة الرئيسية
            window.location.href = 'index.html';
        }
    },

    toast(msg, type='info') {
        const t = document.createElement('div'); t.className = `enterprise-toast`;
        t.style.borderLeft = `4px solid ${type === 'danger' ? '#ef4444' : '#10b981'}`;
        t.innerText = msg; document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    // بناء حاوية النافذة المنبثقة وتجهيزها في الصفحة
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
        area.innerHTML = '<h3 style="text-align:center; color:#94a3b8; margin-top:50px;"><i class="fas fa-spinner fa-spin"></i> جاري تحميل البيانات السحابية...</h3>';

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
                <div class="card"><h3 style="color:#2563eb;"><i class="fas fa-chart-line"></i> نظرة عامة</h3><p>مرحباً بك في لوحة تحكم درة العالم. النظام السحابي يعمل بكفاءة والربط متكامل.</p></div>
                <div class="card"><h3 style="color:#10b981;"><i class="fas fa-server"></i> حالة النظام السحابي</h3><p>متصل بقاعدة البيانات (Supabase) بنجاح. كافة العمليات مشفرة ومحمية.</p></div>
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
                <h3>الفروع المسجلة بالنظام</h3>
                <button class="btn btn-primary" onclick="AdminApp.openBranchForm()"><i class="fas fa-plus"></i> إضافة فرع جديد</button>
            </div>
        <table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>تسلسل البداية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(b => {
            html += `<tr>
                <td><strong>${b.code}</strong></td>
                <td>${b.name}</td>
                <td>${b.start_seq}</td>
                <td><span style="color:${b.is_active ? '#10b981' : '#ef4444'}; font-weight:bold;">${b.is_active ? 'نشط' : 'موقوف'}</span></td>
                <td><button class="btn" style="background:#f59e0b; color:white; padding:5px 10px; font-size:0.8rem;" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})">${b.is_active ? 'إيقاف الفرع' : 'تفعيل الفرع'}</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    openBranchForm() {
        const body = `
            <div class="form-group"><label>كود الفرع (حروف إنجليزية قصيرة):</label><input type="text" id="b_code" class="form-control" placeholder="مثال: TAIZ أو ADEN"></div>
            <div class="form-group"><label>اسم الفرع (بالعربي):</label><input type="text" id="b_name" class="form-control" placeholder="مثال: فرع تعز الرئيسي"></div>
            <div class="form-group"><label>بداية تسلسل البوليصات لهذا الفرع:</label><input type="number" id="b_seq" class="form-control" value="10000"></div>
        `;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveBranch()">حفظ واعتماد الفرع</button>`;
        this.openModal("إضافة فرع جديد للمؤسسة", body, footer);
    },

    async saveBranch() {
        const code = document.getElementById('b_code').value.trim().toUpperCase();
        const name = document.getElementById('b_name').value.trim();
        const seq = parseInt(document.getElementById('b_seq').value);

        if(!code || !name) return this.toast("يرجى تعبئة الكود والاسم بالكامل", "danger");

        const btn = document.querySelector('#ent-modal-footer .btn');
        btn.innerText = "جاري الحفظ سحابياً..."; btn.disabled = true;

        const { error } = await supabase.from('branches').insert([{ code, name, start_seq: seq }]);
        if(error) {
            if(error.code === '23505') this.toast("كود الفرع مستخدم مسبقاً بالنظام!", "danger");
            else this.toast("حدث خطأ أثناء الحفظ", "danger");
        } else {
            this.toast("تمت إضافة الفرع الجديد بنجاح", "success");
            this.closeModal(); this.showSection('branches');
        }
        btn.innerText = "حفظ واعتماد الفرع"; btn.disabled = false;
    },

    async toggleBranchStatus(id, newStatus) {
        const { error } = await supabase.from('branches').update({ is_active: newStatus }).eq('id', id);
        if(error) this.toast("خطأ في تحديث الحالة", "danger");
        else { this.toast("تم تحديث حالة الفرع بنجاح", "success"); this.showSection('branches'); }
    },

    // ===================================
    // إدارة المستخدمين (إنشاء، عرض، إيقاف)
    // ===================================
    async renderUsers(area) {
        const { data, error } = await supabase.from('app_users').select('*, branches(name)').order('created_at', { ascending: false });
        if(error) return this.toast("خطأ في جلب الموظفين", "danger");
        
        let html = `<div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>الموظفون والمستخدمون وصلاحياتهم</h3>
                <button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> تسجيل موظف جديد</button>
            </div>
        <table class="data-table"><thead><tr><th>اسم المستخدم للدخول</th><th>الفرع التابع له</th><th>الصلاحية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>`;
        data.forEach(u => {
            let roleAr = u.role === 'super_admin' ? 'مدير عام للنظام' : (u.role === 'branch_manager' ? 'مدير فرع (تقارير)' : 'موظف بوليصة (إدخال وطباعة)');
            html += `<tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.branches?.name || 'صلاحية عامة (كل الفروع)'}</td>
                <td>${roleAr}</td>
                <td><span style="color:${u.is_active ? '#10b981' : '#ef4444'}; font-weight:bold;">${u.is_active ? 'نشط' : 'موقوف'}</span></td>
                <td><button class="btn" style="background:#f59e0b; color:white; padding:5px 10px; font-size:0.8rem;" onclick="AdminApp.toggleUserStatus('${u.id}', ${!u.is_active})">${u.is_active ? 'إيقاف الحساب' : 'تفعيل الحساب'}</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async openUserForm() {
        const { data: branches } = await supabase.from('branches').select('code, name').eq('is_active', true);
        let branchOptions = branches.map(b => `<option value="${b.code}">${b.name} (${b.code})</option>`).join('');

        const body = `
            <div class="form-group"><label>اختر فرع الموظف:</label><select id="u_branch" class="form-control">${branchOptions}</select></div>
            <div class="form-group"><label>اسم المستخدم (لتسجيل الدخول):</label><input type="text" id="u_name" class="form-control" placeholder="حروف إنجليزية بدون مسافات"></div>
            <div class="form-group"><label>كلمة المرور الحساب:</label><input type="password" id="u_pass" class="form-control" placeholder="ادخل كلمة مرور مشفرة وقوية"></div>
            <div class="form-group"><label>صلاحية الحساب العضوية:</label>
                <select id="u_role" class="form-control">
                    <option value="employee">موظف إدخال وطباعة بوليصات</option>
                    <option value="branch_manager">مدير فرع (تقارير ومراقبة)</option>
                    <option value="super_admin">مدير عام للنظام (تحكم كامل)</option>
                </select>
            </div>
        `;
        const footer = `<button class="btn btn-primary" onclick="AdminApp.saveUser()">تشفير وحفظ الحساب</button>`;
        this.openModal("تسجيل موظف/مستخدم جديد في السحابة", body, footer);
    },

    async saveUser() {
        const branch_code = document.getElementById('u_branch').value;
        const username = document.getElementById('u_name').value.trim().toLowerCase();
        const password = document.getElementById('u_pass').value;
        const role = document.getElementById('u_role').value;

        if(!username || !password) return this.toast("يرجى كتابة اسم المستخدم وكلمة المرور بالكامل", "danger");

        const btn = document.querySelector('#ent-modal-footer .btn');
        btn.innerText = "جاري التشفير الآمن والاتصال..."; btn.disabled = true;

        try {
            const { data, error } = await supabase.rpc('create_app_user', {
                p_branch_code: branch_code,
                p_username: username,
                p_password: password,
                p_role: role
            });

            if(error) {
                if(error.message.includes('unique constraint')) this.toast("اسم المستخدم محجوز ومسجل مسبقاً!", "danger");
                else this.toast("خطأ في إنشاء الحساب المشفر", "danger");
            } else {
                this.toast("تم إنشاء حساب الموظف بتشفيير آمن 100%", "success");
                this.closeModal(); this.showSection('users');
            }
        } catch(e) { this.toast("خطأ في الاتصال بالسيرفر المركزي", "danger"); }
        
        btn.innerText = "تشفير وحفظ الحساب"; btn.disabled = false;
    },

    async toggleUserStatus(id, newStatus) {
        const { error } = await supabase.from('app_users').update({ is_active: newStatus }).eq('id', id);
        if(error) this.toast("خطأ في تحديث الحالة", "danger");
        else { this.toast("تم تحديث حالة المستخدم بنجاح", "success"); this.showSection('users'); }
    },

    // ===================================
    // إدارة قالب الحقول (المحدثة بالكامل مع خيار تحديد الاتجاه)
    // ===================================
    async renderTemplates(area) {
        const { data, error } = await supabase.from('waybill_field_templates').select('*');
        if(error) return this.toast("خطأ في جلب القوالب", "danger");

        let html = `<div class="card"><h3>تخصيص أسماء واتجاهات الحقول (مركزياً لكافة الفروع)</h3>
        <p style="color:#64748b; font-size:0.9rem; margin-bottom:15px;">تعديل التسميات أو الاتجاه هنا سيغير واجهة جميع الموظفين في جميع الفروع فوراً دون المساس بدقة التصميم الورقي للطباعة.</p>
        <table class="data-table"><thead><tr><th>معرف الحقل التقني</th><th>الاسم البديل في الواجهة (Label)</th><th>محاذاة النص والاتجاه</th><th>حقل إجباري؟</th><th>مخفي؟</th><th>حفظ التعديل</th></tr></thead><tbody>`;
        
        const demoFields = ['consignee_name', 'shipper_name', 'goods_desc', 'notes', 'pieces'];
        demoFields.forEach(id => {
            const t = data?.find(x => x.field_id === id) || { label: '', is_required: false, is_visible: true, text_align: 'right' };
            html += `<tr>
                <td style="direction:ltr; text-align:right;"><strong>${id}</strong></td>
                <td><input type="text" class="form-control" id="lbl_${id}" value="${t.label || ''}" placeholder="الاسم الافتراضي" style="margin:0; padding:6px; width:140px;"></td>
                <td>
                    <select id="align_${id}" class="form-control" style="padding:6px; margin:0; width:100px;">
                        <option value="right" ${t.text_align === 'right' || !t.text_align ? 'selected' : ''}>يمين 👉</option>
                        <option value="center" ${t.text_align === 'center' ? 'selected' : ''}>وسط ↩️</option>
                        <option value="left" ${t.text_align === 'left' ? 'selected' : ''}>يسار 👈</option>
                    </select>
                </td>
                <td><input type="checkbox" id="req_${id}" ${t.is_required ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;"></td>
                <td><input type="checkbox" id="vis_${id}" ${!t.is_visible ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;"></td>
                <td><button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;" onclick="AdminApp.saveTemplate('${id}')"><i class="fas fa-save"></i> تحديث</button></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    },

    async saveTemplate(id) {
        const label = document.getElementById(`lbl_${id}`).value;
        const align = document.getElementById(`align_${id}`).value;
        const is_req = document.getElementById(`req_${id}`).checked;
        const is_vis = !document.getElementById(`vis_${id}`).checked; 

        const { error } = await supabase.from('waybill_field_templates').upsert({
            field_id: id, label: label, text_align: align, is_required: is_req, is_visible: is_vis
        });
        if(error) this.toast("خطأ في حفظ إعدادات الحقل", "danger");
        else this.toast("تم التحديث المركزي بنجاح، وسيطبق فوراً عند جميع الموظفين", "success");
    },

    // ===================================
    // سجل المراقبة والتدقيق الأمني (Audit Log)
    // ===================================
    async renderAudit(area) {
        const { data, error } = await supabase.from('audit_logs').select('*, branches(name)').order('created_at', { ascending: false }).limit(50);
        if(error) return this.toast("خطأ في جلب سجل المراقبة", "danger");
        
        let html = `<div class="card"><h3>سجل المراقبة والتدقيق الأمني الحي (آخر 50 حركة للنظام)</h3>
        <table class="data-table" style="font-size:0.9rem;"><thead><tr><th>الوقت والتاريخ</th><th>الموظف/المسؤول</th><th>الفرع</th><th>نوع العملية المسجلة</th></tr></thead><tbody>`;
        data.forEach(log => {
            const time = new Date(log.created_at).toLocaleString('ar-YE');
            let actionAr = log.action === 'login' ? 'تسجيل دخول آمن للنظام' : log.action;
            html += `<tr>
                <td><span style="color:#64748b; direction:ltr; display:inline-block;">${time}</span></td>
                <td><strong>${log.username}</strong></td>
                <td>${log.branches?.name || 'إدارة النظام العامة'}</td>
                <td><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:4px; font-weight:bold;">${actionAr}</span></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        area.innerHTML = html;
    }
};

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
