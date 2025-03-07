// IndexedDB database setup
const DB_NAME = 'inventoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'inventory';
const PENDING_STORE = 'pendingChanges';

class OfflineDB {
    constructor() {
        this.db = null;
        this.initDB();
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error opening database');
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create inventory store
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'qr_code' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('location', 'location', { unique: false });
                }

                // Create pending changes store
                if (!db.objectStoreNames.contains(PENDING_STORE)) {
                    db.createObjectStore(PENDING_STORE, { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                }
            };
        });
    }

    async getAllItems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addItem(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME, PENDING_STORE], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const pendingStore = transaction.objectStore(PENDING_STORE);

            // Add to main store
            store.put(item);

            // Add to pending changes
            pendingStore.add({
                type: 'add',
                item: item,
                timestamp: new Date().toISOString()
            });

            transaction.oncomplete = () => {
                this.requestSync();
                resolve(item);
            };
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async updateItem(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME, PENDING_STORE], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const pendingStore = transaction.objectStore(PENDING_STORE);

            store.put(item);
            pendingStore.add({
                type: 'update',
                item: item,
                timestamp: new Date().toISOString()
            });

            transaction.oncomplete = () => {
                this.requestSync();
                resolve(item);
            };
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async deleteItem(qrCode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME, PENDING_STORE], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const pendingStore = transaction.objectStore(PENDING_STORE);

            store.delete(qrCode);
            pendingStore.add({
                type: 'delete',
                qrCode: qrCode,
                timestamp: new Date().toISOString()
            });

            transaction.oncomplete = () => {
                this.requestSync();
                resolve(qrCode);
            };
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getPendingChanges() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PENDING_STORE], 'readonly');
            const store = transaction.objectStore(PENDING_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearPendingChanges() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PENDING_STORE], 'readwrite');
            const store = transaction.objectStore(PENDING_STORE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    requestSync() {
        if ('serviceWorker' in navigator && 'sync' in registration) {
            navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('sync-data')
                    .catch(err => console.error('Sync registration failed:', err));
            });
        }
    }
} 