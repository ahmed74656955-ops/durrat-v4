import { supabase } from '../config/supabase.js';

export const SyncEngine = {
    db: null,
    isOnline: navigator.onLine,

    async init() {
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
        await this.initLocalDB();
        
        if (this.isOnline) {
            this.syncPendingData();
        }
    },

    handleConnectionChange(status) {
        this.isOnline = status;
        if (status) {
            console.log("تمت استعادة الاتصال.. جاري المزامنة التلقائية.");
            if(window.UI) window.UI.toast("عاد الاتصال بالإنترنت.. جاري مزامنة البوالص المعلقة", "info");
            this.syncPendingData();
        } else {
            if(window.UI) window.UI.toast("انقطع الاتصال.. النظام يعمل الآن في وضع عدم الاتصال", "warning");
        }
    },

    initLocalDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("DurratERP_Offline", 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("sync_queue")) {
                    db.createObjectStore("sync_queue", { keyPath: "id" });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            request.onerror = () => reject("خطأ في تهيئة قاعدة بيانات المزامنة");
        });
    },

    async saveWaybill(waybillData) {
        const branchCode = localStorage.getItem('waybill_branch_prefix') || 'UNKNOWN';
        const payload = {
            id: new Date().getTime().toString(),
            branch_id: branchCode,
            awb_no: waybillData.awb_no,
            full_data: waybillData
        };

        if (this.isOnline) {
            await this.pushToCloud(payload);
        } else {
            await this.saveLocally('sync_queue', payload);
            if(window.UI) window.UI.toast("تم الحفظ محلياً. ستتم المزامنة تلقائياً عند توفر الإنترنت", "warning");
        }
    },

    async pushToCloud(payload) {
        try {
            const { error } = await supabase
                .from('waybills')
                .upsert([
                    { awb_no: payload.awb_no, branch_id: payload.branch_id, full_data: payload.full_data }
                ], { onConflict: 'awb_no' });

            if (error) throw error;
            
            if(window.UI) window.UI.toast("تم حفظ/تحديث البوليصة سحابياً بنجاح", "success");
            this.removeFromQueue(payload.id);
            
        } catch (error) {
            console.error("فشل الرفع السحابي:", error);
            await this.saveLocally('sync_queue', payload);
        }
    },

    async syncPendingData() {
        if(!this.db) return;
        const transaction = this.db.transaction("sync_queue", "readonly");
        const store = transaction.objectStore("sync_queue");
        const request = store.getAll();

        request.onsuccess = async () => {
            const pendingItems = request.result;
            if(pendingItems.length > 0) {
                console.log(`جاري مزامنة ${pendingItems.length} بوالص معلقة...`);
                for (let item of pendingItems) {
                    await this.pushToCloud(item);
                }
            }
        };
    },

    saveLocally(storeName, data) {
        return new Promise((resolve) => {
            if(!this.db) resolve();
            const tx = this.db.transaction(storeName, "readwrite");
            tx.objectStore(storeName).put(data);
            tx.oncomplete = () => resolve();
        });
    },

    removeFromQueue(id) {
        if(!this.db) return;
        const tx = this.db.transaction("sync_queue", "readwrite");
        tx.objectStore("sync_queue").delete(id);
    }
};
