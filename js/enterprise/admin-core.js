import { supabase } from '../config/supabase.js';
import { AuthCore } from './auth-core.js';

const FIELD_CATALOG = [
  { id: 'awb_no', label: 'رقم البوليصة', group: 'معلومات الشحنة' },
  { id: 'origin', label: 'المصدر', group: 'معلومات الشحنة' },
  { id: 'destination', label: 'الاتجاه', group: 'معلومات الشحنة' },
  { id: 'pieces', label: 'عدد القطع', group: 'معلومات الشحنة' },
  { id: 'weight', label: 'الوزن', group: 'معلومات الشحنة' },
  { id: 'dimension', label: 'الأبعاد', group: 'معلومات الشحنة' },
  { id: 'date', label: 'التاريخ', group: 'معلومات الشحنة' },
  { id: 'consignee_name', label: 'المرسل إليه', group: 'الأطراف' },
  { id: 'shipper_name', label: 'المرسل', group: 'الأطراف' },
  { id: 'notify_parties', label: 'الطرف المستفيد', group: 'الأطراف' },
  { id: 'goods_desc', label: 'وصف الشحنة', group: 'معلومات الشحنة' },
  { id: 'shipper_ac', label: 'حساب المرسل', group: 'طريقة الدفع' },
  { id: 'consignee_ac', label: 'حساب المرسل إليه', group: 'طريقة الدفع' },
  { id: 'consignee_tel', label: 'هاتف المستلم', group: 'الأطراف' },
  { id: 'consignee_mob', label: 'جوال المستلم', group: 'الأطراف' },
  { id: 'shipper_tel', label: 'هاتف المرسل', group: 'الأطراف' },
  { id: 'shipper_mob', label: 'جوال المرسل', group: 'الأطراف' },
  { id: 'stc_pod_1', label: 'حساب قصير الأجل 1', group: 'طريقة الدفع' },
  { id: 'stc_pod_2', label: 'حساب قصير الأجل 2', group: 'طريقة الدفع' },
  { id: 'prepaid', label: 'نقدًا / مدفوع مقدمًا', group: 'طريقة الدفع' },
  { id: 'cod', label: 'الدفع عند التسليم', group: 'طريقة الدفع' },
  { id: 'received_condition', label: 'استلمت بوضع جيد', group: 'التواقيع' },
  { id: 'receiver_name_sig', label: 'اسم المستلم', group: 'التواقيع' },
  { id: 'receiver_signature', label: 'توقيع المستلم', group: 'التواقيع' },
  { id: 'receiver_date', label: 'تاريخ الاستلام', group: 'التواقيع' },
  { id: 'shipper_signature', label: 'توقيع المرسل', group: 'التواقيع' },
  { id: 'shipper_date', label: 'تاريخ توقيع المرسل', group: 'التواقيع' },
  { id: 'durrat_received', label: 'استلام الشركة', group: 'التواقيع' },
  { id: 'durrat_date', label: 'تاريخ استلام الشركة', group: 'التواقيع' },
  { id: 'driver_name', label: 'اسم السائق', group: 'المركبة والمبالغ' },
  { id: 'driver_id', label: 'رقم الهوية', group: 'المركبة والمبالغ' },
  { id: 'truck_no', label: 'رقم السيارة', group: 'المركبة والمبالغ' },
  { id: 'truck_model', label: 'موديل السيارة', group: 'المركبة والمبالغ' },
  { id: 'truck_kind', label: 'نوع السيارة', group: 'المركبة والمبالغ' },
  { id: 'insurance_type', label: 'نوع التأمين', group: 'المركبة والمبالغ' },
  { id: 'freight_charges', label: 'أجور الشحن', group: 'المركبة والمبالغ' },
  { id: 'local_phone', label: 'رقم هاتف محلي', group: 'المركبة والمبالغ' },
  { id: 'intl_phone', label: 'رقم هاتف دولي', group: 'المركبة والمبالغ' },
  { id: 'notes', label: 'الملاحظات', group: 'المركبة والمبالغ' },
  { id: 'amount', label: 'القيمة', group: 'المركبة والمبالغ' },
  { id: 'barcode_zone', label: 'الباركود', group: 'الأكواد' },
  { id: 'qrcode_zone', label: 'QR Code', group: 'الأكواد' }
];

