
/* Durrat ERP V10 runtime fixes: desktop/mobile separation + stable mobile export */
(function(){
  'use strict';
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  function applyMode(){
    const mobile = isMobile();
    document.body.classList.toggle('is-mobile-layout', mobile);
    document.body.classList.toggle('is-desktop-layout', !mobile);
    const preview = document.getElementById('preview-container') || document.querySelector('.preview-area');
    const doc = document.getElementById('document-wrapper') || document.querySelector('.document-wrapper');
    if(!preview || !doc) return;
    preview.style.direction = 'ltr';
    doc.style.left = 'auto';
    doc.style.right = 'auto';
    doc.style.marginLeft = 'auto';
    doc.style.marginRight = 'auto';
    doc.style.transformOrigin = 'top center';
    if(!mobile){
      const sidebar = document.querySelector('.sidebar');
      if(sidebar) sidebar.classList.remove('mobile-open');
      doc.classList.remove('mobile-centered-waybill');
      setTimeout(()=>{ try { preview.scrollLeft = 0; } catch(e){} }, 80);
      if(window.ZoomEngine && typeof ZoomEngine.reset === 'function') setTimeout(()=>ZoomEngine.reset(), 120);
    } else {
      setTimeout(()=>{
        try { preview.scrollLeft = Math.max(0, (preview.scrollWidth - preview.clientWidth) / 2); } catch(e){}
      }, 180);
    }
  }

  function patchZoom(){
    if(!window.ZoomEngine || ZoomEngine.__v10Patched) return;
    const originalApply = ZoomEngine.apply ? ZoomEngine.apply.bind(ZoomEngine) : null;
    ZoomEngine.apply = function(){
      if(!this.wrapper) this.init && this.init();
      if(!this.wrapper) return;
      if(isMobile()){
        this.wrapper.style.transform = 'none';
        this.wrapper.style.zoom = String(this.scale || 1);
        this.wrapper.style.marginLeft = 'auto';
        this.wrapper.style.marginRight = 'auto';
        this.wrapper.classList.add('mobile-centered-waybill');
        const preview = document.getElementById('preview-container');
        if(preview) setTimeout(()=>{ try { preview.scrollLeft = Math.max(0,(preview.scrollWidth-preview.clientWidth)/2); } catch(e){} }, 50);
      } else {
        this.wrapper.style.zoom = '';
        this.wrapper.style.transform = `scale(${this.scale || 1})`;
        this.wrapper.style.marginLeft = 'auto';
        this.wrapper.style.marginRight = 'auto';
      }
    };
    const originalReset = ZoomEngine.reset ? ZoomEngine.reset.bind(ZoomEngine) : null;
    ZoomEngine.reset = function(){
      const container = document.getElementById('preview-container');
      const baseWidth = 1123;
      if(isMobile()){
        const available = Math.max(280, (container?.clientWidth || window.innerWidth) - 20);
        this.scale = Math.min(available / baseWidth, 1);
      } else {
        const available = Math.max(520, (container?.clientWidth || window.innerWidth) - 60);
        this.scale = Math.min(available / baseWidth, 1);
      }
      this.apply();
    };
    ZoomEngine.__v10Patched = true;
  }

  function patchExport(){
    if(!window.ExportEngine || ExportEngine.__v10ExportPatched) return;
    const capture = async function(){
      const source = document.getElementById('document-wrapper');
      if(!source || !window.html2canvas) throw new Error('تعذر العثور على البوليصة أو مكتبة التصدير');
      await (window.ArchiveEngine?.saveCurrent?.(true).catch?.(()=>{}) || Promise.resolve());
      const clone = source.cloneNode(true);
      clone.id = 'document-wrapper-export-clone';
      clone.classList.add('durrat-export-clone');
      clone.querySelectorAll('.guide-line,.no-image-overlay').forEach(el=>el.remove());
      const holder = document.createElement('div');
      holder.style.cssText = [
        'position:fixed','left:-20000px','top:0','width:1123px','min-width:1123px','background:#fff',
        'padding:0','margin:0','z-index:-1','opacity:1','pointer-events:none','overflow:visible'
      ].join(';');
      clone.style.cssText = [
        'position:relative','display:block','width:1123px','min-width:1123px','min-height:794px','height:auto',
        'margin:0','padding:0','transform:none','zoom:1','left:auto','right:auto','top:auto','bottom:auto',
        'background:#ffffff','box-shadow:none','overflow:visible','direction:rtl'
      ].join(';');
      clone.querySelectorAll('*').forEach(el=>{
        el.style.transform = el.classList.contains('field-overlay') ? el.style.transform : 'none';
        if(el.style.zoom) el.style.zoom = '1';
      });
      holder.appendChild(clone);
      document.body.appendChild(holder);
      try{
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        return await html2canvas(clone, { scale: 2.5, useCORS:true, allowTaint:true, backgroundColor:'#ffffff', width:1123, windowWidth:1123, scrollX:0, scrollY:0 });
      } finally {
        holder.remove();
      }
    };
    ExportEngine.safeCapture = capture;
    ExportEngine.__v10ExportPatched = true;
  }

  ready(()=>{
    applyMode();
    patchZoom();
    patchExport();
    setTimeout(()=>{ applyMode(); patchZoom(); patchExport(); }, 700);
    setTimeout(()=>{ applyMode(); window.ZoomEngine?.reset?.(); }, 1600);
    window.addEventListener('resize', ()=>setTimeout(applyMode, 120), {passive:true});
    window.addEventListener('orientationchange', ()=>setTimeout(applyMode, 350), {passive:true});
  });
  window.DurratV10Fixes = { applyMode };
})();
