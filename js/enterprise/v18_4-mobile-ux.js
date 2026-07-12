(() => {
  'use strict';
  const MOBILE = () => window.matchMedia('(max-width: 900px)').matches;
  const $ = (s, r=document) => r.querySelector(s);
  const STORAGE = {
    showClock: 'durrat_v184_show_clock',
    showDate: 'durrat_v184_show_date',
    guideDone: 'durrat_v184_guide_done'
  };
  const bool = (key, fallback=true) => {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  };
  const setBool = (key, value) => localStorage.setItem(key, value ? '1' : '0');

  function goHome() {
    document.body.classList.remove('v13-focus-mode');
    const preview = $('#v13-preview-modal');
    if (preview) preview.classList.remove('active');
    const sidebar = $('.sidebar');
    if (sidebar) sidebar.classList.remove('active', 'open', 'show');
    document.documentElement.scrollTo({top:0, behavior:'smooth'});
    document.body.scrollTo?.({top:0, behavior:'smooth'});
    window.scrollTo({top:0, behavior:'smooth'});
    history.replaceState(null, '', location.pathname);
  }

  function ensureHomeButton() {
    if (!MOBILE() || $('#v184-home-btn')) return;
    const button = document.createElement('button');
    button.id = 'v184-home-btn';
    button.type = 'button';
    button.title = 'العودة إلى الرئيسية';
    button.setAttribute('aria-label', 'العودة إلى الرئيسية');
    button.innerHTML = '<i class="fas fa-house"></i>';
    button.addEventListener('click', goHome);
    document.body.appendChild(button);
  }

  function ensureClockBar() {
    const header = $('header');
    if (!MOBILE() || !header) return;
    let bar = $('#v184-clockbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'v184-clockbar';
      bar.innerHTML = `
        <div class="v184-clock-main">
          <span class="v184-clock-item" id="v184-date-wrap"><i class="far fa-calendar-alt"></i><span id="v184-date"></span></span>
          <span class="v184-clock-item" id="v184-time-wrap"><i class="far fa-clock"></i><span id="v184-time"></span></span>
        </div>
        <button type="button" id="v184-clock-settings" aria-label="إعدادات التاريخ والوقت"><i class="fas fa-sliders"></i></button>`;
      const toolbar = $('#top-toolbar', header);
      header.insertBefore(bar, toolbar || null);
      $('#v184-clock-settings', bar)?.addEventListener('click', togglePopover);
    }
    updateClockVisibility();
    updateClock();
  }

  function updateClockVisibility() {
    const dateWrap = $('#v184-date-wrap');
    const timeWrap = $('#v184-time-wrap');
    const bar = $('#v184-clockbar');
    const showDate = bool(STORAGE.showDate, true);
    const showClock = bool(STORAGE.showClock, true);
    if (dateWrap) dateWrap.hidden = !showDate;
    if (timeWrap) timeWrap.hidden = !showClock;
    if (bar) bar.hidden = !showDate && !showClock;
  }

  function updateClock() {
    if (!MOBILE()) return;
    const now = new Date();
    const dateEl = $('#v184-date');
    const timeEl = $('#v184-time');
    const locale = 'ar-YE-u-nu-latn';
    if (dateEl) dateEl.textContent = new Intl.DateTimeFormat(locale, {weekday:'short', day:'2-digit', month:'short', year:'numeric'}).format(now);
    if (timeEl) timeEl.textContent = new Intl.DateTimeFormat(locale, {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true}).format(now);
  }

  function ensurePopover() {
    let pop = $('#v184-display-popover');
    if (pop) return pop;
    pop = document.createElement('div');
    pop.id = 'v184-display-popover';
    pop.hidden = true;
    pop.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><b><i class="fas fa-display"></i> إعدادات العرض</b><button id="v184-pop-close" style="border:0;background:transparent;color:inherit;font-size:1.1rem"><i class="fas fa-times"></i></button></div>
      <label class="v184-switch-row"><span>إظهار التاريخ</span><input id="v184-toggle-date" type="checkbox"></label>
      <label class="v184-switch-row"><span>إظهار الساعة المتحركة</span><input id="v184-toggle-clock" type="checkbox"></label>
      <button id="v184-open-guide" style="width:100%;margin-top:10px;border:0;border-radius:12px;padding:10px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:900"><i class="fas fa-circle-question"></i> شرح استخدام النظام</button>`;
    document.body.appendChild(pop);
    $('#v184-pop-close', pop).addEventListener('click', () => pop.hidden = true);
    const dateToggle = $('#v184-toggle-date', pop);
    const clockToggle = $('#v184-toggle-clock', pop);
    dateToggle.checked = bool(STORAGE.showDate, true);
    clockToggle.checked = bool(STORAGE.showClock, true);
    dateToggle.addEventListener('change', () => { setBool(STORAGE.showDate, dateToggle.checked); updateClockVisibility(); });
    clockToggle.addEventListener('change', () => { setBool(STORAGE.showClock, clockToggle.checked); updateClockVisibility(); });
    $('#v184-open-guide', pop).addEventListener('click', () => { pop.hidden = true; openGuide(false); });
    return pop;
  }

  function togglePopover(event) {
    event?.stopPropagation();
    const pop = ensurePopover();
    pop.hidden = !pop.hidden;
  }

  function ensureGuide() {
    let modal = $('#v184-onboarding');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'v184-onboarding';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="v184-guide-card" role="dialog" aria-modal="true" aria-labelledby="v184-guide-title">
        <div class="v184-guide-head"><h2 id="v184-guide-title"><i class="fas fa-wand-magic-sparkles" style="color:#0ea5e9"></i> دليل الاستخدام السريع</h2><button class="v184-guide-close" aria-label="إغلاق"><i class="fas fa-times"></i></button></div>
        <div class="v184-guide-step"><i class="fas fa-list-check"></i><div><b>1. افتح الحقول</b><p>اختر القسم ثم اكتب البيانات. زر «التالي» ينقلك للحقل التالي بسرعة.</p></div></div>
        <div class="v184-guide-step"><i class="fas fa-eye"></i><div><b>2. راجع البوليصة</b><p>استخدم «معاينة» للتأكد من ترتيب البيانات قبل الحفظ أو الاستخراج.</p></div></div>
        <div class="v184-guide-step"><i class="fas fa-floppy-disk"></i><div><b>3. احفظ العمل</b><p>احفظ البوليصة في الأرشيف، والنظام يحتفظ أيضًا بمسودة تلقائية أثناء الكتابة.</p></div></div>
        <div class="v184-guide-step"><i class="fas fa-file-export"></i><div><b>4. صدّر أو شارك</b><p>بعد المراجعة استخرج PDF أو JPG أو شارك البوليصة حسب صلاحيتك.</p></div></div>
        <div class="v184-guide-step"><i class="fas fa-house"></i><div><b>العودة السريعة</b><p>زر المنزل الصغير يعيدك للرئيسية من المعاينة أو الحقول أو أي وضع آخر.</p></div></div>
        <label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-weight:800"><input id="v184-no-guide" type="checkbox" checked> لا تظهر هذه التعليمات تلقائيًا مرة أخرى</label>
        <div class="v184-guide-actions"><button class="v184-guide-primary" id="v184-guide-start">ابدأ العمل</button><button class="v184-guide-secondary" id="v184-guide-later">لاحقًا</button></div>
      </section>`;
    document.body.appendChild(modal);
    const close = () => closeGuide(true);
    $('.v184-guide-close', modal).addEventListener('click', close);
    $('#v184-guide-start', modal).addEventListener('click', close);
    $('#v184-guide-later', modal).addEventListener('click', () => closeGuide(false));
    modal.addEventListener('click', e => { if (e.target === modal) closeGuide(false); });
    return modal;
  }

  function openGuide(auto=true) {
    if (!MOBILE()) return;
    const modal = ensureGuide();
    if (auto && bool(STORAGE.guideDone, false)) return;
    modal.hidden = false;
  }

  function closeGuide(saveChoice) {
    const modal = $('#v184-onboarding');
    const noGuide = $('#v184-no-guide');
    if (saveChoice && noGuide?.checked) setBool(STORAGE.guideDone, true);
    if (modal) modal.hidden = true;
  }

  function patchBottomNav() {
    const nav = $('#v13-bottom-nav');
    if (!MOBILE() || !nav || nav.dataset.v184 === '1') return;
    nav.dataset.v184 = '1';
    const focus = nav.querySelector('[data-act="focus"]');
    if (focus) {
      focus.dataset.act = 'help';
      focus.innerHTML = '<i class="fas fa-circle-question"></i><span>مساعدة</span>';
      focus.addEventListener('click', e => { e.stopImmediatePropagation(); openGuide(false); }, true);
    }
    const home = nav.querySelector('[data-act="home"]');
    if (home) home.addEventListener('click', e => { e.stopImmediatePropagation(); goHome(); }, true);
  }

  function patchPreview() {
    const head = $('#v13-preview-head');
    if (!MOBILE() || !head || head.dataset.v184 === '1') return;
    head.dataset.v184 = '1';
    const actions = head.lastElementChild;
    if (actions && !$('#v184-preview-home', head)) {
      const home = document.createElement('button');
      home.id = 'v184-preview-home';
      home.type = 'button';
      home.innerHTML = '<i class="fas fa-house"></i>';
      home.title = 'الرئيسية';
      home.addEventListener('click', goHome);
      actions.prepend(home);
    }
  }

  function init() {
    if (!MOBILE()) return;
    ensureClockBar();
    ensureHomeButton();
    ensurePopover();
    ensureGuide();
    patchBottomNav();
    patchPreview();
  }

  document.addEventListener('click', e => {
    const pop = $('#v184-display-popover');
    if (pop && !pop.hidden && !pop.contains(e.target) && !e.target.closest('#v184-clock-settings')) pop.hidden = true;
  });
  document.addEventListener('DOMContentLoaded', () => { init(); setTimeout(() => openGuide(true), 1700); });
  window.addEventListener('load', init);
  window.addEventListener('resize', init);
  setInterval(() => { updateClock(); patchBottomNav(); patchPreview(); }, 1000);
})();