const AdminApp = {
  currentSection: 'dashboard',
  isBusy: false,

  async init() {
    try {
      const isAuth = await AuthCore.init();
      if (!isAuth) return;
      this.createModalContainer();
      await this.logAction('admin_open', 'admin', null, { page: 'admin.html' });
      this.showSection('dashboard');
    } catch (error) {
      console.error('خطأ في تهيئة الإدارة:', error);
      this.toast('تعذر فتح لوحة الإدارة: ' + (error.message || error), 'error');
    }
  },

  getSession() {
    try { return JSON.parse(localStorage.getItem('enterprise_session') || '{}'); }
    catch { return {}; }
  },

  async logAction(action, entity = 'system', entityId = null, details = {}) {
    try {
      const session = this.getSession();
      await supabase.rpc('log_app_event', {
        p_username: session?.user?.username || localStorage.getItem('waybill_active_user') || 'unknown',
        p_role: session?.user?.role || 'unknown',
        p_branch_code: session?.branch?.code || localStorage.getItem('waybill_branch_prefix') || null,
        p_branch_name: session?.branch?.name || localStorage.getItem('waybill_branch_title') || null,
        p_action: action,
        p_entity: entity,
        p_entity_id: entityId,
        p_details: details,
        p_user_agent: navigator.userAgent
      });
    } catch (e) {
      console.warn('تعذر تسجيل العملية:', e);
    }
  },

  toast(msg, type = 'success') {
    let box = document.getElementById('admin-toast-container');
    if (!box) {
      box = document.createElement('div');
      box.id = 'admin-toast-container';
      box.style.cssText = 'position:fixed;top:18px;left:18px;z-index:9999999;display:flex;flex-direction:column;gap:10px;max-width:420px;';
      document.body.appendChild(box);
    }
    const colors = { success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#0284c7' };
    const el = document.createElement('div');
    el.style.cssText = `background:${colors[type] || colors.success};color:white;padding:13px 16px;border-radius:14px;box-shadow:0 16px 38px rgba(0,0,0,.28);font-weight:800;line-height:1.6;animation:toastIn .25s ease both;`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  },

  setBusy(button, busy, text = 'جاري الحفظ...') {
    if (!button) return;
    if (busy) {
      button.dataset.oldHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    } else {
      button.disabled = false;
      if (button.dataset.oldHtml) button.innerHTML = button.dataset.oldHtml;
    }
  },

  createModalContainer() {
    if (document.getElementById('ent-modal')) return;
    const m = document.createElement('div');
    m.id = 'ent-modal';
    m.className = 'ent-modal-overlay';
    m.innerHTML = `
      <div class="ent-modal-box">
        <div class="ent-modal-header">
          <h3 id="ent-modal-title">العنوان</h3>
          <button onclick="AdminApp.closeModal()" style="background:none;border:none;font-size:1.8rem;cursor:pointer;color:var(--danger);transition:.2s;">&times;</button>
        </div>
        <div class="ent-modal-body" id="ent-modal-body"></div>
        <div class="ent-modal-footer" id="ent-modal-footer"></div>
      </div>`;
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
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 250);
  },

  async showSection(section) {
    this.currentSection = section;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(section));
    if (activeLink) activeLink.classList.add('active');

    const area = document.getElementById('content-area');
    if (!area) return;

    const titles = {
      dashboard: 'الرئيسية', branches: 'إدارة الفروع', users: 'إدارة المستخدمين', templates: 'تخصيص الحقول', audit: 'سجل العمليات', updates: 'التحديثات', delete_requests: 'طلبات الحذف'
    };
    document.getElementById('page-title').innerText = titles[section] || section;
    area.innerHTML = '<div style="display:flex;justify-content:center;padding:100px;"><div class="spinner"></div></div>';

    try {
      switch (section) {
        case 'branches': await this.renderBranches(area); break;
        case 'users': await this.renderUsers(area); break;
        case 'templates': await this.renderTemplates(area); break;
        case 'audit': await this.renderAudit(area); break;
        default: this.renderDashboard(area); break;
      }
    } catch (error) {
      area.innerHTML = `<div class="card glass-panel" style="color:var(--danger);line-height:1.8;"><h3>حدث خطأ</h3><p>${error.message || error}</p></div>`;
    }
  },

  renderDashboard(area) {
    area.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
        <div class="card glass-panel"><h3 style="color:var(--primary);margin-bottom:10px;"><i class="fas fa-satellite-dish"></i> الحالة السحابية</h3><p style="color:var(--text-muted);line-height:1.8;">النظام متصل بقاعدة بيانات Supabase. أي خطأ في الحفظ سيظهر لك نصه الحقيقي بدل أن يفشل بصمت.</p></div>
        <div class="card glass-panel"><h3 style="color:var(--accent);margin-bottom:10px;"><i class="fas fa-shield-alt"></i> سجل ومراقبة</h3><p style="color:var(--text-muted);line-height:1.8;">تمت إضافة سجل دخول وخروج وحفظ وإدارة للمستخدمين والفروع لتعرف من دخل ومتى.</p></div>
        <div class="card glass-panel"><h3 style="color:var(--warning);margin-bottom:10px;"><i class="fas fa-sliders-h"></i> تخصيص الحقول</h3><p style="color:var(--text-muted);line-height:1.8;">الأسماء الآن مترجمة بالعربية. الحفظ يطبّق على الواجهة الرئيسية عند إعادة تحميلها.</p></div>
      </div>`;
  },

  async renderBranches(area) {
    const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
    if (error) throw new Error('فشل جلب الفروع: ' + error.message);
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <h3 style="margin:0;"><i class="fas fa-code-branch" style="color:var(--primary);"></i> فروع المؤسسة</h3>
        <button class="btn btn-primary" onclick="AdminApp.openBranchForm()"><i class="fas fa-plus-circle"></i> إضافة فرع</button>
      </div>
      <table class="data-table"><thead><tr><th>كود الفرع</th><th>اسم الفرع</th><th>تسلسل بداية البوليصة</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>
      ${(data || []).map(b => `<tr><td><strong style="color:var(--primary);direction:ltr;display:inline-block;">${this.escape(b.code)}</strong></td><td>${this.escape(b.name)}</td><td>${b.start_seq ?? ''}</td><td><span style="color:${b.is_active ? 'var(--accent)' : 'var(--danger)'};font-weight:bold;">${b.is_active ? 'نشط' : 'موقوف'}</span></td><td style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn btn-info" style="padding:6px 12px;font-size:.8rem;" onclick='AdminApp.openBranchForm(${JSON.stringify(b)})'><i class="fas fa-edit"></i> تعديل</button><button class="btn btn-outline" style="padding:6px 12px;font-size:.8rem;" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})"><i class="fas fa-sync-alt"></i> ${b.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  },

  openBranchForm(branch = null) {
    const isEdit = !!branch;
    const body = `
      <input type="hidden" id="b_id" value="${branch?.id || ''}">
      <div class="form-group"><label>كود الفرع <small style="color:var(--text-muted);">مثال: MAIN أو TAIZ</small></label><input type="text" id="b_code" class="form-control" value="${this.escape(branch?.code || '')}" placeholder="MAIN" autocomplete="off"></div>
      <div class="form-group"><label>اسم الفرع بالعربي</label><input type="text" id="b_name" class="form-control" value="${this.escape(branch?.name || '')}" placeholder="الإدارة الرئيسية" autocomplete="off"></div>
      <div class="form-group"><label>تسلسل بداية البوليصة</label><input type="number" id="b_seq" class="form-control" value="${branch?.start_seq ?? 10000}" min="1"></div>`;
    const footer = `<button class="btn btn-primary" id="save-branch-btn" style="width:100%;justify-content:center;" onclick="AdminApp.saveBranch(this)"><i class="fas fa-save"></i> ${isEdit ? 'حفظ تعديل الفرع' : 'حفظ الفرع الجديد'}</button>`;
    this.openModal(isEdit ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد', body, footer);
  },

  async saveBranch(button) {
    const id = (document.getElementById('b_id')?.value || '').trim();
    const code = (document.getElementById('b_code').value || '').trim().toUpperCase();
    const name = (document.getElementById('b_name').value || '').trim();
    const seq = parseInt(document.getElementById('b_seq').value || '10000', 10);
    if (!/^[A-Z0-9_-]{2,20}$/.test(code)) return this.toast('كود الفرع يجب أن يكون إنجليزي/أرقام من 2 إلى 20 حرفًا مثل MAIN أو TAIZ', 'error');
    if (!name) return this.toast('اكتب اسم الفرع', 'error');
    this.setBusy(button, true);
    try {
      let res;
      if (id) {
        res = await supabase.rpc('update_branch', { p_branch_id: id, p_code: code, p_name: name, p_start_seq: seq });
        if (res.error) res = await supabase.from('branches').update({ code, name, start_seq: seq }).eq('id', id);
      } else {
        res = await supabase.rpc('create_branch', { p_code: code, p_name: name, p_start_seq: seq });
        if (res.error) res = await supabase.from('branches').insert([{ code, name, start_seq: seq, is_active: true }]);
      }
      if (res.error) throw res.error;
      await this.logAction(id ? 'update_branch' : 'create_branch', 'branches', code, { code, name, start_seq: seq });
      this.toast(id ? 'تم تعديل الفرع بنجاح' : 'تم حفظ الفرع بنجاح', 'success');
      this.closeModal();
      this.showSection('branches');
    } catch (error) {
      this.toast('فشل حفظ الفرع: ' + this.friendlyError(error), 'error');
    } finally { this.setBusy(button, false); }
  },

  async renderUsers(area) {
    const { data, error } = await supabase.from('app_users').select('*, branches(name)').order('created_at', { ascending: false });
    if (error) throw new Error('فشل جلب المستخدمين: ' + error.message);
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <h3 style="margin:0;"><i class="fas fa-users" style="color:var(--accent);"></i> إدارة المستخدمين والصلاحيات</h3>
        <button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> مستخدم جديد</button>
      </div>
      <table class="data-table"><thead><tr><th>اسم المستخدم</th><th>الفرع</th><th>الصلاحية</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>
      ${(data || []).map(u => `<tr><td><strong style="color:var(--primary);direction:ltr;display:inline-block;">${this.escape(u.username)}</strong></td><td>${this.escape(u.branches?.name || u.branch_code || 'عام')}</td><td>${this.roleLabel(u.role)}</td><td><span style="color:${u.is_active ? 'var(--accent)' : 'var(--danger)'};font-weight:bold;">${u.is_active ? 'مصرح له' : 'موقوف'}</span></td><td style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn btn-info" style="padding:6px 12px;font-size:.8rem;" onclick='AdminApp.openUserForm(${JSON.stringify(u)})'><i class="fas fa-user-edit"></i> تعديل</button><button class="btn btn-outline" style="padding:6px 12px;font-size:.8rem;" onclick="AdminApp.toggleUserStatus('${u.id}', ${!u.is_active})"><i class="fas fa-ban"></i> ${u.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  },

  async openUserForm(user = null) {
    const { data: branches, error } = await supabase.from('branches').select('code, name').eq('is_active', true).order('name');
    if (error) return this.toast('فشل تحميل الفروع: ' + error.message, 'error');
    if (!branches || branches.length === 0) return this.toast('لا يوجد فروع نشطة. أضف فرعًا أولًا.', 'warning');
    const branchOptions = branches.map(b => `<option value="${this.escape(b.code)}" ${user?.branch_code === b.code ? 'selected' : ''} style="background:#0f172a;">${this.escape(b.name)} - ${this.escape(b.code)}</option>`).join('');
    const roleOptions = [
      ['employee','موظف إدخال'], ['branch_manager','مدير فرع'], ['super_admin','مدير نظام']
    ].map(([v,l]) => `<option value="${v}" ${user?.role === v ? 'selected' : ''} style="background:#0f172a;">${l}</option>`).join('');
    const body = `
      <input type="hidden" id="u_id" value="${user?.id || ''}">
      <div class="form-group"><label>الفرع التابع له المستخدم</label><select id="u_branch" class="form-control">${branchOptions}</select></div>
      <div class="form-group"><label>اسم المستخدم للدخول <small style="color:var(--text-muted);">إنجليزي بدون مسافات، ويمكن تعديله هنا</small></label><input type="text" id="u_name" class="form-control" value="${this.escape(user?.username || '')}" placeholder="ali_taiz" autocomplete="off"></div>
      <div class="form-group"><label>كلمة المرور ${user ? '<small style="color:var(--text-muted);">اتركها فارغة إذا لا تريد تغييرها</small>' : ''}</label><input type="password" id="u_pass" class="form-control" autocomplete="new-password"></div>
      <div class="form-group"><label>الصلاحية</label><select id="u_role" class="form-control">${roleOptions}</select></div>`;
    const footer = `<button class="btn btn-primary" id="save-user-btn" style="width:100%;justify-content:center;" onclick="AdminApp.saveUser(this)"><i class="fas fa-lock"></i> ${user ? 'حفظ تعديل المستخدم' : 'حفظ المستخدم'}</button>`;
    this.openModal(user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد', body, footer);
  },

  async saveUser(button) {
    const id = (document.getElementById('u_id')?.value || '').trim();
    const b = document.getElementById('u_branch').value;
    const u = (document.getElementById('u_name').value || '').trim().toLowerCase();
    const p = document.getElementById('u_pass').value || '';
    const r = document.getElementById('u_role').value;
    if (!/^[a-z0-9_.-]{3,30}$/.test(u)) return this.toast('اسم المستخدم يجب أن يكون إنجليزيًا من 3 إلى 30 حرفًا بدون مسافات', 'error');
    if (!id && p.length < 4) return this.toast('كلمة المرور قصيرة جدًا. اكتب 4 أحرف على الأقل.', 'error');
    this.setBusy(button, true);
    try {
      let res;
      if (id) {
        res = await supabase.rpc('update_app_user', { p_user_id: id, p_branch_code: b, p_username: u, p_password: p || null, p_role: r });
      } else {
        res = await supabase.rpc('create_app_user', { p_branch_code: b, p_username: u, p_password: p, p_role: r });
      }
      if (res.error) throw res.error;
      const resultText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || '');
      if (/exists|already|موجود/i.test(resultText)) throw new Error('اسم المستخدم موجود مسبقًا');
      await this.logAction(id ? 'update_user' : 'create_user', 'app_users', u, { username: u, branch_code: b, role: r });
      this.toast(id ? 'تم تعديل المستخدم بنجاح' : 'تم حفظ المستخدم بنجاح', 'success');
      this.closeModal();
      this.showSection('users');
    } catch (error) {
      this.toast('فشل حفظ المستخدم: ' + this.friendlyError(error), 'error');
    } finally { this.setBusy(button, false); }
  },

  async renderTemplates(area) {
    const { data, error } = await supabase.from('waybill_field_templates').select('*');
    if (error) throw new Error('فشل تحميل تخصيص الحقول: ' + error.message);
    const byId = new Map((data || []).map(x => [x.field_id, x]));
    const groups = FIELD_CATALOG.reduce((acc, f) => { (acc[f.group] ||= []).push(f); return acc; }, {});
    const rows = Object.entries(groups).map(([group, fields]) => `
      <tr><td colspan="7" style="background:rgba(56,189,248,.08);font-weight:900;color:var(--accent);"><i class="fas fa-folder-open"></i> ${group}</td></tr>
      ${fields.map(f => this.templateRow(f, byId.get(f.id))).join('')}
    `).join('');
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;line-height:1.8;"><div><h3 style="margin-bottom:8px;"><i class="fas fa-sliders-h" style="color:var(--warning);"></i> تخصيص أسماء وظهور ومحاذاة الحقول</h3><p style="color:var(--text-muted);">هذه الإعدادات مركزية. عند الحفظ ثم الضغط على زر التحديث ستصل للفروع، وسيتم تطبيق الاسم والإجباري/المخفي والمحاذاة يمين/وسط/يسار في واجهة البوليصة.</p></div><button class="btn btn-warning" onclick="AdminApp.broadcastTemplatesUpdate(this)"><i class="fas fa-bullhorn"></i> تطبيق التحديث على كل الفروع</button></div>
      <table class="data-table"><thead><tr><th>اسم الحقل بالعربي</th><th>الكود البرمجي</th><th>الاسم المعروض للموظف</th><th>محاذاة النص</th><th>إجباري؟</th><th>مخفي؟</th><th>حفظ</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  },

  templateRow(field, t = {}) {
    const label = t.label ?? field.label;
    const align = t.text_align || 'right';
    const visible = t.is_visible !== false;
    return `<tr>
      <td>${this.escape(field.label)}</td>
      <td style="direction:ltr;text-align:right;"><code style="color:var(--warning);background:rgba(0,0,0,.28);padding:4px 8px;border-radius:6px;">${field.id}</code></td>
      <td><input type="text" class="form-control" id="lbl_${field.id}" value="${this.escape(label)}" style="padding:8px;margin:0;min-width:160px;"></td>
      <td><select id="align_${field.id}" class="form-control" style="padding:8px;margin:0;min-width:100px;"><option value="right" ${align === 'right' ? 'selected' : ''}>يمين</option><option value="center" ${align === 'center' ? 'selected' : ''}>وسط</option><option value="left" ${align === 'left' ? 'selected' : ''}>يسار</option></select></td>
      <td style="text-align:center;"><input type="checkbox" id="req_${field.id}" ${t.is_required ? 'checked' : ''} style="transform:scale(1.45);accent-color:var(--primary);"></td>
      <td style="text-align:center;"><input type="checkbox" id="vis_${field.id}" ${!visible ? 'checked' : ''} style="transform:scale(1.45);accent-color:var(--danger);"></td>
      <td><button class="btn btn-outline" style="padding:7px 12px;font-size:.82rem;" onclick="AdminApp.saveTemplate('${field.id}', this)"><i class="fas fa-save"></i> حفظ</button></td>
    </tr>`;
  },

  async saveTemplate(id, button) {
    const field = FIELD_CATALOG.find(f => f.id === id);
    const lbl = (document.getElementById(`lbl_${id}`).value || field?.label || id).trim();
    const align = document.getElementById(`align_${id}`).value;
    const req = document.getElementById(`req_${id}`).checked;
    const visible = !document.getElementById(`vis_${id}`).checked;
    this.setBusy(button, true, 'حفظ...');
    try {
      const { error } = await supabase.from('waybill_field_templates').upsert({ field_id: id, label: lbl, text_align: align, is_required: req, is_visible: visible, updated_at: new Date().toISOString() }, { onConflict: 'field_id' });
      if (error) throw error;
      await this.logAction('update_field_template', 'waybill_field_templates', id, { field_id: id, label: lbl, text_align: align, is_required: req, is_visible: visible });
      this.toast('تم حفظ تخصيص الحقل. اضغط تحديث الفروع لتطبيقه على الأجهزة المفتوحة.', 'success');
    } catch (error) {
      this.toast('فشل حفظ تخصيص الحقل: ' + (error.message || error), 'error');
    } finally { this.setBusy(button, false); }
  },

  async broadcastTemplatesUpdate(button) {
    this.setBusy(button, true, 'إرسال...');
    try {
      const version = 'fields-' + Date.now();
      const { error } = await supabase.from('system_updates').insert([{ version, title: 'تحديث إعدادات الحقول', message: 'تم تحديث أسماء أو محاذاة أو إلزامية بعض حقول البوليصة من الإدارة. سيتم تطبيق التعديل بدون حذف الأرشيف أو البوالص المحفوظة.', is_required: true, is_active: true }]);
      if (error) throw error;
      await this.logAction('broadcast_field_templates_update', 'system_updates', version, { version });
      this.toast('تم إرسال تحديث إجباري للفروع. عند ضغط تحديث الآن ستظهر التعديلات مباشرة.', 'success');
    } catch (error) {
      this.toast('فشل إرسال التحديث: ' + this.friendlyError(error), 'error');
    } finally { this.setBusy(button, false); }
  },

  async renderAudit(area) {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) {
      area.innerHTML = `<div class="card glass-panel" style="line-height:1.9;"><h3 style="color:var(--warning);"><i class="fas fa-triangle-exclamation"></i> سجل العمليات غير مفعّل بعد</h3><p style="color:var(--text-muted);">شغّل ملف SQL المرفق: <b>admin_audit_fix.sql</b> داخل Supabase SQL Editor، ثم عد إلى هذه الصفحة.</p><p style="color:var(--danger);direction:ltr;text-align:left;">${this.escape(error.message)}</p></div>`;
      return;
    }
    const actionLabels = { login_success: 'دخول ناجح', login_failed: 'محاولة دخول فاشلة', logout: 'خروج', admin_open: 'فتح لوحة الإدارة', create_branch: 'إضافة فرع', create_user: 'إضافة مستخدم', update_field_template: 'تعديل حقل', toggle_user_status: 'تغيير حالة مستخدم', toggle_branch_status: 'تغيير حالة فرع', save_waybill: 'حفظ بوليصة' };
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;"><h3 style="margin:0;"><i class="fas fa-history" style="color:var(--info);"></i> سجل دخول وحركة النظام</h3><button class="btn btn-info" onclick="AdminApp.showSection('audit')"><i class="fas fa-rotate"></i> تحديث</button></div>
      <table class="data-table"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الفرع</th><th>العملية</th><th>البيان</th></tr></thead><tbody>
      ${(data || []).map(row => `<tr><td>${this.formatDate(row.created_at)}</td><td>${this.escape(row.username || '')}<br><small style="color:var(--text-muted);">${this.roleLabel(row.role || '')}</small></td><td>${this.escape(row.branch_name || row.branch_code || '-')}</td><td><strong style="color:var(--accent);">${actionLabels[row.action] || this.escape(row.action || '')}</strong></td><td style="direction:rtl;max-width:360px;white-space:normal;">${this.describeDetails(row)}</td></tr>`).join('')}
      </tbody></table></div>`;
  },

  async toggleUserStatus(id, status) {
    try {
      let res = await supabase.rpc('set_user_status', { p_user_id: id, p_status: status });
      if (res.error) res = await supabase.from('app_users').update({ is_active: status }).eq('id', id);
      if (res.error) throw res.error;
      await this.logAction('toggle_user_status', 'app_users', id, { is_active: status });
      this.toast(status ? 'تم تفعيل المستخدم' : 'تم إيقاف المستخدم', 'success');
      this.showSection('users');
    } catch (error) { this.toast('فشل تغيير حالة المستخدم: ' + (error.message || error), 'error'); }
  },

  async toggleBranchStatus(id, status) {
    try {
      let res = await supabase.rpc('set_branch_status', { p_branch_id: id, p_status: status });
      if (res.error) res = await supabase.from('branches').update({ is_active: status }).eq('id', id);
      if (res.error) throw res.error;
      await this.logAction('toggle_branch_status', 'branches', id, { is_active: status });
      this.toast(status ? 'تم تفعيل الفرع' : 'تم إيقاف الفرع', 'success');
      this.showSection('branches');
    } catch (error) { this.toast('فشل تغيير حالة الفرع: ' + (error.message || error), 'error'); }
  },

  roleLabel(role) {
    return ({ super_admin: 'مدير نظام', branch_manager: 'مدير فرع', employee: 'موظف إدخال' }[role] || role || '-');
  },

  formatDate(value) {
    try { return new Date(value).toLocaleString('ar-YE', { hour12: true }); }
    catch { return value || '-'; }
  },

  describeDetails(row) {
    const d = row.details || {};
    if (row.action === 'login_success') return 'تم الدخول للنظام بنجاح';
    if (row.action === 'login_failed') return this.escape(d.reason || 'فشل الدخول');
    if (row.action === 'create_user') return `مستخدم: <b>${this.escape(d.username || '')}</b> / فرع: ${this.escape(d.branch_code || '')}`;
    if (row.action === 'create_branch') return `فرع: <b>${this.escape(d.name || '')}</b> / كود: ${this.escape(d.code || '')}`;
    if (row.action === 'update_field_template') return `الحقل: <b>${this.escape(d.label || row.entity_id || '')}</b>`;
    if (row.action === 'save_waybill') return `رقم البوليصة: <b>${this.escape(d.awb_no || row.entity_id || '')}</b>`;
    return this.escape(JSON.stringify(d));
  },

  escape(v) {
    return String(v ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }
};


// ==========================================================
// إضافات نهائية للإدارة: رسائل التحديثات وطلبات حذف البوالص
// ==========================================================
(function attachFinalAdminFeatures(){
  const originalShowSection = AdminApp.showSection.bind(AdminApp);

  AdminApp.showSection = async function(section) {
    if (section === 'updates' || section === 'delete_requests') {
      this.currentSection = section;
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(section));
      if (activeLink) activeLink.classList.add('active');
      const area = document.getElementById('content-area');
      const title = section === 'updates' ? 'إدارة التحديثات' : 'طلبات حذف البوالص';
      const pageTitle = document.getElementById('page-title');
      if (pageTitle) pageTitle.innerText = title;
      area.innerHTML = '<div style="display:flex;justify-content:center;padding:100px;"><div class="spinner"></div></div>';
      try {
        if (section === 'updates') await this.renderUpdates(area);
        if (section === 'delete_requests') await this.renderDeleteRequests(area);
      } catch (error) {
        area.innerHTML = `<div class="card glass-panel" style="color:var(--danger);line-height:1.8;"><h3>حدث خطأ</h3><p>${this.escape(error.message || error)}</p></div>`;
      }
      return;
    }
    return originalShowSection(section);
  };

  AdminApp.renderUpdates = async function(area) {
    const { data, error } = await supabase.from('system_updates').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error('جدول التحديثات غير مفعّل بعد. شغّل ملف SQL النهائي. التفاصيل: ' + error.message);
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
        <div><h3 style="margin:0;color:var(--text-main);"><i class="fas fa-bullhorn" style="color:var(--warning);"></i> رسائل التحديث الإجباري للفروع</h3><p style="color:var(--text-muted);margin-top:8px;line-height:1.8;">عند نشر تحديث جديد، أنشئ رسالة هنا. ستظهر لجميع الفروع عند فتح النظام. التحديث يحذف الكاش فقط ولا يحذف الأرشيف أو البوالص.</p></div>
        <button class="btn btn-primary" onclick="AdminApp.openUpdateForm()"><i class="fas fa-plus-circle"></i> إرسال تحديث جديد</button>
      </div>
      <table class="data-table"><thead><tr><th>الحالة</th><th>الإصدار</th><th>العنوان</th><th>الرسالة</th><th>الفرع المستهدف</th><th>إجباري؟</th><th>الوقت</th><th>إجراء</th></tr></thead><tbody>
      ${(data || []).map(u => `<tr><td>${u.is_active ? '<span class="badge-active">نشط</span>' : '<span class="badge-off">متوقف</span>'}</td><td style="direction:ltr;color:var(--warning);font-weight:900;">${this.escape(u.version || '')}</td><td>${this.escape(u.title || '')}</td><td style="max-width:320px;white-space:normal;line-height:1.7;">${this.escape(u.message || '')}</td><td>${u.target_branch_code ? this.escape(u.target_branch_code) : 'كل الفروع'}</td><td>${u.is_required ? 'نعم' : 'لا'}</td><td>${this.formatDate(u.created_at)}</td><td><button class="btn btn-outline" onclick="AdminApp.toggleUpdate('${u.id}', ${!u.is_active})">${u.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px;">لا توجد تحديثات مرسلة بعد</td></tr>'}
      </tbody></table></div>`;
  };

  AdminApp.openUpdateForm = async function() {
    let branches = [];
    try { const res = await supabase.from('branches').select('code,name').eq('is_active', true).order('name'); branches = res.data || []; } catch(e) {}
    const body = `<div class="form-group"><label>رقم الإصدار أو اسم التحديث</label><input id="up_version" class="form-control" value="v${new Date().toISOString().slice(0,10).replaceAll('-','')}" placeholder="مثال: v20260706"></div>
      <div class="form-group"><label>عنوان الرسالة</label><input id="up_title" class="form-control" value="تحديث مهم للنظام"></div>
      <div class="form-group"><label>نص الرسالة للفروع</label><textarea id="up_message" class="form-control" rows="4">تم إصدار تحديث جديد للنظام. اضغط تحديث الآن لتطبيق التحديث بدون حذف الأرشيف أو البوالص المحفوظة.</textarea></div>
      <div class="form-group"><label>استهداف فرع محدد</label><select id="up_branch" class="form-control"><option value="">كل الفروع</option>${branches.map(b => `<option value="${this.escape(b.code)}">${this.escape(b.name)} - ${this.escape(b.code)}</option>`).join('')}</select></div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;"><input type="checkbox" id="up_required" checked style="transform:scale(1.4);accent-color:var(--danger);"><label for="up_required">تحديث إجباري لا يسمح بتجاهله</label></div>`;
    const footer = `<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="AdminApp.saveUpdate(this)"><i class="fas fa-paper-plane"></i> إرسال التحديث للفروع</button>`;
    this.openModal('إرسال تحديث للنظام', body, footer);
  };

  AdminApp.saveUpdate = async function(button) {
    this.setBusy(button, true, 'جاري الإرسال...');
    try {
      const session = this.getSession();
      const payload = {
        version: document.getElementById('up_version').value.trim() || ('v' + Date.now()),
        title: document.getElementById('up_title').value.trim() || 'تحديث جديد للنظام',
        message: document.getElementById('up_message').value.trim() || 'يوجد تحديث جديد للنظام.',
        target_branch_code: document.getElementById('up_branch').value || null,
        is_required: document.getElementById('up_required').checked,
        is_active: true,
        created_by: session?.user?.username || 'admin'
      };
      const { error } = await supabase.from('system_updates').insert(payload);
      if (error) throw error;
      await this.logAction('create_system_update', 'system_updates', payload.version, payload);
      this.toast('تم إرسال رسالة التحديث للفروع بنجاح', 'success');
      this.closeModal();
      this.showSection('updates');
    } catch(e) { this.toast('فشل إرسال التحديث: ' + (e.message || e), 'error'); }
    finally { this.setBusy(button, false); }
  };

  AdminApp.toggleUpdate = async function(id, status) {
    try {
      const { error } = await supabase.from('system_updates').update({ is_active: status }).eq('id', id);
      if (error) throw error;
      await this.logAction('toggle_system_update', 'system_updates', id, { is_active: status });
      this.toast(status ? 'تم تفعيل التحديث' : 'تم إيقاف التحديث', 'success');
      this.showSection('updates');
    } catch(e) { this.toast('فشل تغيير حالة التحديث: ' + (e.message || e), 'error'); }
  };

  AdminApp.renderDeleteRequests = async function(area) {
    const { data, error } = await supabase.from('delete_requests').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error('جدول طلبات الحذف غير مفعّل بعد. شغّل ملف SQL النهائي. التفاصيل: ' + error.message);
    const statusLabel = { pending: 'بانتظار القرار', approved: 'تمت الموافقة', rejected: 'مرفوض' };
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;"><div><h3 style="margin:0;"><i class="fas fa-trash-shield" style="color:var(--danger);"></i> طلبات حذف البوالص</h3><p style="color:var(--text-muted);line-height:1.8;margin-top:8px;">لا يستطيع الفرع حذف أي بوليصة من الأرشيف إلا بطلب موافقة. هنا يمكنك الموافقة أو الرفض وتسجيل القرار.</p></div><button class="btn btn-info" onclick="AdminApp.showSection('delete_requests')"><i class="fas fa-rotate"></i> تحديث</button></div>
      <table class="data-table"><thead><tr><th>الحالة</th><th>الوقت</th><th>الفرع</th><th>المستخدم</th><th>رقم البوليصة</th><th>السبب</th><th>قرار الإدارة</th></tr></thead><tbody>
      ${(data || []).map(r => `<tr><td><strong style="color:${r.status==='pending'?'var(--warning)':r.status==='approved'?'var(--accent)':'var(--danger)'};">${statusLabel[r.status] || r.status}</strong></td><td>${this.formatDate(r.created_at)}</td><td>${this.escape(r.branch_name || r.branch_code || '')}</td><td>${this.escape(r.requested_by || '')}</td><td style="direction:ltr;font-weight:900;color:var(--primary);">${this.escape(r.awb_no || '')}</td><td style="max-width:300px;white-space:normal;line-height:1.7;">${this.escape(r.reason || '')}</td><td>${r.status==='pending' ? `<button class="btn btn-primary" onclick="AdminApp.decideDeleteRequest('${r.id}','approved')"><i class="fas fa-check"></i> موافقة</button> <button class="btn btn-danger" onclick="AdminApp.decideDeleteRequest('${r.id}','rejected')"><i class="fas fa-times"></i> رفض</button>` : `${this.escape(r.approved_by || '-')}${r.decided_reason ? '<br><small>'+this.escape(r.decided_reason)+'</small>' : ''}`}</td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">لا توجد طلبات حذف</td></tr>'}
      </tbody></table></div>`;
  };

  AdminApp.decideDeleteRequest = async function(id, decision) {
    const reason = prompt(decision === 'approved' ? 'ملاحظة الموافقة:' : 'سبب الرفض:', decision === 'approved' ? 'تمت الموافقة من الإدارة الرئيسية' : 'تم الرفض من الإدارة الرئيسية');
    if (reason === null) return;
    try {
      const session = this.getSession();
      const { data, error } = await supabase.rpc('decide_waybill_delete', { p_request_id: id, p_status: decision, p_admin_username: session?.user?.username || 'admin', p_reason: reason });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'فشل تنفيذ القرار');
      await this.logAction(decision === 'approved' ? 'approve_delete_request' : 'reject_delete_request', 'delete_requests', id, { status: decision, reason });
      this.toast(decision === 'approved' ? 'تمت الموافقة على طلب الحذف' : 'تم رفض طلب الحذف', 'success');
      this.showSection('delete_requests');
    } catch(e) { this.toast('فشل حفظ القرار: ' + (e.message || e), 'error'); }
  };
})();

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());

/* =========================================================
   Durrat ERP V5 Enterprise Plus additions
   تقارير + صلاحيات + نسخ احتياطي + لوحة أمان
   ========================================================= */
(function attachEnterprisePlus(){
  const A = window.AdminApp;
  if (!A || A.__enterprisePlus) return;
  A.__enterprisePlus = true;

  const oldShow = A.showSection.bind(A);
  A.showSection = async function(section) {
    const plus = ['reports','permissions','backups','security'];
    if (!plus.includes(section)) return oldShow(section);
    this.currentSection = section;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(section));
    if (activeLink) activeLink.classList.add('active');
    const titles = { reports:'التقارير', permissions:'الصلاحيات', backups:'النسخ الاحتياطي', security:'الأمان' };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.innerText = titles[section] || section;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="display:flex;justify-content:center;padding:100px;"><div class="spinner"></div></div>';
    try {
      if (section === 'reports') return this.renderReports(area);
      if (section === 'permissions') return this.renderPermissions(area);
      if (section === 'backups') return this.renderBackups(area);
      if (section === 'security') return this.renderSecurity(area);
    } catch(e) {
      area.innerHTML = `<div class="card glass-panel" style="color:var(--danger);line-height:1.8"><h3>تعذر فتح القسم</h3><p>${this.escape ? this.escape(e.message || e) : (e.message || e)}</p></div>`;
    }
  };

  A.renderReports = async function(area) {
    let audit = [], branches = [];
    try { const r = await supabase.from('v_audit_daily').select('*').limit(80); if (r.error) throw r.error; audit = r.data || []; } catch(e) {}
    try { const b = await supabase.from('v_branch_activity_summary').select('*'); branches = b.data || []; } catch(e) {}
    const today = new Date().toISOString().slice(0,10);
    const todayRows = audit.filter(x => String(x.day).slice(0,10) === today);
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
        <div><h3><i class="fas fa-chart-line" style="color:var(--accent)"></i> التقارير التشغيلية</h3><p style="color:var(--text-muted);line-height:1.8">ملخص يومي لحركة الدخول، الحفظ، الطباعة، وطلبات الحذف حسب الفرع والمستخدم.</p></div>
        <button class="btn btn-info" onclick="AdminApp.exportReportCSV()"><i class="fas fa-file-csv"></i> تصدير CSV</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px;">
        <div class="glass-panel" style="padding:18px;border-radius:16px;"><b>عمليات اليوم</b><h2 style="color:var(--primary)">${todayRows.reduce((a,b)=>a+(b.total||0),0)}</h2></div>
        <div class="glass-panel" style="padding:18px;border-radius:16px;"><b>الفروع النشطة</b><h2 style="color:var(--accent)">${branches.length}</h2></div>
        <div class="glass-panel" style="padding:18px;border-radius:16px;"><b>آخر نشاط</b><h2 style="font-size:1rem;color:var(--warning)">${branches[0]?.last_activity ? this.formatDate(branches[0].last_activity) : '-'}</h2></div>
      </div>
      <h3 style="margin-bottom:10px">نشاط الفروع</h3>
      <table class="data-table"><thead><tr><th>الفرع</th><th>عمليات دخول</th><th>عمليات بوليصات</th><th>آخر نشاط</th></tr></thead><tbody>${branches.map(b=>`<tr><td>${this.escape(b.branch_code)}</td><td>${b.logins||0}</td><td>${b.waybill_actions||0}</td><td>${this.formatDate(b.last_activity)}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:25px;color:var(--text-muted)">لا توجد بيانات بعد</td></tr>'}</tbody></table>
      <h3 style="margin:25px 0 10px">تفصيل آخر العمليات اليومية</h3>
      <table class="data-table"><thead><tr><th>اليوم</th><th>الفرع</th><th>المستخدم</th><th>العملية</th><th>العدد</th></tr></thead><tbody>${audit.map(x=>`<tr><td>${x.day}</td><td>${this.escape(x.branch_code)}</td><td>${this.escape(x.username)}</td><td>${this.escape(x.action)}</td><td>${x.total}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:25px;color:var(--text-muted)">لا يوجد سجل عمليات</td></tr>'}</tbody></table>
    </div>`;
  };

  A.exportReportCSV = async function() {
    try {
      const { data, error } = await supabase.from('v_audit_daily').select('*').limit(2000);
      if (error) throw error;
      const rows = data || [];
      const csv = ['day,branch_code,username,action,total'].concat(rows.map(r => [r.day,r.branch_code,r.username,r.action,r.total].map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(','))).join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'durrat_report.csv'; a.click(); URL.revokeObjectURL(a.href);
      this.toast('تم تصدير التقرير', 'success');
    } catch(e) { this.toast('فشل تصدير التقرير: ' + (e.message || e), 'error'); }
  };

  A.renderPermissions = async function(area) {
    const [{data: users}, {data: perms}] = await Promise.all([
      supabase.from('app_users').select('username,role,branch_code,is_active').order('username'),
      supabase.from('user_permissions').select('*')
    ]);
    const map = new Map((perms||[]).map(p => [p.username, p]));
    const flags = [
      ['can_print','طباعة'],['can_archive','أرشفة'],['can_export','تصدير'],['can_delete_request','طلب حذف'],
      ['can_edit_fields','تعديل الحقول'],['can_manage_users','إدارة مستخدمين'],['can_manage_branches','إدارة فروع'],['can_view_reports','تقارير']
    ];
    area.innerHTML = `<div class="card glass-panel"><h3><i class="fas fa-user-lock" style="color:var(--warning)"></i> الصلاحيات التفصيلية</h3><p style="color:var(--text-muted);line-height:1.8">حدد صلاحيات كل مستخدم بدقة. هذه الصلاحيات محفوظة في قاعدة البيانات ويمكن تطوير الواجهة لتطبيقها على كل زر.</p>
    <table class="data-table"><thead><tr><th>المستخدم</th><th>الدور</th><th>الفرع</th>${flags.map(f=>`<th>${f[1]}</th>`).join('')}<th>حفظ</th></tr></thead><tbody>${(users||[]).map(u=>{const p=map.get(u.username)||{}; return `<tr><td style="direction:ltr;color:var(--primary);font-weight:900">${this.escape(u.username)}</td><td>${this.roleLabel ? this.roleLabel(u.role) : u.role}</td><td>${this.escape(u.branch_code||'')}</td>${flags.map(([k])=>`<td style="text-align:center"><input id="perm_${u.username}_${k}" type="checkbox" ${p[k] !== false ? 'checked' : ''} style="transform:scale(1.25);accent-color:var(--primary)"></td>`).join('')}<td><button class="btn btn-outline" onclick="AdminApp.savePermissions('${u.username}', this)"><i class="fas fa-save"></i> حفظ</button></td></tr>`}).join('')}</tbody></table></div>`;
  };

  A.savePermissions = async function(username, btn) {
    this.setBusy(btn, true, 'حفظ...');
    const keys = ['can_print','can_archive','can_export','can_edit_fields','can_delete_request','can_manage_users','can_manage_branches','can_view_reports'];
    const row = { username };
    keys.forEach(k => row[k] = !!document.getElementById(`perm_${username}_${k}`)?.checked);
    row.updated_at = new Date().toISOString();
    try {
      const { error } = await supabase.from('user_permissions').upsert(row, { onConflict: 'username' });
      if (error) throw error;
      await this.logAction('update_permissions', 'user_permissions', username, row);
      this.toast('تم حفظ الصلاحيات', 'success');
    } catch(e) { this.toast('فشل حفظ الصلاحيات: ' + (e.message || e), 'error'); }
    finally { this.setBusy(btn, false); }
  };

  A.renderBackups = async function(area) {
    const { data } = await supabase.from('system_backups').select('*').order('created_at', {ascending:false}).limit(80);
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h3><i class="fas fa-database" style="color:var(--accent)"></i> النسخ الاحتياطي</h3><p style="color:var(--text-muted);line-height:1.8">أنشئ لقطة احتياطية من الإعدادات المهمة. لا تستبدل النسخ الاحتياطي الخارجي، لكنها مفيدة للاسترجاع السريع.</p></div><button class="btn btn-primary" onclick="AdminApp.createBackup(this)"><i class="fas fa-cloud-upload-alt"></i> إنشاء نسخة الآن</button></div>
    <table class="data-table"><thead><tr><th>الوقت</th><th>العنوان</th><th>النوع</th><th>بواسطة</th><th>ملاحظات</th></tr></thead><tbody>${(data||[]).map(b=>`<tr><td>${this.formatDate(b.created_at)}</td><td>${this.escape(b.title||'')}</td><td>${this.escape(b.backup_type||'')}</td><td>${this.escape(b.created_by||'')}</td><td>${this.escape(b.notes||'')}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:25px;color:var(--text-muted)">لا توجد نسخ بعد</td></tr>'}</tbody></table></div>`;
  };

  A.createBackup = async function(btn) {
    this.setBusy(btn, true, 'إنشاء...');
    try {
      const session = this.getSession();
      const [branches, users, templates, updates] = await Promise.all([
        supabase.from('branches').select('*'), supabase.from('app_users').select('id,username,branch_code,role,is_active,created_at'),
        supabase.from('waybill_field_templates').select('*'), supabase.from('system_updates').select('*').limit(50)
      ]);
      const payload = { branches: branches.data||[], users: users.data||[], templates: templates.data||[], updates: updates.data||[] };
      const { error } = await supabase.rpc('create_system_backup', { p_created_by: session?.user?.username || 'admin', p_backup_type: 'manual', p_title: 'نسخة يدوية ' + new Date().toLocaleString('ar'), p_payload: payload, p_notes: 'نسخة من الإعدادات الأساسية' });
      if (error) throw error;
      this.toast('تم إنشاء النسخة الاحتياطية', 'success');
      this.showSection('backups');
    } catch(e) { this.toast('فشل إنشاء النسخة: ' + (e.message || e), 'error'); }
    finally { this.setBusy(btn, false); }
  };

  A.renderSecurity = async function(area) {
    area.innerHTML = `<div class="card glass-panel"><h3><i class="fas fa-shield-halved" style="color:var(--danger)"></i> مركز الأمان</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:16px">
      <div class="glass-panel" style="padding:18px;border-radius:16px"><h4>توصية 1: كلمات المرور</h4><p style="color:var(--text-muted);line-height:1.8">استخدم كلمات مرور قوية، ولا تنشئ مستخدمًا باسم admin للفروع.</p></div>
      <div class="glass-panel" style="padding:18px;border-radius:16px"><h4>توصية 2: النسخ الاحتياطي</h4><p style="color:var(--text-muted);line-height:1.8">أنشئ نسخة احتياطية يوميًا من لوحة النسخ الاحتياطي.</p></div>
      <div class="glass-panel" style="padding:18px;border-radius:16px"><h4>توصية 3: حذف البوالص</h4><p style="color:var(--text-muted);line-height:1.8">لا يتم حذف أي بوليصة إلا عبر طلب حذف وموافقة الإدارة.</p></div>
      <div class="glass-panel" style="padding:18px;border-radius:16px"><h4>توصية 4: بيئة اختبار</h4><p style="color:var(--text-muted);line-height:1.8">اجعل نسخة Vercel منفصلة للاختبار قبل رفع التعديلات للإنتاج.</p></div>
    </div>
    <div style="margin-top:22px"><button class="btn btn-info" onclick="AdminApp.showSection('audit')"><i class="fas fa-history"></i> مراجعة سجل العمليات</button></div>
    </div>`;
  };
})();


/* =========================================================
   Durrat ERP V7.3 - ربط الصلاحيات فعليًا بلوحة الإدارة
   - يسمح لمدير الفرع بدخول لوحة محدودة
   - يفلتر التقارير والسجل وطلبات الحذف حسب فرعه
   - يمنع فتح أي قسم غير مصرح به
   ========================================================= */
(function attachV73RealPermissions(){
  const A = window.AdminApp;
  if (!A || A.__v73RealPermissions) return;
  A.__v73RealPermissions = true;

  A.permissionMap = {
    dashboard: null,
    branches: 'can_manage_branches',
    users: 'can_manage_users',
    templates: 'can_edit_fields',
    audit: 'can_view_reports',
    reports: 'can_view_reports',
    backups: 'can_view_reports',
    delete_requests: 'can_delete_request',
    permissions: 'super_admin',
    security: 'super_admin',
    updates: 'super_admin'
  };

  A.isSuper = function(){ return this.getSession()?.user?.role === 'super_admin'; };
  A.branchCode = function(){ return this.getSession()?.branch?.code || localStorage.getItem('waybill_branch_prefix') || ''; };
  A.username = function(){ return this.getSession()?.user?.username || localStorage.getItem('waybill_active_user') || ''; };

  A.loadMyPermissions = async function(){
    const session = this.getSession();
    if (session?.user?.role === 'super_admin') {
      this.myPermissions = { can_print:true, can_archive:true, can_export:true, can_delete_request:true, can_edit_fields:true, can_manage_users:true, can_manage_branches:true, can_view_reports:true };
      return this.myPermissions;
    }
    const username = this.username();
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem('enterprise_user_permissions') || 'null'); } catch {}
    try {
      const { data } = await supabase.from('user_permissions').select('*').eq('username', username).maybeSingle();
      this.myPermissions = data || cached || { can_print:true, can_archive:true, can_export:true, can_delete_request:true, can_edit_fields:false, can_manage_users:false, can_manage_branches:false, can_view_reports:false };
      localStorage.setItem('enterprise_user_permissions', JSON.stringify(this.myPermissions));
    } catch(e) {
      this.myPermissions = cached || { can_print:true, can_archive:true, can_export:true, can_delete_request:true, can_edit_fields:false, can_manage_users:false, can_manage_branches:false, can_view_reports:false };
    }
    return this.myPermissions;
  };

  A.canOpenSection = function(section){
    const required = this.permissionMap[section];
    if (!required) return true;
    if (required === 'super_admin') return this.isSuper();
    return this.isSuper() || this.myPermissions?.[required] !== false;
  };

  A.applyAdminNavigation = function(){
    const isSuper = this.isSuper();
    document.querySelectorAll('.nav-item').forEach(item => {
      const section = item.dataset.section;
      const required = item.dataset.perm;
      const superOnly = item.dataset.superOnly === '1';
      let show = true;
      if (superOnly && !isSuper) show = false;
      if (required && !isSuper && this.myPermissions?.[required] === false) show = false;
      item.style.display = show ? '' : 'none';
    });
    const title = document.getElementById('admin-panel-title');
    const sub = document.getElementById('admin-panel-subtitle');
    if (title && !isSuper) title.textContent = 'لوحة مدير الفرع';
    if (sub && !isSuper) sub.textContent = this.getSession()?.branch?.name || this.branchCode();
  };

  const originalInit = A.init.bind(A);
  A.init = async function(){
    await this.loadMyPermissions();
    await originalInit();
    await this.loadMyPermissions();
    this.applyAdminNavigation();
    const target = new URLSearchParams(location.search).get('section');
    if (target && target !== 'dashboard') setTimeout(() => this.showSection(target), 150);
  };

  const originalShow = A.showSection.bind(A);
  A.showSection = async function(section){
    await this.loadMyPermissions();
    this.applyAdminNavigation();
    if (!this.canOpenSection(section)) {
      const area = document.getElementById('content-area');
      if (area) area.innerHTML = `<div class="card glass-panel" style="line-height:1.9"><h3 style="color:var(--warning)"><i class="fas fa-lock"></i> غير مصرح</h3><p style="color:var(--text-muted)">هذه الصفحة غير مفعلة لحسابك. اطلب تفعيل الصلاحية من الإدارة العليا.</p></div>`;
      this.toast('هذه الصلاحية غير مفعلة لهذا المستخدم', 'warning');
      return;
    }
    return originalShow(section);
  };

  // فروع: المدير العام يرى الجميع، مدير الفرع يرى فرعه فقط
  const originalRenderBranches = A.renderBranches.bind(A);
  A.renderBranches = async function(area){
    if (this.isSuper()) return originalRenderBranches(area);
    const code = this.branchCode();
    const { data, error } = await supabase.from('branches').select('*').eq('code', code).limit(1);
    if (error) throw new Error('فشل جلب فرعك: ' + error.message);
    const b = (data || [])[0];
    area.innerHTML = `<div class="card glass-panel"><h3><i class="fas fa-building" style="color:var(--primary)"></i> بيانات فرعي</h3><p style="color:var(--text-muted);line-height:1.8">يمكنك تعديل اسم الفرع وتسلسل البوليصة فقط حسب الصلاحية الممنوحة لك.</p>
      <table class="data-table"><thead><tr><th>كود الفرع</th><th>اسم الفرع</th><th>بداية التسلسل</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>
      ${b ? `<tr><td style="direction:ltr;color:var(--primary);font-weight:900">${this.escape(b.code)}</td><td>${this.escape(b.name)}</td><td>${b.start_seq||''}</td><td>${b.is_active?'نشط':'موقوف'}</td><td><button class="btn btn-info" onclick='AdminApp.openBranchForm(${JSON.stringify(b)})'><i class="fas fa-edit"></i> تعديل فرعي</button></td></tr>` : '<tr><td colspan="5">لم يتم العثور على فرعك</td></tr>'}
      </tbody></table></div>`;
  };

  const originalOpenBranchForm = A.openBranchForm.bind(A);
  A.openBranchForm = function(branch = null){
    originalOpenBranchForm(branch);
    if (!this.isSuper()) {
      const codeEl = document.getElementById('b_code');
      if (codeEl) { codeEl.readOnly = true; codeEl.title = 'كود الفرع لا يعدله إلا المدير العام'; }
    }
  };

  const originalSaveBranch = A.saveBranch.bind(A);
  A.saveBranch = async function(button){
    if (!this.isSuper()) {
      const codeEl = document.getElementById('b_code');
      if (codeEl && codeEl.value !== this.branchCode()) codeEl.value = this.branchCode();
    }
    return originalSaveBranch(button);
  };

  // مستخدمون: مدير الفرع يرى ويعدل مستخدمي فرعه فقط ولا يمنح مدير نظام
  const originalRenderUsers = A.renderUsers.bind(A);
  A.renderUsers = async function(area){
    if (this.isSuper()) return originalRenderUsers(area);
    const code = this.branchCode();
    const [{ data: users, error: uErr }, { data: branches }] = await Promise.all([
      supabase.from('app_users').select('*, branches(name)').eq('branch_code', code).order('created_at', { ascending: false }),
      supabase.from('branches').select('code,name').eq('code', code)
    ]);
    if (uErr) throw new Error('فشل جلب مستخدمي الفرع: ' + uErr.message);
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap"><h3 style="margin:0"><i class="fas fa-users" style="color:var(--accent)"></i> مستخدمو فرعي</h3><button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> إضافة مستخدم للفرع</button></div>
    <table class="data-table"><thead><tr><th>اسم الدخول</th><th>الفرع</th><th>الصلاحية</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${(users||[]).map(u=>`<tr><td style="direction:ltr;color:var(--primary);font-weight:900">${this.escape(u.username)}</td><td>${this.escape(u.branches?.name || u.branch_code || '')}</td><td>${this.roleLabel(u.role)}</td><td>${u.is_active?'مصرح له':'موقوف'}</td><td><button class="btn btn-info" onclick='AdminApp.openUserForm(${JSON.stringify(u)})'><i class="fas fa-user-edit"></i> تعديل</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:25px;color:var(--text-muted)">لا يوجد مستخدمون</td></tr>'}</tbody></table></div>`;
  };

  const originalOpenUserForm = A.openUserForm.bind(A);
  A.openUserForm = async function(user = null){
    await originalOpenUserForm(user);
    if (!this.isSuper()) {
      const b = document.getElementById('u_branch');
      if (b) { b.value = this.branchCode(); b.disabled = true; }
      const role = document.getElementById('u_role');
      if (role) {
        Array.from(role.options).forEach(opt => { if (opt.value === 'super_admin') opt.remove(); });
        if (role.value === 'super_admin') role.value = 'employee';
      }
    }
  };

  const originalSaveUser = A.saveUser.bind(A);
  A.saveUser = async function(button){
    if (!this.isSuper()) {
      const b = document.getElementById('u_branch'); if (b) { b.disabled = false; b.value = this.branchCode(); }
      const role = document.getElementById('u_role'); if (role && role.value === 'super_admin') role.value = 'employee';
    }
    return originalSaveUser(button);
  };

  const originalToggleUserStatus = A.toggleUserStatus.bind(A);
  A.toggleUserStatus = async function(id, status){
    if (!this.isSuper()) {
      const { data } = await supabase.from('app_users').select('branch_code,role').eq('id', id).maybeSingle();
      if (!data || data.branch_code !== this.branchCode() || data.role === 'super_admin') return this.toast('لا يمكنك تعديل مستخدم خارج فرعك', 'error');
    }
    return originalToggleUserStatus(id, status);
  };

  // سجل العمليات حسب الفرع
  A.renderAudit = async function(area){
    let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (!this.isSuper()) q = q.eq('branch_code', this.branchCode());
    const { data, error } = await q;
    if (error) { area.innerHTML = `<div class="card glass-panel" style="color:var(--danger)">فشل تحميل السجل: ${this.escape(error.message)}</div>`; return; }
    const actionLabels = { login_success:'دخول ناجح', login_failed:'محاولة دخول فاشلة', logout:'خروج', admin_open:'فتح لوحة الإدارة', create_branch:'إضافة فرع', create_user:'إضافة مستخدم', update_user:'تعديل مستخدم', update_field_template:'تعديل حقل', toggle_user_status:'تغيير حالة مستخدم', toggle_branch_status:'تغيير حالة فرع', save_waybill:'حفظ بوليصة', request_delete_waybill:'طلب حذف بوليصة', apply_system_update:'تطبيق تحديث' };
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap"><h3 style="margin:0"><i class="fas fa-history" style="color:var(--info)"></i> سجل العمليات ${this.isSuper()?'':'لفرعي'}</h3><button class="btn btn-info" onclick="AdminApp.showSection('audit')"><i class="fas fa-rotate"></i> تحديث</button></div>
    <table class="data-table"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الفرع</th><th>العملية</th><th>البيان</th></tr></thead><tbody>${(data||[]).map(row=>`<tr><td>${this.formatDate(row.created_at)}</td><td>${this.escape(row.username||'')}</td><td>${this.escape(row.branch_name||row.branch_code||'-')}</td><td><b style="color:var(--accent)">${actionLabels[row.action]||this.escape(row.action||'')}</b></td><td style="white-space:normal;max-width:360px">${this.describeDetails(row)}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:25px;color:var(--text-muted)">لا توجد عمليات</td></tr>'}</tbody></table></div>`;
  };

  // التقارير حسب الفرع
  A.renderReports = async function(area){
    let q = supabase.from('v_audit_daily').select('*').order('day', {ascending:false}).limit(500);
    if (!this.isSuper()) q = q.eq('branch_code', this.branchCode());
    const { data } = await q;
    const rows = data || [];
    const total = rows.reduce((s,r)=>s + Number(r.total||0),0);
    area.innerHTML = `<div class="card glass-panel"><h3><i class="fas fa-chart-line" style="color:var(--accent)"></i> التقارير ${this.isSuper()?'العامة':'الخاصة بفرعي'}</h3><p style="color:var(--text-muted);line-height:1.8">يعرض هذا التقرير العمليات المصرح لك بمشاهدتها فقط.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:18px 0"><div class="glass-panel" style="padding:15px;border-radius:15px"><b>إجمالي العمليات</b><h2 style="color:var(--primary)">${total}</h2></div><div class="glass-panel" style="padding:15px;border-radius:15px"><b>عدد الأيام</b><h2 style="color:var(--accent)">${new Set(rows.map(r=>r.day)).size}</h2></div></div>
    <table class="data-table"><thead><tr><th>اليوم</th><th>الفرع</th><th>المستخدم</th><th>العملية</th><th>العدد</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${this.escape(x.day)}</td><td>${this.escape(x.branch_code)}</td><td>${this.escape(x.username)}</td><td>${this.escape(x.action)}</td><td>${x.total}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:25px;color:var(--text-muted)">لا توجد بيانات</td></tr>'}</tbody></table></div>`;
  };

  A.exportReportCSV = async function(){
    let q = supabase.from('v_audit_daily').select('*').limit(2000);
    if (!this.isSuper()) q = q.eq('branch_code', this.branchCode());
    const { data, error } = await q;
    if (error) return this.toast('فشل تصدير التقرير: ' + error.message, 'error');
    const rows = data || [];
    const csv = ['day,branch_code,username,action,total'].concat(rows.map(r => [r.day,r.branch_code,r.username,r.action,r.total].map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = this.isSuper() ? 'durrat_report.csv' : `durrat_report_${this.branchCode()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  // طلبات الحذف: المدير العام يقرر، مدير الفرع يشاهد طلبات فرعه فقط ولا يقرر إلا إذا كان مدير عام
  A.renderDeleteRequests = async function(area){
    let q = supabase.from('delete_requests').select('*').order('created_at', { ascending: false }).limit(200);
    if (!this.isSuper()) q = q.eq('branch_code', this.branchCode());
    const { data, error } = await q;
    if (error) throw new Error('فشل تحميل طلبات الحذف: ' + error.message);
    const statusLabel = { pending:'بانتظار القرار', approved:'تمت الموافقة', rejected:'مرفوض' };
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h3 style="margin:0"><i class="fas fa-trash-shield" style="color:var(--danger)"></i> طلبات حذف البوالص ${this.isSuper()?'':'لفرعي'}</h3><p style="color:var(--text-muted);line-height:1.8;margin-top:8px">${this.isSuper()?'يمكنك الموافقة أو الرفض.':'يمكنك متابعة حالة طلبات حذف الفرع فقط.'}</p></div><button class="btn btn-info" onclick="AdminApp.showSection('delete_requests')"><i class="fas fa-rotate"></i> تحديث</button></div>
      <table class="data-table"><thead><tr><th>الحالة</th><th>الوقت</th><th>الفرع</th><th>المستخدم</th><th>رقم البوليصة</th><th>السبب</th><th>قرار الإدارة</th></tr></thead><tbody>${(data||[]).map(r=>`<tr><td><b style="color:${r.status==='pending'?'var(--warning)':r.status==='approved'?'var(--accent)':'var(--danger)'}">${statusLabel[r.status]||r.status}</b></td><td>${this.formatDate(r.created_at)}</td><td>${this.escape(r.branch_name||r.branch_code||'')}</td><td>${this.escape(r.requested_by||'')}</td><td style="direction:ltr;font-weight:900;color:var(--primary)">${this.escape(r.awb_no||'')}</td><td style="max-width:300px;white-space:normal">${this.escape(r.reason||'')}</td><td>${this.isSuper() && r.status==='pending' ? `<button class="btn btn-primary" onclick="AdminApp.decideDeleteRequest('${r.id}','approved')"><i class="fas fa-check"></i> موافقة</button> <button class="btn btn-danger" onclick="AdminApp.decideDeleteRequest('${r.id}','rejected')"><i class="fas fa-times"></i> رفض</button>` : `${this.escape(r.approved_by||'-')}${r.decided_reason?'<br><small>'+this.escape(r.decided_reason)+'</small>':''}`}</td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">لا توجد طلبات</td></tr>'}</tbody></table></div>`;
  };

  // الصلاحيات لا يعدلها إلا المدير العام
  const originalRenderPermissions = A.renderPermissions?.bind(A);
  A.renderPermissions = async function(area){
    if (!this.isSuper()) {
      area.innerHTML = `<div class="card glass-panel" style="line-height:1.9"><h3 style="color:var(--warning)"><i class="fas fa-lock"></i> الصلاحيات للإدارة العليا فقط</h3><p style="color:var(--text-muted)">يمكنك طلب تعديل صلاحياتك من الإدارة الرئيسية.</p></div>`;
      return;
    }
    return originalRenderPermissions ? originalRenderPermissions(area) : null;
  };
})();


/* =========================================================
   V15 Enterprise Operations Center
   - أرشيف الموظفين في الإدارة العليا
   - سجل عمليات مع فلاتر وتنظيف محدد
   - دعم متابعة استخراج PDF/JPG/مشاركة
========================================================= */
(function attachV15OperationsCenter(){
  const A = window.AdminApp || AdminApp;
  if (!A || A.__v15OpsCenter) return;
  A.__v15OpsCenter = true;

  A._v15BaseShowSection = A.showSection.bind(A);
  A.showSection = async function(section){
    const v15 = ['waybill_archive_admin','audit_cleanup'];
    if (!v15.includes(section)) return this._v15BaseShowSection(section);
    this.currentSection = section;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(section));
    if (activeLink) activeLink.classList.add('active');
    const titles = { waybill_archive_admin:'أرشيف الموظفين', audit_cleanup:'تنظيف السجل' };
    const pageTitle = document.getElementById('page-title'); if(pageTitle) pageTitle.innerText = titles[section] || section;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="display:flex;justify-content:center;padding:100px"><div class="spinner"></div></div>';
    try{
      if(section === 'waybill_archive_admin') return this.renderAdminWaybillArchive(area);
      if(section === 'audit_cleanup') return this.renderAuditCleanup(area);
    }catch(e){ area.innerHTML = `<div class="card glass-panel" style="color:var(--danger);line-height:1.8"><h3>تعذر فتح القسم</h3><p>${this.escape(e.message||e)}</p></div>`; }
  };

  A.renderAdminWaybillArchive = async function(area){
    const session = this.getSession ? this.getSession() : {};
    const isSuper = this.isSuper ? this.isSuper() : (session?.user?.role === 'super_admin');
    const branch = this.branchCode ? this.branchCode() : (session?.branch?.code || '');
    let q = supabase.from('waybills').select('*').order('updated_at', { ascending:false }).limit(500);
    if(!isSuper) q = q.or(`branch_code.eq.${branch},branch_id.eq.${branch}`);
    const { data, error } = await q;
    if(error) throw new Error('فشل تحميل أرشيف البوالص السحابي: ' + error.message + ' — شغّل ملف SQL الخاص بـ V15 إذا لم تكن الأعمدة موجودة.');
    const rows = data || [];
    const byUser = {};
    rows.forEach(r => { const u = r.username || r.created_by || 'غير محدد'; byUser[u] = (byUser[u]||0)+1; });
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px">
        <div><h3 style="margin:0"><i class="fas fa-box-archive" style="color:var(--accent)"></i> أرشيف أعمال الموظفين ${isSuper?'':'لفرعي'}</h3>
        <p style="color:var(--text-muted);line-height:1.8;margin-top:8px">يعرض البوالص التي تم حفظها أو استخراجها ومزامنتها سحابيًا، مع اسم الموظف والفرع والعميل.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-info" onclick="AdminApp.showSection('waybill_archive_admin')"><i class="fas fa-rotate"></i> تحديث</button><button class="btn btn-primary" onclick="AdminApp.exportWaybillArchiveCSV()"><i class="fas fa-file-csv"></i> تصدير CSV</button></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px">
        <div class="glass-panel" style="padding:16px;border-radius:15px"><b>إجمالي البوالص</b><h2 style="color:var(--primary)">${rows.length}</h2></div>
        <div class="glass-panel" style="padding:16px;border-radius:15px"><b>عدد الموظفين</b><h2 style="color:var(--accent)">${Object.keys(byUser).length}</h2></div>
        <div class="glass-panel" style="padding:16px;border-radius:15px"><b>آخر مزامنة</b><h2 style="font-size:1rem;color:var(--warning)">${rows[0]?.updated_at ? this.formatDate(rows[0].updated_at) : '-'}</h2></div>
      </div>
      <h3 style="margin:20px 0 10px">ملخص حسب الموظف</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">${Object.entries(byUser).map(([u,c])=>`<span style="background:rgba(59,130,246,.12);border:1px solid var(--border);border-radius:999px;padding:8px 12px;color:var(--text-main)"><b style="direction:ltr;color:var(--primary)">${this.escape(u)}</b> — ${c}</span>`).join('') || '<span style="color:var(--text-muted)">لا توجد بيانات</span>'}</div>
      <div class="table-wrapper" style="overflow:auto;max-height:65vh"><table class="data-table"><thead><tr><th>الوقت</th><th>الموظف</th><th>الفرع</th><th>رقم البوليصة</th><th>العميل</th><th>الحالة</th><th>تفاصيل</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${this.formatDate(r.updated_at || r.created_at)}</td><td style="direction:ltr;color:var(--primary);font-weight:900">${this.escape(r.username||r.created_by||'')}</td><td>${this.escape(r.branch_name||r.branch_code||r.branch_id||'')}</td><td style="direction:ltr;color:var(--warning);font-weight:900">${this.escape(r.awb_no||'')}</td><td>${this.escape(r.client_name || r.full_data?.consignee_name || '')}</td><td>${this.escape(r.status||'saved')}</td><td><button class="btn btn-outline" onclick='AdminApp.showWaybillJson(${JSON.stringify(JSON.stringify(r.full_data||{}))})'><i class="fas fa-eye"></i> عرض</button></td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد بوالص سحابية بعد. تأكد أن المستخدم ضغط حفظ أو PDF/JPG مع اتصال إنترنت.</td></tr>'}</tbody></table></div>
    </div>`;
    this._lastWaybillArchiveRows = rows;
  };

  A.showWaybillJson = function(json){
    try{ const obj = JSON.parse(json || '{}'); alert(JSON.stringify(obj, null, 2)); }catch(e){ alert(json || 'لا توجد تفاصيل'); }
  };

  A.exportWaybillArchiveCSV = function(){
    const rows = this._lastWaybillArchiveRows || [];
    const csv = ['updated_at,username,branch,awb_no,client,status'].concat(rows.map(r => [r.updated_at||r.created_at,r.username||r.created_by,r.branch_name||r.branch_code||r.branch_id,r.awb_no,r.client_name || r.full_data?.consignee_name || '',r.status||'saved'].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='durrat_waybill_archive.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  A.renderAuditCleanup = async function(area){
    area.innerHTML = `<div class="card glass-panel" style="line-height:1.9"><h3><i class="fas fa-broom" style="color:var(--warning)"></i> تنظيف سجل العمليات</h3><p style="color:var(--text-muted)">استخدم هذه الأداة لتخفيف السجل فقط بعد التأكد من عدم حاجتك للبيانات القديمة. لا تحذف البوالص ولا الفروع.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="btn btn-warning" onclick="AdminApp.cleanupAudit(30,this)">حذف سجل أقدم من 30 يوم</button><button class="btn btn-danger" onclick="AdminApp.cleanupAudit(7,this)">حذف سجل أقدم من 7 أيام</button><button class="btn btn-info" onclick="AdminApp.showSection('audit')">رجوع للسجل</button></div></div>`;
  };

  A.cleanupAudit = async function(days, btn){
    if(!confirm('سيتم حذف سجلات العمليات الأقدم من '+days+' يوم فقط. هل أنت متأكد؟')) return;
    this.setBusy && this.setBusy(btn, true, 'جاري...');
    try{
      const { data, error } = await supabase.rpc('cleanup_audit_logs', { p_keep_days: days });
      if(error) throw error;
      await this.logAction('cleanup_audit_logs','audit_logs',String(days),{keep_days:days,result:data});
      this.toast('تم تنظيف السجل بنجاح','success');
      this.showSection('audit');
    }catch(e){ this.toast('فشل تنظيف السجل: '+(e.message||e),'error'); }
    finally{ this.setBusy && this.setBusy(btn, false); }
  };

  const oldRenderAudit = A.renderAudit?.bind(A);
  A.renderAudit = async function(area){
    await oldRenderAudit(area);
    const card = area.querySelector('.card');
    if(card && !document.getElementById('audit-clean-btn')){
      const tools=document.createElement('div'); tools.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px 0'; tools.innerHTML=`<button id="audit-clean-btn" class="btn btn-warning" onclick="AdminApp.showSection('audit_cleanup')"><i class="fas fa-broom"></i> تنظيف السجل</button><button class="btn btn-primary" onclick="AdminApp.showSection('waybill_archive_admin')"><i class="fas fa-box-archive"></i> أرشيف الموظفين</button>`;
      card.insertBefore(tools, card.children[1] || null);
    }
  };
})();


/* =========================================================
   V17 Enterprise Growth Pack
   - Backups, reports, notifications, central archive
========================================================= */
(function attachV17GrowthPack(){
  const A = window.AdminApp || AdminApp;
  if (!A || A.__v17GrowthPack) return;
  A.__v17GrowthPack = true;

  const esc = (v)=> A.escape ? A.escape(v ?? '') : String(v ?? '').replace(/[&<>"]/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  const fmt = (v)=> A.formatDate ? A.formatDate(v) : (v ? new Date(v).toLocaleString('ar') : '-');
  const sessionUser = ()=> { try { return A.getSession ? A.getSession() : JSON.parse(localStorage.getItem('enterprise_session')||'{}'); } catch(e){ return {}; } };
  const money = (n)=> Number(n||0).toLocaleString('ar-SA', {maximumFractionDigits:2});
  const amountOf = (r)=> {
    const d = r.full_data || {};
    const raw = r.amount ?? d.amount ?? d.cod_amount ?? d.freight_charges ?? d.freight_amount ?? d.total ?? 0;
    const n = Number(String(raw).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  };

  const baseShow = A.showSection.bind(A);
  A.showSection = async function(section){
    const v17 = ['central_archive','advanced_reports','instant_notifications'];
    if (!v17.includes(section)) return baseShow(section);
    this.currentSection = section;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(section));
    if (activeLink) activeLink.classList.add('active');
    const titles = { central_archive:'الأرشيف المركزي', advanced_reports:'التقارير المتقدمة', instant_notifications:'الإشعارات الفورية' };
    const pageTitle = document.getElementById('page-title'); if(pageTitle) pageTitle.innerText = titles[section] || section;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="display:flex;justify-content:center;padding:100px"><div class="spinner"></div></div>';
    try{
      if(section === 'central_archive') return this.renderCentralArchive(area);
      if(section === 'advanced_reports') return this.renderAdvancedReports(area);
      if(section === 'instant_notifications') return this.renderInstantNotifications(area);
    }catch(e){ area.innerHTML = `<div class="card glass-panel" style="color:var(--danger);line-height:1.8"><h3>تعذر فتح القسم</h3><p>${esc(e.message||e)}</p></div>`; }
  };

  A.fetchWaybillsForAdmin = async function(limit=1500){
    const s = sessionUser();
    const isSuper = this.isSuper ? this.isSuper() : (s?.user?.role === 'super_admin');
    const branch = this.branchCode ? this.branchCode() : (s?.branch?.code || '');
    let q = supabase.from('waybills').select('*').order('updated_at', { ascending:false }).limit(limit);
    if(!isSuper && branch) q = q.or(`branch_code.eq.${branch},branch_id.eq.${branch}`);
    const { data, error } = await q;
    if(error) throw new Error('تعذر تحميل الأرشيف: ' + error.message + ' — شغّل ملف SQL الخاص بـ V17 إذا لزم.');
    return data || [];
  };

  A.renderCentralArchive = async function(area){
    const rows = await this.fetchWaybillsForAdmin(2000);
    this._v17ArchiveRows = rows;
    area.innerHTML = `<div class="card glass-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px">
        <div><h3 style="margin:0"><i class="fas fa-magnifying-glass-chart" style="color:var(--primary)"></i> الأرشيف المركزي المتقدم</h3><p style="color:var(--text-muted);line-height:1.8;margin-top:8px">بحث شامل حسب رقم البوليصة، العميل، الهاتف، التاريخ، الفرع، أو الموظف.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-info" onclick="AdminApp.showSection('central_archive')"><i class="fas fa-rotate"></i> تحديث</button><button class="btn btn-primary" onclick="AdminApp.exportCentralArchiveCSV()"><i class="fas fa-file-csv"></i> تصدير CSV</button></div>
      </div>
      <div class="glass-panel" style="padding:16px;border-radius:16px;margin-bottom:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">
        <input class="form-control" id="arc_awb" placeholder="رقم البوليصة">
        <input class="form-control" id="arc_client" placeholder="اسم العميل">
        <input class="form-control" id="arc_phone" placeholder="الهاتف">
        <input class="form-control" id="arc_branch" placeholder="الفرع">
        <input class="form-control" id="arc_user" placeholder="الموظف">
        <input class="form-control" id="arc_date" type="date">
        <button class="btn btn-primary" onclick="AdminApp.filterCentralArchive()"><i class="fas fa-search"></i> بحث</button>
        <button class="btn btn-outline" onclick="AdminApp.clearCentralArchiveFilters()"><i class="fas fa-eraser"></i> مسح</button>
      </div>
      <div id="central-archive-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:14px"></div>
      <div class="table-wrapper" style="overflow:auto;max-height:62vh"><table class="data-table"><thead><tr><th>التاريخ</th><th>رقم البوليصة</th><th>العميل</th><th>الهاتف</th><th>الفرع</th><th>الموظف</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody id="central-archive-body"></tbody></table></div>
    </div>`;
    this.filterCentralArchive();
  };

  A.filterCentralArchive = function(){
    const rows = this._v17ArchiveRows || [];
    const val = id => (document.getElementById(id)?.value || '').trim().toLowerCase();
    const awb=val('arc_awb'), client=val('arc_client'), phone=val('arc_phone'), branch=val('arc_branch'), user=val('arc_user'), date=(document.getElementById('arc_date')?.value||'').trim();
    const filtered = rows.filter(r=>{
      const d = r.full_data || {};
      const phones = [d.consignee_phone,d.shipper_phone,d.local_phone,d.intl_phone,d.mobile,d.phone].join(' ').toLowerCase();
      const clientName = String(r.client_name || d.consignee_name || d.shipper_name || '').toLowerCase();
      return (!awb || String(r.awb_no||'').toLowerCase().includes(awb)) && (!client || clientName.includes(client)) && (!phone || phones.includes(phone)) && (!branch || String(r.branch_code||r.branch_name||r.branch_id||'').toLowerCase().includes(branch)) && (!user || String(r.username||r.created_by||'').toLowerCase().includes(user)) && (!date || String(r.updated_at||r.created_at||'').slice(0,10) === date);
    });
    this._v17FilteredArchiveRows = filtered;
    const totalAmount = filtered.reduce((a,r)=>a+amountOf(r),0);
    const users = new Set(filtered.map(r=>r.username||r.created_by||'').filter(Boolean)).size;
    const branches = new Set(filtered.map(r=>r.branch_code||r.branch_name||r.branch_id||'').filter(Boolean)).size;
    const stats = document.getElementById('central-archive-stats');
    if(stats) stats.innerHTML = `<div class="glass-panel" style="padding:14px;border-radius:14px"><b>النتائج</b><h2 style="color:var(--primary)">${filtered.length}</h2></div><div class="glass-panel" style="padding:14px;border-radius:14px"><b>المبلغ التقريبي</b><h2 style="color:var(--accent)">${money(totalAmount)}</h2></div><div class="glass-panel" style="padding:14px;border-radius:14px"><b>الفروع</b><h2 style="color:var(--warning)">${branches}</h2></div><div class="glass-panel" style="padding:14px;border-radius:14px"><b>الموظفون</b><h2 style="color:var(--info)">${users}</h2></div>`;
    const body = document.getElementById('central-archive-body');
    if(body) body.innerHTML = filtered.slice(0,600).map(r=>{
      const d=r.full_data||{}; const clientName=r.client_name || d.consignee_name || d.shipper_name || ''; const phones=[d.consignee_phone,d.shipper_phone,d.local_phone,d.intl_phone,d.mobile,d.phone].filter(Boolean).join(' / ');
      return `<tr><td>${fmt(r.updated_at||r.created_at)}</td><td style="direction:ltr;color:var(--warning);font-weight:900">${esc(r.awb_no)}</td><td>${esc(clientName)}</td><td style="direction:ltr">${esc(phones)}</td><td>${esc(r.branch_name||r.branch_code||r.branch_id||'')}</td><td style="direction:ltr;color:var(--primary);font-weight:900">${esc(r.username||r.created_by||'')}</td><td>${money(amountOf(r))}</td><td>${esc(r.status||'saved')}</td></tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد نتائج مطابقة</td></tr>';
  };

  A.clearCentralArchiveFilters = function(){ ['arc_awb','arc_client','arc_phone','arc_branch','arc_user','arc_date'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; }); this.filterCentralArchive(); };
  A.exportCentralArchiveCSV = function(){
    const rows = this._v17FilteredArchiveRows || this._v17ArchiveRows || [];
    const csv = ['updated_at,awb_no,client,phone,branch,username,amount,status'].concat(rows.map(r=>{ const d=r.full_data||{}; const client=r.client_name||d.consignee_name||d.shipper_name||''; const phones=[d.consignee_phone,d.shipper_phone,d.local_phone,d.intl_phone,d.mobile,d.phone].filter(Boolean).join(' / '); return [r.updated_at||r.created_at,r.awb_no,client,phones,r.branch_name||r.branch_code||r.branch_id,r.username||r.created_by,amountOf(r),r.status||'saved'].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(','); })).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='durrat_central_archive.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  A.renderAdvancedReports = async function(area){
    const [waybills, logs] = await Promise.all([this.fetchWaybillsForAdmin(3000).catch(()=>[]), supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(3000).then(r=>r.data||[]).catch(()=>[])]);
    const today = new Date().toISOString().slice(0,10); const thisMonth = today.slice(0,7);
    const todayWaybills = waybills.filter(r=>String(r.updated_at||r.created_at||'').slice(0,10)===today);
    const monthWaybills = waybills.filter(r=>String(r.updated_at||r.created_at||'').slice(0,7)===thisMonth);
    const branchMap={}, userMap={}, actionMap={};
    waybills.forEach(r=>{ const b=r.branch_name||r.branch_code||r.branch_id||'غير محدد'; branchMap[b]=(branchMap[b]||0)+1; const u=r.username||r.created_by||'غير محدد'; userMap[u]=(userMap[u]||0)+1; });
    logs.forEach(l=>{ const a=l.action||'unknown'; actionMap[a]=(actionMap[a]||0)+1; });
    const top = (obj)=> Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,10);
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h3 style="margin:0"><i class="fas fa-chart-simple" style="color:var(--accent)"></i> تقارير مالية وتشغيلية</h3><p style="color:var(--text-muted);line-height:1.8;margin-top:8px">ملخص البوالص، نشاط الفروع والموظفين، وتقارير يومية وشهرية.</p></div><button class="btn btn-info" onclick="AdminApp.showSection('advanced_reports')"><i class="fas fa-rotate"></i> تحديث</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:20px"><div class="glass-panel" style="padding:16px;border-radius:16px"><b>بوالص اليوم</b><h2 style="color:var(--primary)">${todayWaybills.length}</h2></div><div class="glass-panel" style="padding:16px;border-radius:16px"><b>بوالص الشهر</b><h2 style="color:var(--accent)">${monthWaybills.length}</h2></div><div class="glass-panel" style="padding:16px;border-radius:16px"><b>مبلغ اليوم</b><h2 style="color:var(--warning)">${money(todayWaybills.reduce((a,r)=>a+amountOf(r),0))}</h2></div><div class="glass-panel" style="padding:16px;border-radius:16px"><b>مبلغ الشهر</b><h2 style="color:var(--info)">${money(monthWaybills.reduce((a,r)=>a+amountOf(r),0))}</h2></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px"><div class="glass-panel" style="padding:16px;border-radius:16px"><h4>أكثر الفروع نشاطًا</h4>${top(branchMap).map(([k,v])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:9px 0"><span>${esc(k)}</span><b>${v}</b></div>`).join('')||'<p style="color:var(--text-muted)">لا توجد بيانات</p>'}</div><div class="glass-panel" style="padding:16px;border-radius:16px"><h4>أكثر الموظفين استخدامًا</h4>${top(userMap).map(([k,v])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:9px 0"><span style="direction:ltr">${esc(k)}</span><b>${v}</b></div>`).join('')||'<p style="color:var(--text-muted)">لا توجد بيانات</p>'}</div><div class="glass-panel" style="padding:16px;border-radius:16px"><h4>أكثر العمليات</h4>${top(actionMap).map(([k,v])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:9px 0"><span style="direction:ltr">${esc(k)}</span><b>${v}</b></div>`).join('')||'<p style="color:var(--text-muted)">لا توجد بيانات</p>'}</div></div></div>`;
  };

  A.renderInstantNotifications = async function(area){
    let rows=[]; try{ const r=await supabase.from('system_notifications').select('*').order('created_at',{ascending:false}).limit(200); if(r.error) throw r.error; rows=r.data||[]; }catch(e){ rows=[]; }
    area.innerHTML = `<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h3 style="margin:0"><i class="fas fa-bell" style="color:var(--warning)"></i> الإشعارات الفورية</h3><p style="color:var(--text-muted);line-height:1.8;margin-top:8px">إرسال تنبيهات للفروع عند دخول موظف، استخراج بوليصة، طلب حذف، أو تحديث النظام.</p></div><button class="btn btn-info" onclick="AdminApp.showSection('instant_notifications')"><i class="fas fa-rotate"></i> تحديث</button></div><div class="glass-panel" style="padding:16px;border-radius:16px;margin-bottom:18px;display:grid;grid-template-columns:minmax(240px,1fr) 160px 160px auto;gap:10px;align-items:end"><div><label>نص الإشعار</label><input class="form-control" id="notif_title" placeholder="مثال: يوجد تحديث مهم للنظام"></div><div><label>الفرع</label><input class="form-control" id="notif_branch" placeholder="الكل أو JA"></div><div><label>الأهمية</label><select class="form-control" id="notif_level"><option value="info">معلومة</option><option value="warning">تنبيه</option><option value="danger">هام</option></select></div><button class="btn btn-primary" onclick="AdminApp.createNotification(this)"><i class="fas fa-paper-plane"></i> إرسال</button></div><div class="table-wrapper" style="overflow:auto;max-height:62vh"><table class="data-table"><thead><tr><th>الوقت</th><th>النص</th><th>الفرع</th><th>الأهمية</th><th>بواسطة</th><th>الحالة</th></tr></thead><tbody>${rows.map(n=>`<tr><td>${fmt(n.created_at)}</td><td>${esc(n.title||n.message||'')}</td><td>${esc(n.branch_code||'الكل')}</td><td>${esc(n.level||'info')}</td><td>${esc(n.created_by||'')}</td><td>${n.is_active===false?'موقوف':'نشط'}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد إشعارات بعد</td></tr>'}</tbody></table></div></div>`;
  };

  A.createNotification = async function(btn){
    const s=sessionUser(); const title=(document.getElementById('notif_title')?.value||'').trim(); const branch=(document.getElementById('notif_branch')?.value||'').trim().toUpperCase(); const level=document.getElementById('notif_level')?.value||'info';
    if(!title) return this.toast('اكتب نص الإشعار','error');
    this.setBusy && this.setBusy(btn,true,'إرسال...');
    try{ const { error } = await supabase.from('system_notifications').insert([{ title, message:title, branch_code: branch==='الكل'?'':branch, level, created_by:s?.user?.username||'admin', is_active:true }]); if(error) throw error; await this.logAction?.('create_notification','system_notifications',title,{branch_code:branch,level}); this.toast('تم إرسال الإشعار','success'); this.showSection('instant_notifications'); }
    catch(e){ this.toast('فشل إرسال الإشعار: '+(e.message||e),'error'); }
    finally{ this.setBusy && this.setBusy(btn,false); }
  };

  const oldRenderBackups = A.renderBackups?.bind(A);
  A.renderBackups = async function(area){
    if(oldRenderBackups) await oldRenderBackups(area); else area.innerHTML='';
    const card=area.querySelector('.card')||area;
    if(!document.getElementById('v17-backup-scheduler')){
      const box=document.createElement('div'); box.id='v17-backup-scheduler'; box.className='glass-panel'; box.style.cssText='padding:16px;border-radius:16px;margin:16px 0;line-height:1.8';
      const mode=localStorage.getItem('durrat_backup_schedule')||'daily'; const last=localStorage.getItem('durrat_backup_last')||'لم يتم بعد';
      box.innerHTML=`<h3 style="margin-top:0"><i class="fas fa-clock-rotate-left" style="color:var(--accent)"></i> النسخ الاحتياطي التلقائي</h3><p style="color:var(--text-muted)">يتم إنشاء نسخة تلقائية عند فتح لوحة الإدارة إذا مرّ وقت الجدولة. للنسخ الخلفي الحقيقي 24 ساعة يحتاج Supabase Edge Function أو خادم Cron.</p><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><select id="backup_schedule_select" class="form-control" style="max-width:220px"><option value="daily" ${mode==='daily'?'selected':''}>يومي</option><option value="weekly" ${mode==='weekly'?'selected':''}>أسبوعي</option><option value="off" ${mode==='off'?'selected':''}>إيقاف</option></select><button class="btn btn-primary" onclick="AdminApp.saveBackupSchedule()"><i class="fas fa-save"></i> حفظ الجدولة</button><button class="btn btn-info" onclick="AdminApp.runAutoBackupIfDue(true)"><i class="fas fa-play"></i> تجربة الآن</button><span style="color:var(--text-muted)">آخر نسخة تلقائية: ${esc(last)}</span></div>`;
      card.insertBefore(box, card.children[1]||null);
    }
  };

  A.saveBackupSchedule = function(){ const v=document.getElementById('backup_schedule_select')?.value||'daily'; localStorage.setItem('durrat_backup_schedule', v); this.toast('تم حفظ جدولة النسخ الاحتياطي','success'); };
  A.runAutoBackupIfDue = async function(force=false){
    try{ const mode=localStorage.getItem('durrat_backup_schedule')||'daily'; if(mode==='off' && !force) return; const last=Number(localStorage.getItem('durrat_backup_last_ts')||0); const now=Date.now(); const ms=mode==='weekly'?7*864e5:864e5; if(!force && last && now-last<ms) return; const s=sessionUser(); const [branches, users, waybills, logs] = await Promise.all([supabase.from('branches').select('*'), supabase.from('app_users').select('id,username,branch_code,role,is_active,created_at'), supabase.from('waybills').select('*').limit(2500), supabase.from('audit_logs').select('*').limit(1000)]); const payload={created_at:new Date().toISOString(), branches:branches.data||[], users:users.data||[], waybills:waybills.data||[], audit_sample:logs.data||[], summary:{branches:(branches.data||[]).length,users:(users.data||[]).length,waybills:(waybills.data||[]).length}}; const { error } = await supabase.rpc('create_system_backup', { p_created_by:s?.user?.username||'admin', p_backup_type: force?'manual-test':'auto-'+mode, p_title:'نسخة '+(force?'تجريبية':'تلقائية')+' '+new Date().toLocaleString('ar'), p_payload:payload, p_notes:'V17 Auto Backup' }); if(error) throw error; localStorage.setItem('durrat_backup_last_ts', String(now)); localStorage.setItem('durrat_backup_last', new Date().toLocaleString('ar')); this.toast(force?'تم إنشاء نسخة احتياطية تجريبية':'تم إنشاء النسخة الاحتياطية التلقائية','success'); }
    catch(e){ console.warn('auto backup failed', e); if(force) this.toast('فشل النسخ الاحتياطي: '+(e.message||e),'error'); }
  };

  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>A.runAutoBackupIfDue(false), 2500));
})();

/* =========================================================
   V18 Enterprise Executive Dashboard
   Non-destructive extension: preserves all V17 functions.
========================================================= */
(function attachV18EnterpriseDashboard(){
  const A = window.AdminApp || (typeof AdminApp !== 'undefined' ? AdminApp : null);
  if (!A || A.__v18EnterpriseDashboard) return;
  A.__v18EnterpriseDashboard = true;
  A._v18Charts = [];
  A._v18RealtimeChannel = null;

  const esc = (v) => A.escape ? A.escape(v ?? '') : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dt = (v) => v ? new Date(v) : null;
  const fmt = (v) => { const d=dt(v); return d && !isNaN(d) ? d.toLocaleString('ar') : '-'; };
  const dayKey = (v) => { const d=dt(v); return d && !isNaN(d) ? d.toISOString().slice(0,10) : ''; };
  const actionLabel = (a='') => ({login_success:'تسجيل دخول',logout:'تسجيل خروج',save_waybill:'حفظ بوليصة',export_pdf:'استخراج PDF',export_jpg:'استخراج JPG',share_waybill:'مشاركة بوليصة',request_delete_waybill:'طلب حذف',create_system_backup:'نسخة احتياطية',create_notification:'إشعار جديد',admin_open:'فتح الإدارة'}[a] || a.replaceAll('_',' '));

  A._v18DestroyCharts = function(){ (this._v18Charts||[]).forEach(c=>{try{c.destroy()}catch{}}); this._v18Charts=[]; };
  A._v18Chart = function(canvas, config){ if(!canvas || !window.Chart) return null; const c=new Chart(canvas, config); this._v18Charts.push(c); return c; };

  A._v18Fetch = async function(){
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startWeek = new Date(now); startWeek.setDate(now.getDate()-6); startWeek.setHours(0,0,0,0);
    const [waybillsR, logsR, usersR, branchesR, deletesR, backupsR, notifsR] = await Promise.all([
      supabase.from('waybills').select('*').gte('created_at', startMonth).order('created_at',{ascending:false}).limit(5000),
      supabase.from('audit_logs').select('*').gte('created_at', startWeek.toISOString()).order('created_at',{ascending:false}).limit(3000),
      supabase.from('app_users').select('*').order('created_at',{ascending:false}),
      supabase.from('branches').select('*').order('created_at',{ascending:false}),
      supabase.from('delete_requests').select('*').order('created_at',{ascending:false}).limit(500),
      supabase.from('system_backups').select('id,created_at,title,backup_type,created_by,size_hint').order('created_at',{ascending:false}).limit(100),
      supabase.from('system_notifications').select('*').eq('is_active',true).order('created_at',{ascending:false}).limit(100)
    ]);
    const errors=[waybillsR,logsR,usersR,branchesR].map(r=>r.error).filter(Boolean);
    if(errors.length) throw new Error(errors.map(e=>e.message).join(' | '));
    return {waybills:waybillsR.data||[],logs:logsR.data||[],users:usersR.data||[],branches:branchesR.data||[],deletes:deletesR.data||[],backups:backupsR.data||[],notifications:notifsR.data||[]};
  };

  A._v18Compute = function(d){
    const now=new Date(), today=now.toISOString().slice(0,10), month=today.slice(0,7);
    const weekStart=new Date(now); weekStart.setDate(now.getDate()-6); weekStart.setHours(0,0,0,0);
    const todayW=d.waybills.filter(x=>dayKey(x.updated_at||x.created_at)===today);
    const weekW=d.waybills.filter(x=>dt(x.updated_at||x.created_at)>=weekStart);
    const monthW=d.waybills.filter(x=>String(x.updated_at||x.created_at||'').slice(0,7)===month);
    const activeSince=new Date(Date.now()-15*60*1000);
    const activeUsers=new Set(d.logs.filter(x=>dt(x.created_at)>=activeSince).map(x=>x.username).filter(Boolean));
    const branchCount={}, userCount={}, daily={};
    d.waybills.forEach(w=>{ const b=w.branch_name||w.branch_code||w.branch_id||'غير محدد'; const u=w.username||w.created_by||'غير محدد'; branchCount[b]=(branchCount[b]||0)+1; userCount[u]=(userCount[u]||0)+1; const k=dayKey(w.updated_at||w.created_at); if(k)daily[k]=(daily[k]||0)+1; });
    const sortedB=Object.entries(branchCount).sort((a,b)=>b[1]-a[1]); const sortedU=Object.entries(userCount).sort((a,b)=>b[1]-a[1]);
    return {todayW,weekW,monthW,activeUsers,branchCount,userCount,daily,topBranch:sortedB[0]||['-',0],lowBranch:sortedB.at(-1)||['-',0],topUser:sortedU[0]||['-',0],pendingDeletes:d.deletes.filter(x=>['pending','requested','new',null,undefined].includes(x.status)).length};
  };

  A.renderV18Dashboard = async function(area){
    this._v18DestroyCharts();
    const d=await this._v18Fetch(), m=this._v18Compute(d);
    const lastBackup=d.backups[0], lastSync=d.waybills[0]?.updated_at||d.waybills[0]?.created_at;
    const onlineBranches=new Set(d.logs.filter(x=>dt(x.created_at)>=new Date(Date.now()-15*60*1000)).map(x=>x.branch_code).filter(Boolean));
    area.innerHTML=`<div class="v18-dashboard">
      <div class="v18-kpi-grid">
        ${[['بوالص اليوم',m.todayW.length,'منذ منتصف الليل','fa-file-circle-check'],['هذا الأسبوع',m.weekW.length,'آخر 7 أيام','fa-calendar-week'],['هذا الشهر',m.monthW.length,'إجمالي الشهر','fa-calendar-days'],['المستخدمون النشطون',m.activeUsers.size,'آخر 15 دقيقة','fa-user-clock'],['طلبات الحذف',m.pendingDeletes,'بانتظار القرار','fa-trash-shield'],['الفروع المتصلة',onlineBranches.size+' / '+d.branches.length,'آخر 15 دقيقة','fa-building-signal']].map(([l,v,meta,ic])=>`<div class="v18-kpi"><div class="label"><i class="fas ${ic}"></i> ${l}</div><div class="value">${v}</div><div class="meta">${meta}</div></div>`).join('')}
      </div>
      <div class="v18-grid-2">
        <section class="v18-panel"><h3><i class="fas fa-chart-line" style="color:var(--primary)"></i> اتجاه إنتاج البوالص</h3><div class="v18-chart-wrap"><canvas id="v18-daily-chart"></canvas></div></section>
        <section class="v18-panel"><h3><i class="fas fa-bolt" style="color:var(--warning)"></i> النشاط المباشر</h3><div class="v18-timeline" id="v18-live-timeline">${d.logs.slice(0,14).map(l=>`<div class="v18-event"><time>${new Date(l.created_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'})}</time><div><strong>${esc(l.username||'غير معروف')} — ${esc(actionLabel(l.action))}</strong><small>${esc(l.branch_name||l.branch_code||'')} · ${fmt(l.created_at)}</small></div></div>`).join('')||'<p style="color:var(--text-muted)">لا توجد حركات حديثة</p>'}</div></section>
      </div>
      <div class="v18-grid-3">
        <section class="v18-panel"><h3>أفضل الفروع</h3><div class="v18-chart-wrap"><canvas id="v18-branches-chart"></canvas></div></section>
        <section class="v18-panel"><h3>أفضل الموظفين</h3><div class="v18-chart-wrap"><canvas id="v18-users-chart"></canvas></div></section>
        <section class="v18-panel"><h3>حالة النظام</h3>
          <div class="v18-card"><b>اتصال Supabase</b><p style="color:var(--accent);margin-top:7px"><i class="fas fa-circle-check"></i> متصل</p></div>
          <div class="v18-card" style="margin-top:10px"><b>آخر مزامنة</b><p>${fmt(lastSync)}</p></div>
          <div class="v18-card" style="margin-top:10px"><b>آخر نسخة احتياطية</b><p>${lastBackup?fmt(lastBackup.created_at):'لا توجد نسخة'}</p></div>
          <div class="v18-card" style="margin-top:10px"><b>آخر تحديث</b><p>V18 Enterprise Dashboard</p></div>
        </section>
      </div>
    </div>`;
    const days=Object.keys(m.daily).sort().slice(-14), branchTop=Object.entries(m.branchCount).sort((a,b)=>b[1]-a[1]).slice(0,8), userTop=Object.entries(m.userCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const common={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.12)'}},y:{beginAtZero:true,ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.12)'}}}};
    this._v18Chart(document.getElementById('v18-daily-chart'),{type:'line',data:{labels:days.map(x=>x.slice(5)),datasets:[{label:'البوالص',data:days.map(x=>m.daily[x]),fill:true,tension:.35,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.16)'}]},options:common});
    this._v18Chart(document.getElementById('v18-branches-chart'),{type:'bar',data:{labels:branchTop.map(x=>x[0]),datasets:[{label:'البوالص',data:branchTop.map(x=>x[1]),backgroundColor:'rgba(16,185,129,.7)'}]},options:{...common,indexAxis:'y'}});
    this._v18Chart(document.getElementById('v18-users-chart'),{type:'doughnut',data:{labels:userTop.map(x=>x[0]),datasets:[{data:userTop.map(x=>x[1])}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8'}}}}});
    this._v18UpdateHeader(d);
    this._v18Subscribe();
  };

  A._v18UpdateHeader=function(d){ const count=d.notifications.length+d.deletes.filter(x=>!x.status||x.status==='pending').length; const badge=document.getElementById('notification-count'); if(badge)badge.textContent=count>99?'99+':count; const health=document.getElementById('system-health-pill'); if(health){health.className='system-health-pill ok';health.innerHTML='<i class="fas fa-circle"></i> النظام متصل';} };
  A._v18Subscribe=function(){
    if(this._v18RealtimeChannel) return;
    try{
      this._v18RealtimeChannel=supabase.channel('v18-admin-live')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'audit_logs'},payload=>{ const l=payload.new, box=document.getElementById('v18-live-timeline'); if(box){ const el=document.createElement('div');el.className='v18-event';el.innerHTML=`<time>${new Date(l.created_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'})}</time><div><strong>${esc(l.username||'غير معروف')} — ${esc(actionLabel(l.action))}</strong><small>${esc(l.branch_name||l.branch_code||'')} · الآن</small></div>`;box.prepend(el); while(box.children.length>20)box.lastElementChild.remove(); } })
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'delete_requests'},()=>{ const b=document.getElementById('notification-count'); if(b)b.textContent=String((Number(b.textContent)||0)+1); this.toast('وصل طلب حذف جديد','warning'); })
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'system_notifications'},()=>{ const b=document.getElementById('notification-count'); if(b)b.textContent=String((Number(b.textContent)||0)+1); })
        .subscribe();
    }catch(e){console.warn('V18 realtime unavailable',e);}
  };

  A.renderV18LiveMonitoring=async function(area){ const d=await this._v18Fetch(); area.innerHTML=`<div class="v18-panel"><div style="display:flex;justify-content:space-between;align-items:center"><div><h3><i class="fas fa-tower-broadcast" style="color:var(--accent)"></i> المراقبة المباشرة</h3><p style="color:var(--text-muted)">تتحدث تلقائيًا عند تفعيل Realtime لجدول audit_logs.</p></div><button class="btn btn-info" onclick="AdminApp.showSection('live_monitoring')"><i class="fas fa-rotate"></i> تحديث</button></div><div class="v18-timeline" id="v18-live-timeline" style="max-height:70vh">${d.logs.map(l=>`<div class="v18-event"><time>${new Date(l.created_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'})}</time><div><strong>${esc(l.username||'غير معروف')} — ${esc(actionLabel(l.action))}</strong><small>${esc(l.branch_name||l.branch_code||'')} · ${fmt(l.created_at)} · ${esc(l.entity||'')}</small></div></div>`).join('')}</div></div>`; this._v18Subscribe(); };

  A.renderV18Employees=async function(area){ const d=await this._v18Fetch(), m=this._v18Compute(d); const last={}; d.logs.forEach(l=>{if(l.username&&!last[l.username])last[l.username]=l;}); const max=Math.max(1,...Object.values(m.userCount)); area.innerHTML=`<div class="v18-panel"><h3><i class="fas fa-id-card-clip" style="color:var(--primary)"></i> أداء الموظفين</h3><div class="v18-employee-grid">${d.users.map(u=>{const n=m.userCount[u.username]||0,L=last[u.username];return `<article class="v18-card"><div class="v18-card-head"><div style="display:flex;gap:10px;align-items:center"><div class="v18-avatar">${esc((u.username||'?').slice(0,2).toUpperCase())}</div><div><strong>${esc(u.full_name||u.username)}</strong><small style="display:block;color:var(--text-muted)">${esc(u.branch_code||'')} · ${esc(u.role||'')}</small></div></div><span><i class="v18-status-dot ${L&&dt(L.created_at)>=new Date(Date.now()-15*60*1000)?'online':'offline'}"></i>${L?'نشط':'لا نشاط'}</span></div><div style="display:flex;justify-content:space-between"><span>البوالص</span><b>${n}</b></div><div class="v18-progress" style="margin:9px 0"><span style="width:${Math.round(n/max*100)}%"></span></div><small style="color:var(--text-muted)">آخر نشاط: ${L?fmt(L.created_at):'-'} · ${L?esc(actionLabel(L.action)):'-'}</small></article>`}).join('')}</div></div>`; };

  A.renderV18Branches=async function(area){ const d=await this._v18Fetch(), m=this._v18Compute(d); const employeeCount={};d.users.forEach(u=>employeeCount[u.branch_code]=(employeeCount[u.branch_code]||0)+1);const last={};d.logs.forEach(l=>{if(l.branch_code&&!last[l.branch_code])last[l.branch_code]=l;}); area.innerHTML=`<div class="v18-panel"><h3><i class="fas fa-building" style="color:var(--accent)"></i> أداء الفروع</h3><div class="v18-branch-grid">${d.branches.map(b=>{const n=m.branchCount[b.name]||m.branchCount[b.code]||0,L=last[b.code];return `<article class="v18-card"><div class="v18-card-head"><div><strong>${esc(b.name)}</strong><small style="display:block;color:var(--text-muted)">${esc(b.code)}</small></div><span style="color:${b.is_active?'var(--accent)':'var(--danger)'}">${b.is_active?'نشط':'موقوف'}</span></div><p>الموظفون: <b>${employeeCount[b.code]||0}</b></p><p>البوالص: <b>${n}</b></p><p>آخر نشاط: <b>${L?fmt(L.created_at):'-'}</b></p></article>`}).join('')}</div></div>`; };

  const baseShow=A.showSection.bind(A);
  A.showSection=async function(section){
    if(!['dashboard','live_monitoring','employees_overview','branches_overview'].includes(section)) return baseShow(section);
    this.currentSection=section; document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.section===section)); const area=document.getElementById('content-area'); const title={dashboard:'لوحة التنفيذ',live_monitoring:'المراقبة المباشرة',employees_overview:'أداء الموظفين',branches_overview:'أداء الفروع'}[section]; document.getElementById('page-title').textContent=title; area.innerHTML='<div style="display:flex;justify-content:center;padding:100px"><div class="spinner"></div></div>';
    try{ if(section==='dashboard')await this.renderV18Dashboard(area); if(section==='live_monitoring')await this.renderV18LiveMonitoring(area); if(section==='employees_overview')await this.renderV18Employees(area); if(section==='branches_overview')await this.renderV18Branches(area); }catch(e){ area.innerHTML=`<div class="card glass-panel" style="color:var(--danger);line-height:1.8"><h3>تعذر تحميل القسم</h3><p>${esc(e.message||e)}</p><small>تحقق من تشغيل ملف SQL الخاص بـ V18 ومن أسماء أعمدة الجداول الحالية.</small></div>`; const health=document.getElementById('system-health-pill');if(health){health.className='system-health-pill bad';health.innerHTML='<i class="fas fa-circle"></i> يوجد خطأ اتصال';} }
  };
})();
