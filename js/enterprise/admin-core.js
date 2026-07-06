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
      dashboard: 'الرئيسية', branches: 'إدارة الفروع', users: 'إدارة المستخدمين', templates: 'تخصيص الحقول', audit: 'سجل العمليات'
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
      <table class="data-table"><thead><tr><th>كود الفرع</th><th>اسم الفرع</th><th>تسلسل بداية البوليصة</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>
      ${(data || []).map(b => `<tr><td><strong style="color:var(--primary);direction:ltr;display:inline-block;">${this.escape(b.code)}</strong></td><td>${this.escape(b.name)}</td><td>${b.start_seq ?? ''}</td><td><span style="color:${b.is_active ? 'var(--accent)' : 'var(--danger)'};font-weight:bold;">${b.is_active ? 'نشط' : 'موقوف'}</span></td><td><button class="btn btn-outline" style="padding:6px 12px;font-size:.8rem;" onclick="AdminApp.toggleBranchStatus('${b.id}', ${!b.is_active})"><i class="fas fa-sync-alt"></i> ${b.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  },

  openBranchForm() {
    const body = `
      <div class="form-group"><label>كود الفرع <small style="color:var(--text-muted);">مثال: MAIN أو TAIZ</small></label><input type="text" id="b_code" class="form-control" placeholder="MAIN" autocomplete="off"></div>
      <div class="form-group"><label>اسم الفرع بالعربي</label><input type="text" id="b_name" class="form-control" placeholder="الإدارة الرئيسية" autocomplete="off"></div>
      <div class="form-group"><label>تسلسل بداية البوليصة</label><input type="number" id="b_seq" class="form-control" value="10000" min="1"></div>`;
    const footer = `<button class="btn btn-primary" id="save-branch-btn" style="width:100%;justify-content:center;" onclick="AdminApp.saveBranch(this)"><i class="fas fa-save"></i> حفظ الفرع الجديد</button>`;
    this.openModal('إضافة فرع جديد', body, footer);
  },

  async saveBranch(button) {
    const code = (document.getElementById('b_code').value || '').trim().toUpperCase();
    const name = (document.getElementById('b_name').value || '').trim();
    const seq = parseInt(document.getElementById('b_seq').value || '10000', 10);
    if (!/^[A-Z0-9_-]{2,20}$/.test(code)) return this.toast('كود الفرع يجب أن يكون إنجليزي/أرقام من 2 إلى 20 حرفًا مثل MAIN أو TAIZ', 'error');
    if (!name) return this.toast('اكتب اسم الفرع', 'error');
    this.setBusy(button, true);
    try {
      let res = await supabase.rpc('create_branch', { p_code: code, p_name: name, p_start_seq: seq });
      if (res.error) {
        res = await supabase.from('branches').insert([{ code, name, start_seq: seq, is_active: true }]);
      }
      if (res.error) throw res.error;
      await this.logAction('create_branch', 'branches', code, { code, name, start_seq: seq });
      this.toast('تم حفظ الفرع بنجاح', 'success');
      this.closeModal();
      this.showSection('branches');
    } catch (error) {
      this.toast('فشل حفظ الفرع: ' + (error.message || error), 'error');
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
      <table class="data-table"><thead><tr><th>اسم المستخدم</th><th>الفرع</th><th>الصلاحية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>
      ${(data || []).map(u => `<tr><td><strong style="color:var(--primary);direction:ltr;display:inline-block;">${this.escape(u.username)}</strong></td><td>${this.escape(u.branches?.name || u.branch_code || 'عام')}</td><td>${this.roleLabel(u.role)}</td><td><span style="color:${u.is_active ? 'var(--accent)' : 'var(--danger)'};font-weight:bold;">${u.is_active ? 'مصرح له' : 'موقوف'}</span></td><td><button class="btn btn-outline" style="padding:6px 12px;font-size:.8rem;" onclick="AdminApp.toggleUserStatus('${u.id}', ${!u.is_active})"><i class="fas fa-ban"></i> ${u.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  },

  async openUserForm() {
    const { data: branches, error } = await supabase.from('branches').select('code, name').eq('is_active', true).order('name');
    if (error) return this.toast('فشل تحميل الفروع: ' + error.message, 'error');
    if (!branches || branches.length === 0) return this.toast('لا يوجد فروع نشطة. أضف فرعًا أولًا.', 'warning');
    const branchOptions = branches.map(b => `<option value="${this.escape(b.code)}" style="background:#0f172a;">${this.escape(b.name)} - ${this.escape(b.code)}</option>`).join('');
    const body = `
      <div class="form-group"><label>الفرع التابع له المستخدم</label><select id="u_branch" class="form-control">${branchOptions}</select></div>
      <div class="form-group"><label>اسم المستخدم للدخول <small style="color:var(--text-muted);">إنجليزي بدون مسافات</small></label><input type="text" id="u_name" class="form-control" placeholder="ali_taiz" autocomplete="off"></div>
      <div class="form-group"><label>كلمة المرور</label><input type="password" id="u_pass" class="form-control" autocomplete="new-password"></div>
      <div class="form-group"><label>الصلاحية</label><select id="u_role" class="form-control"><option value="employee" style="background:#0f172a;">موظف إدخال</option><option value="branch_manager" style="background:#0f172a;">مدير فرع</option><option value="super_admin" style="background:#0f172a;">مدير نظام</option></select></div>`;
    const footer = `<button class="btn btn-primary" id="save-user-btn" style="width:100%;justify-content:center;" onclick="AdminApp.saveUser(this)"><i class="fas fa-lock"></i> حفظ المستخدم</button>`;
    this.openModal('إضافة مستخدم جديد', body, footer);
  },

  async saveUser(button) {
    const b = document.getElementById('u_branch').value;
    const u = (document.getElementById('u_name').value || '').trim().toLowerCase();
    const p = document.getElementById('u_pass').value || '';
    const r = document.getElementById('u_role').value;
    if (!/^[a-z0-9_.-]{3,30}$/.test(u)) return this.toast('اسم المستخدم يجب أن يكون إنجليزيًا من 3 إلى 30 حرفًا بدون مسافات', 'error');
    if (p.length < 4) return this.toast('كلمة المرور قصيرة جدًا. اكتب 4 أحرف على الأقل.', 'error');
    this.setBusy(button, true);
    try {
      const { data, error } = await supabase.rpc('create_app_user', { p_branch_code: b, p_username: u, p_password: p, p_role: r });
      if (error) throw error;
      const resultText = typeof data === 'string' ? data : JSON.stringify(data || '');
      if (/exists|already|موجود/i.test(resultText)) throw new Error('اسم المستخدم موجود مسبقًا');
      await this.logAction('create_user', 'app_users', u, { username: u, branch_code: b, role: r });
      this.toast('تم حفظ المستخدم بنجاح', 'success');
      this.closeModal();
      this.showSection('users');
    } catch (error) {
      this.toast('فشل حفظ المستخدم: ' + (error.message || error), 'error');
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
      <div style="margin-bottom:18px;line-height:1.8;"><h3 style="margin-bottom:8px;"><i class="fas fa-sliders-h" style="color:var(--warning);"></i> تخصيص أسماء وظهور الحقول</h3><p style="color:var(--text-muted);">الترجمة: <b>الاسم المعروض</b> هو اسم الحقل الذي يظهر للموظف في القائمة الجانبية. <b>إجباري</b> يعني يجب تعبئته. <b>مخفي</b> يعني لا يظهر للموظف. هذا لا يغير مقاسات الحقول داخل البوليصة.</p></div>
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
      const { error } = await supabase.from('waybill_field_templates').upsert({ field_id: id, label: lbl, text_align: align, is_required: req, is_visible: visible }, { onConflict: 'field_id' });
      if (error) throw error;
      await this.logAction('update_field_template', 'waybill_field_templates', id, { field_id: id, label: lbl, text_align: align, is_required: req, is_visible: visible });
      this.toast('تم حفظ تخصيص الحقل: ' + lbl, 'success');
    } catch (error) {
      this.toast('فشل حفظ تخصيص الحقل: ' + (error.message || error), 'error');
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

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
