export class FileHandler {
  constructor() {
    this.data = [];
    this.db = null;
    this.initDB();
  }

  async initDB() {
    try {
      const request = indexedDB.open('inventoryDB', 1);
      request.onsuccess = (event) => {
        this.db = event.target.result;
      };
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
    }
  }

  async handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          this.data = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          // Store in IndexedDB
          if (this.db) {
            const transaction = this.db.transaction(['inventory'], 'readwrite');
            const store = transaction.objectStore('inventory');
            
            // Clear existing data
            await store.clear();
            
            // Add new data
            for (const item of this.data) {
              await store.put(item);
            }
          }
          
          // Also store in localStorage as backup
          this.saveToCache();
          resolve(this.data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  saveToCache() {
    try {
      localStorage.setItem('inventoryData', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: this.data
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  loadCachedData() {
    try {
      const cached = localStorage.getItem('inventoryData');
      if (cached) {
        const parsedData = JSON.parse(cached);
        this.data = parsedData.data;
        return parsedData;
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  }

  getData() {
    return this.data;
  }

  findItemByQRCode(qrCode) {
    return this.data.find(item => item.qr_code === qrCode);
  }

  downloadCurrentData(filename) {
    const jsonString = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}