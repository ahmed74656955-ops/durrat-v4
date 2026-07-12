(() => {
  'use strict';
  const MOBILE = () => window.matchMedia('(max-width: 900px)').matches;
  const $ = (s, r=document) => r.querySelector(s);

  function sidebarOpen() {
    const sidebar = $('.sidebar');
    return !!(sidebar && (sidebar.classList.contains('mobile-open') || sidebar.classList.contains('active') || sidebar.classList.contains('open')));
  }

  function ensureFocusHead() {
    if ($('#v185-focus-head')) return;
    const head = document.createElement('div');
    head.id = 'v185-focus-head';
    head.innerHTML = `
      <div class="v185-title"><i class="fas fa-list-check"></i> وضع التركيز للحقول</div>
      <div class="v185-actions">
        <button type="button" class="v185-home" aria-label="الرئيسية"><i class="fas fa-house"></i><span>الرئيسية</span></button>
        <button type="button" class="v185-close" aria-label="إغلاق الحقول"><i class="fas fa-arrow-down"></i><span>إغلاق</span></button>
      </div>`;
    document.body.appendChild(head);
    $('.v185-home', head).addEventListener('click', () => {
      closeFields(true);
      window.scrollTo({top:0, behavior:'smooth'});
    });
    $('.v185-close', head).addEventListener('click', () => closeFields(false));
  }

  function openFieldsFocus() {
    if (!MOBILE()) return;
    const sidebar = $('.sidebar');
    if (!sidebar) return;
    sidebar.classList.add('mobile-open');
    document.body.classList.add('v185-fields-focus');
    document.body.classList.remove('v13-focus-mode');
    localStorage.setItem('durrat_mobile_fields_open', '1');
    const scroller = $('.form-scroller');
    requestAnimationFrame(() => scroller?.focus?.({preventScroll:true}));
  }

  function closeFields(goHome=false) {
    const sidebar = $('.sidebar');
    sidebar?.classList.remove('mobile-open','active','open','show');
    document.body.classList.remove('v185-fields-focus','v13-focus-mode');
    localStorage.setItem('durrat_mobile_fields_open', '0');
    if (goHome) history.replaceState(null, '', location.pathname);
  }

  function syncFocusState() {
    if (!MOBILE()) {
      document.body.classList.remove('v185-fields-focus');
      return;
    }
    if (sidebarOpen()) document.body.classList.add('v185-fields-focus');
    else document.body.classList.remove('v185-fields-focus');
  }

  function interceptProblemSwipe() {
    const sidebar = $('.sidebar');
    if (!sidebar || sidebar.dataset.v185SwipeGuard === '1') return;
    sidebar.dataset.v185SwipeGuard = '1';
    let startedInsideScroller = false;
    sidebar.addEventListener('touchstart', e => {
      startedInsideScroller = !!e.target.closest('.form-scroller, .input-group, input, textarea, select, button, details');
    }, {capture:true, passive:true});
    sidebar.addEventListener('touchend', e => {
      if (MOBILE() && startedInsideScroller) {
        e.stopImmediatePropagation();
        startedInsideScroller = false;
      }
    }, {capture:true, passive:true});
  }

  function patchFieldButtons() {
    if (!MOBILE()) return;
    const floating = $('#mobile-fields-toggle');
    if (floating && floating.dataset.v185 !== '1') {
      floating.dataset.v185 = '1';
      floating.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        sidebarOpen() ? closeFields(false) : openFieldsFocus();
      }, true);
    }
    const navFields = $('#v13-bottom-nav [data-act="fields"]');
    if (navFields && navFields.dataset.v185 !== '1') {
      navFields.dataset.v185 = '1';
      navFields.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openFieldsFocus();
      }, true);
    }
  }

  function patchHomeActions() {
    const actions = [
      '#v184-home-btn',
      '#v13-bottom-nav [data-act="home"]',
      '#v184-preview-home'
    ];
    actions.forEach(sel => {
      const el = $(sel);
      if (!el || el.dataset.v185Home === '1') return;
      el.dataset.v185Home = '1';
      el.addEventListener('click', () => closeFields(true), true);
    });
  }

  function observeSidebar() {
    const sidebar = $('.sidebar');
    if (!sidebar || sidebar.dataset.v185Observer === '1') return;
    sidebar.dataset.v185Observer = '1';
    new MutationObserver(syncFocusState).observe(sidebar, {attributes:true, attributeFilter:['class']});
  }

  function init() {
    if (!MOBILE()) return;
    ensureFocusHead();
    patchFieldButtons();
    patchHomeActions();
    interceptProblemSwipe();
    observeSidebar();
    syncFocusState();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
  window.addEventListener('resize', init);
  window.addEventListener('orientationchange', () => setTimeout(init, 250));
  setInterval(init, 900);

  window.DurratMobileFocus = {open:openFieldsFocus, close:closeFields, sync:syncFocusState};
})();
