export class FileHandler {
  constructor() {
    this.data = [];
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('inventoryDB', 1);
        
        request.onerror = () => {
          console.error('Error opening database');
          reject(request.error);
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('inventory')) {
            db.createObjectStore('inventory', { keyPath: 'qr_code' });
          }
        };
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
        reject(error);
      }
    });
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
            try {
              const transaction = this.db.transaction(['inventory'], 'readwrite');
              const store = transaction.objectStore('inventory');
              
              // Clear existing data
              await new Promise((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = () => reject(clearRequest.error);
              });
              
              // Add new data
              for (const item of this.data) {
                await new Promise((resolve, reject) => {
                  const addRequest = store.add(item);
                  addRequest.onsuccess = () => resolve();
                  addRequest.onerror = () => reject(addRequest.error);
                });
              }
            } catch (error) {
              console.error('Error storing in IndexedDB:', error);
            }
          }
          
          // Store in localStorage as backup
          this.saveToCache();
          resolve(this.data);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          reject(new Error('Invalid JSON file'));
        }
      };

      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  }

  saveToCache() {
    try {
      const dataToCache = {
        timestamp: new Date().toISOString(),
        data: this.data
      };
      localStorage.setItem('inventoryData', JSON.stringify(dataToCache));
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
    try {
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
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Error downloading file: ' + error.message);
    }
  }
}