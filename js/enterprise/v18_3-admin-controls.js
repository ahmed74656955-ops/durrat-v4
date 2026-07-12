
import { supabase } from '../config/supabase.js';

const waitForApp = async () => {
  for (let i=0;i<120;i++) { if (window.AdminApp) return window.AdminApp; await new Promise(r=>setTimeout(r,50)); }
  throw new Error('AdminApp not ready');
};
const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const fmt = v => { try{return new Date(v).toLocaleString('ar-YE',{hour12:true})}catch{return v||'-'} };
const selected = selector => Array.from(document.querySelectorAll(selector+':checked')).map(x=>x.value).filter(Boolean);

waitForApp().then(A=>{
  A.hasAdminPermission = function(name){ return !!(this.isSuper?.() || this.myPermissions?.[name]); };
  A.wrapAdminTables = function(){
    document.querySelectorAll('#content-area table.data-table').forEach(t=>{
      if(t.parentElement?.classList.contains('v18-table-scroll') || t.parentElement?.classList.contains('table-wrapper')) return;
      const w=document.createElement('div'); w.className='v18-table-scroll'; t.parentNode.insertBefore(w,t); w.appendChild(t);
    });
  };

  const oldShow=A.showSection.bind(A);
  A.showSection=async function(section){ const r=await oldShow(section); setTimeout(()=>this.wrapAdminTables(),0); return r; };

  // Extended permissions
  const oldRenderPermissions=A.renderPermissions?.bind(A);
  A.renderPermissions=async function(area){
    if(!this.isSuper?.()) return oldRenderPermissions ? oldRenderPermissions(area) : null;
    const [{data:users,error:uerr},{data:perms,error:perr}] = await Promise.all([
      supabase.from('app_users').select('username,role,branch_code,is_active').order('username'),
      supabase.from('user_permissions').select('*')
    ]);
    if(uerr||perr) throw (uerr||perr);
    const map=new Map((perms||[]).map(p=>[p.username,p]));
    const flags=[['can_print','طباعة'],['can_archive','أرشفة'],['can_export','تصدير'],['can_delete_request','طلب حذف'],['can_edit_fields','تعديل الحقول'],['can_manage_users','إدارة مستخدمين'],['can_manage_branches','إدارة فروع'],['can_view_reports','تقارير'],['can_delete_logs','حذف السجلات'],['can_delete_users','حذف مستخدم'],['can_delete_archives','حذف أرشيف']];
    area.innerHTML=`<div class="card glass-panel"><h3><i class="fas fa-user-lock" style="color:var(--warning)"></i> الصلاحيات التفصيلية</h3><p style="color:var(--text-muted);line-height:1.8">صلاحيات الحذف مستقلة ومقفلة افتراضيًا. فعّلها فقط للمستخدم الموثوق.</p><div class="v18-table-scroll"><table class="data-table"><thead><tr><th>المستخدم</th><th>الدور</th><th>الفرع</th>${flags.map(f=>`<th>${f[1]}</th>`).join('')}<th>حفظ</th></tr></thead><tbody>${(users||[]).map(u=>{const p=map.get(u.username)||{};return `<tr><td style="direction:ltr;color:var(--primary);font-weight:900">${esc(u.username)}</td><td>${esc(this.roleLabel?.(u.role)||u.role)}</td><td>${esc(u.branch_code||'')}</td>${flags.map(([k])=>`<td style="text-align:center"><input id="perm_${u.username}_${k}" type="checkbox" ${p[k]===true || (p[k]!==false && !k.startsWith('can_delete_'))?'checked':''} style="transform:scale(1.2);accent-color:var(--primary)"></td>`).join('')}<td><button class="btn btn-outline" onclick="AdminApp.savePermissions('${u.username}',this)"><i class="fas fa-save"></i> حفظ</button></td></tr>`}).join('')}</tbody></table></div></div>`;
  };
  A.savePermissions=async function(username,btn){
    const keys=['can_print','can_archive','can_export','can_edit_fields','can_delete_request','can_manage_users','can_manage_branches','can_view_reports','can_delete_logs','can_delete_users','can_delete_archives'];
    const row={username,updated_at:new Date().toISOString()}; keys.forEach(k=>row[k]=!!document.getElementById(`perm_${username}_${k}`)?.checked);
    this.setBusy(btn,true,'حفظ...'); try{const {error}=await supabase.from('user_permissions').upsert(row,{onConflict:'username'});if(error)throw error;await this.logAction?.('update_permissions','user_permissions',username,row);this.toast('تم حفظ الصلاحيات','success')}catch(e){this.toast('فشل حفظ الصلاحيات: '+e.message,'error')}finally{this.setBusy(btn,false)}
  };

  // Audit with true deletion using RPC
  A.renderAudit=async function(area){
    let q=supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(500);
    if(!this.isSuper?.()) q=q.eq('branch_code',this.branchCode?.()||'');
    const {data,error}=await q; if(error) throw error;
    const canDelete=this.hasAdminPermission('can_delete_logs');
    const labels={login_success:'دخول ناجح',login_failed:'محاولة دخول فاشلة',logout:'خروج',admin_open:'فتح لوحة الإدارة',save_waybill:'حفظ بوليصة',save_waybill_click:'ضغط حفظ',export_pdf:'تصدير PDF',export_image:'تصدير JPG',share_waybill:'مشاركة بوليصة',auto_archive_before_export:'أرشفة قبل الإخراج',request_delete_waybill:'طلب حذف بوليصة',cleanup_audit_logs:'تنظيف السجل',maintenance_cleanup:'صيانة السجل'};
    area.innerHTML=`<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px"><div><h3 style="margin:0"><i class="fas fa-history" style="color:var(--info)"></i> سجل العمليات ${this.isSuper?.()?'':'لفرعي'}</h3><small style="color:var(--text-muted)">يعرض آخر 500 عملية. استخدم التحديد للحذف الحقيقي عند امتلاك الصلاحية.</small></div><button class="btn btn-info" onclick="AdminApp.showSection('audit')"><i class="fas fa-rotate"></i> تحديث</button></div>
    ${canDelete?`<div class="bulk-actions"><button class="btn btn-danger" onclick="AdminApp.deleteSelectedAudit(this)"><i class="fas fa-trash"></i> حذف المحدد</button><button class="btn btn-warning" onclick="AdminApp.cleanAuditByDays(this)"><i class="fas fa-broom"></i> حذف الأقدم من مدة</button><select id="audit_keep_days" class="form-control" style="width:auto"><option value="7">7 أيام</option><option value="30" selected>30 يومًا</option><option value="90">90 يومًا</option></select><div class="danger-zone"><button class="btn btn-danger" onclick="AdminApp.deleteAllAudit(this)"><i class="fas fa-triangle-exclamation"></i> حذف جميع السجلات المعروضة</button></div></div>`:''}
    <div class="v18-table-scroll"><table class="data-table"><thead><tr>${canDelete?'<th><input id="select-all-audit" type="checkbox" onchange="document.querySelectorAll(\'.audit-row-select\').forEach(x=>x.checked=this.checked)"></th>':''}<th>الوقت</th><th>المستخدم</th><th>الفرع</th><th>العملية</th><th>البيان</th></tr></thead><tbody>${(data||[]).map(r=>`<tr>${canDelete?`<td><input class="audit-row-select row-select" type="checkbox" value="${esc(r.id)}"></td>`:''}<td>${fmt(r.created_at)}</td><td>${esc(r.username||'')}</td><td>${esc(r.branch_name||r.branch_code||'-')}</td><td><b style="color:var(--accent)">${esc(labels[r.action]||r.action||'')}</b></td><td class="wrap-cell">${this.describeDetails?.(r)||esc(JSON.stringify(r.details||{}))}</td></tr>`).join('')||`<tr><td colspan="${canDelete?6:5}" style="text-align:center;padding:25px;color:var(--text-muted)">لا توجد عمليات</td></tr>`}</tbody></table></div></div>`;
  };
  A.deleteSelectedAudit=async function(btn){const ids=selected('.audit-row-select');if(!ids.length)return this.toast('حدد سجلًا واحدًا على الأقل','warning');if(!confirm(`سيتم حذف ${ids.length} سجلًا نهائيًا. هل أنت متأكد؟`))return;this.setBusy(btn,true,'حذف...');try{const s=this.getSession?.();const {data,error}=await supabase.rpc('admin_delete_audit_logs',{p_actor:s?.user?.username||'',p_ids:ids});if(error)throw error;this.toast(`تم حذف ${data?.deleted??ids.length} سجلًا`,'success');this.showSection('audit')}catch(e){this.toast('فشل الحذف: '+e.message,'error')}finally{this.setBusy(btn,false)}};
  A.cleanAuditByDays=async function(btn){const days=Number(document.getElementById('audit_keep_days')?.value||30);if(!confirm(`حذف السجلات الأقدم من ${days} يومًا حذفًا حقيقيًا؟`))return;this.setBusy(btn,true,'تنظيف...');try{const s=this.getSession?.();const {data,error}=await supabase.rpc('admin_cleanup_audit_logs',{p_actor:s?.user?.username||'',p_keep_days:days,p_delete_all:false});if(error)throw error;this.toast(`تم حذف ${data?.deleted||0} سجلًا قديمًا`,'success');this.showSection('audit')}catch(e){this.toast('فشل التنظيف: '+e.message,'error')}finally{this.setBusy(btn,false)}};
  A.deleteAllAudit=async function(btn){if(!confirm('تنبيه: سيتم حذف جميع سجلات العمليات المسموح لك بها. لن تُحذف البوالص. متابعة؟'))return;const phrase=prompt('اكتب: حذف سجل العمليات');if(phrase!=='حذف سجل العمليات')return this.toast('عبارة التأكيد غير صحيحة','warning');this.setBusy(btn,true,'حذف شامل...');try{const s=this.getSession?.();const {data,error}=await supabase.rpc('admin_cleanup_audit_logs',{p_actor:s?.user?.username||'',p_keep_days:0,p_delete_all:true});if(error)throw error;this.toast(`تم حذف ${data?.deleted||0} سجلًا فعليًا`,'success');this.showSection('audit')}catch(e){this.toast('فشل الحذف: '+e.message,'error')}finally{this.setBusy(btn,false)}};

  // Users with optional permanent deletion
  A.renderUsers=async function(area){
    let q=supabase.from('app_users').select('*, branches(name)').order('created_at',{ascending:false}); if(!this.isSuper?.())q=q.eq('branch_code',this.branchCode?.()||'');
    const {data,error}=await q;if(error)throw error;const canDelete=this.hasAdminPermission('can_delete_users');
    area.innerHTML=`<div class="card glass-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h3 style="margin:0"><i class="fas fa-users" style="color:var(--accent)"></i> ${this.isSuper?.()?'إدارة المستخدمين':'مستخدمو فرعي'}</h3><small style="color:var(--text-muted)">الحذف النهائي لا يحذف بوالص المستخدم، بل يحتفظ بها كسجل تاريخي.</small></div><button class="btn btn-primary" onclick="AdminApp.openUserForm()"><i class="fas fa-user-plus"></i> مستخدم جديد</button></div><div class="v18-table-scroll"><table class="data-table"><thead><tr><th>اسم المستخدم</th><th>الفرع</th><th>الصلاحية</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${(data||[]).map(u=>`<tr><td style="direction:ltr;color:var(--primary);font-weight:900">${esc(u.username)}</td><td>${esc(u.branches?.name||u.branch_code||'')}</td><td>${esc(this.roleLabel?.(u.role)||u.role)}</td><td>${u.is_active?'مصرح له':'موقوف'}</td><td style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-info" onclick='AdminApp.openUserForm(${JSON.stringify(u)})'><i class="fas fa-user-edit"></i> تعديل</button><button class="btn btn-outline" onclick="AdminApp.toggleUserStatus('${u.id}',${!u.is_active})"><i class="fas fa-ban"></i> ${u.is_active?'إيقاف':'تفعيل'}</button>${canDelete&&u.role!=='super_admin'?`<button class="btn btn-danger" onclick="AdminApp.deleteUserPermanently('${esc(u.username)}',this)"><i class="fas fa-user-xmark"></i> حذف</button>`:''}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:25px;color:var(--text-muted)">لا يوجد مستخدمون</td></tr>'}</tbody></table></div></div>`;
  };
  A.deleteUserPermanently=async function(username,btn){if(!confirm(`حذف المستخدم ${username} نهائيًا من حسابات الدخول؟ ستبقى بوالصه محفوظة.`))return;const phrase=prompt(`اكتب اسم المستخدم للتأكيد: ${username}`);if(phrase!==username)return this.toast('لم يتم التأكيد','warning');this.setBusy(btn,true,'حذف...');try{const s=this.getSession?.();const {data,error}=await supabase.rpc('admin_delete_user',{p_actor:s?.user?.username||'',p_username:username});if(error)throw error;this.toast(data?.message||'تم حذف المستخدم','success');this.showSection('users')}catch(e){this.toast('فشل حذف المستخدم: '+e.message,'error')}finally{this.setBusy(btn,false)}};

  // Central archive selection and optional permanent deletion
  const oldRenderCentral=A.renderCentralArchive?.bind(A); const oldFilter=A.filterCentralArchive?.bind(A);
  if(oldRenderCentral){A.renderCentralArchive=async function(area){await oldRenderCentral(area);if(!this.hasAdminPermission('can_delete_archives'))return;const head=document.querySelector('#central-archive-body')?.closest('table')?.querySelector('thead tr');if(head&&!head.querySelector('#select-all-archive'))head.insertAdjacentHTML('afterbegin','<th><input id="select-all-archive" type="checkbox" onchange="document.querySelectorAll(\'.archive-row-select\').forEach(x=>x.checked=this.checked)"></th>');const tools=area.querySelector('.card > div');if(tools)tools.insertAdjacentHTML('afterend','<div class="bulk-actions"><button class="btn btn-danger" onclick="AdminApp.deleteSelectedArchive(this)"><i class="fas fa-trash"></i> حذف البوالص المحددة نهائيًا</button><span class="maintenance-note">استخدم هذا فقط لحذف بيانات الاختبار أو السجلات غير المطلوبة.</span></div>');this.filterCentralArchive();};
    A.filterCentralArchive=function(){oldFilter();if(!this.hasAdminPermission('can_delete_archives'))return;const rows=this._v17FilteredArchiveRows||[];const body=document.getElementById('central-archive-body');if(!body)return;Array.from(body.querySelectorAll('tr')).forEach((tr,i)=>{const r=rows[i];if(r&&r.id&&!tr.querySelector('.archive-row-select'))tr.insertAdjacentHTML('afterbegin',`<td><input class="archive-row-select row-select" type="checkbox" value="${esc(r.id)}"></td>`)});};
  }
  A.deleteSelectedArchive=async function(btn){const ids=selected('.archive-row-select');if(!ids.length)return this.toast('حدد بوليصة واحدة على الأقل','warning');if(!confirm(`سيتم حذف ${ids.length} بوليصة نهائيًا من الأرشيف. متابعة؟`))return;const phrase=prompt('اكتب: حذف البوالص المحددة');if(phrase!=='حذف البوالص المحددة')return this.toast('عبارة التأكيد غير صحيحة','warning');this.setBusy(btn,true,'حذف...');try{const s=this.getSession?.();const {data,error}=await supabase.rpc('admin_delete_waybills',{p_actor:s?.user?.username||'',p_ids:ids});if(error)throw error;this.toast(`تم حذف ${data?.deleted||0} بوليصة`,'success');this.showSection('central_archive')}catch(e){this.toast('فشل حذف البوالص: '+e.message,'error')}finally{this.setBusy(btn,false)}};

  // Make existing maintenance cleanup use the real RPC
  A.maintenanceCleanAudit=A.cleanAuditByDays;
  setTimeout(()=>A.wrapAdminTables(),500);
}).catch(console.error);
