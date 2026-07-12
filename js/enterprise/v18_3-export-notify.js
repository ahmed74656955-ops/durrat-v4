
import { supabase } from '../config/supabase.js';
const getSession=()=>{try{return JSON.parse(localStorage.getItem('enterprise_session')||'{}')}catch{return {}}};
const addNotification=async(type,awb)=>{
  try{
    const s=getSession(),u=s?.user?.username||'غير معروف',branch=s?.branch?.code||s?.user?.branch_code||'';
    const labels={export_pdf:'تصدير PDF',export_image:'تصدير JPG',share_waybill:'مشاركة بوليصة'};
    await supabase.from('system_notifications').insert([{title:`${u} — ${labels[type]||type}`,message:`قام المستخدم ${u} بتنفيذ ${labels[type]||type} للبوليصة ${awb||'بدون رقم'}`,branch_code:branch,level:'info',created_by:u,is_active:true}]);
  }catch(e){console.warn('notification failed',e)}
};
const wait=async()=>{for(let i=0;i<120;i++){if(window.ExportEngine&&window.StateMgr)return;await new Promise(r=>setTimeout(r,50))}};
wait().then(()=>{
  if(window.__v183ExportNotify)return;window.__v183ExportNotify=true;
  const wrap=(name,type)=>{const old=window.ExportEngine?.[name]?.bind(window.ExportEngine);if(!old)return;window.ExportEngine[name]=async function(...args){const awb=window.StateMgr?.data?.awb_no||'بدون رقم';const result=await old(...args);await addNotification(type,awb);return result;}};
  wrap('generatePDF','export_pdf');wrap('generateImage','export_image');wrap('shareDocument','share_waybill');
});
