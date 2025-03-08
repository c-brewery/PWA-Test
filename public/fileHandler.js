export class FileHandler {
  constructor() {
    this.lastLoadedFileKey = 'lastLoadedFile';
    this.cachedDataKey = 'cachedInventoryData';
    this.inventoryData = [];
    // Load cached data on initialization
    const cachedData = this.loadCachedData();
    if (cachedData && cachedData.data) {
      this.inventoryData = cachedData.data;
    }
  }

  handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      localStorage.setItem(this.lastLoadedFileKey, file.name);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const jsonContent = e.target.result;
          const parsedData = JSON.parse(jsonContent);
          this.inventoryData = parsedData.inventory || [];
          this.saveToCache();
          resolve(this.inventoryData);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };

      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  loadCachedData() {
    const lastLoadedFile = localStorage.getItem(this.lastLoadedFileKey);
    const cachedData = localStorage.getItem(this.cachedDataKey);
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        this.inventoryData = parsedData;
        return {
          fileName: lastLoadedFile || 'inventory.json',
          data: this.inventoryData
        };
      } catch (error) {
        console.error('Error parsing cached data:', error);
      }
    }
    return null;
  }

  saveToCache() {
    localStorage.setItem(this.cachedDataKey, JSON.stringify(this.inventoryData));
  }

  downloadCurrentData(filename = 'inventory.json') {
    const jsonContent = JSON.stringify({ inventory: this.inventoryData }, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  getData() {
    return this.inventoryData;
  }

  updateData(newData) {
    this.inventoryData = newData;
    this.saveToCache();
  }

  findItemByQRCode(qrCode) {
    return this.inventoryData.find(item => item.qr_code === qrCode);
  }
}