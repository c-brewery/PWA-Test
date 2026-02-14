// Simple Node.js test to verify the data persistence logic
const fs = require('fs');

// Simulate the FileHandler class behavior
class TestFileHandler {
  constructor() {
    this.cachedDataKey = 'cachedInventoryData';
    this.lastLoadedFileKey = 'lastLoadedFile';
    this.inventoryData = [];
    this.storage = {}; // Simulate localStorage
  }

  loadFile(jsonData) {
    try {
      this.inventoryData = JSON.parse(jsonData);
      this.storage[this.cachedDataKey] = JSON.stringify(this.inventoryData);
      this.storage[this.lastLoadedFileKey] = 'test.json';
      console.log('✅ File loaded and saved to cache');
      return this.inventoryData;
    } catch (error) {
      console.error('❌ Error loading file:', error);
      return null;
    }
  }

  findItemByQRCode(qrCode) {
    return this.inventoryData.find(item => item.qr_code === qrCode);
  }

  saveToCache() {
    try {
      const jsonString = JSON.stringify(this.inventoryData);
      this.storage[this.cachedDataKey] = jsonString;
      console.log('✅ Data saved to cache');
      console.log('   Size:', jsonString.length, 'bytes');
      console.log('   Items:', this.inventoryData.length);
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  loadCachedData() {
    const cachedData = this.storage[this.cachedDataKey];
    if (cachedData) {
      try {
        this.inventoryData = JSON.parse(cachedData);
        console.log('✅ Loaded cached data with', this.inventoryData.length, 'items');
        return this.inventoryData;
      } catch (error) {
        console.error('❌ Error parsing cached data:', error);
      }
    } else {
      console.log('ℹ️ No cached data found');
    }
    return null;
  }

  getData() {
    return this.inventoryData;
  }
}

// Test the flow
console.log('\n=== DATA PERSISTENCE TEST ===\n');

const handler = new TestFileHandler();

// Step 1: Load a file
console.log('Step 1: Load JSON file');
const testData = JSON.stringify([
  { qr_code: 'ABC123', name: 'Item A', current_stock: 10, expected_stock: 20 },
  { qr_code: 'ABC456', name: 'Item B', current_stock: 5, expected_stock: 15 }
]);
handler.loadFile(testData);

// Step 2: Get an item and modify it
console.log('\nStep 2: Find and modify an item');
const item = handler.findItemByQRCode('ABC123');
console.log('Found item:', item);
if (item) {
  item.current_stock = 15;
  item.expected_stock = 25;
  console.log('Modified item to:', item);
}

// Step 3: Save to cache
console.log('\nStep 3: Save to cache');
handler.saveToCache();

// Step 4: Clear memory and reload from cache
console.log('\nStep 4: Clear memory and reload from cache (simulating page reload)');
handler.inventoryData = [];
console.log('Memory cleared, inventory data length:', handler.inventoryData.length);

const reloadedData = handler.loadCachedData();
if (reloadedData) {
  console.log('Reloaded item with QR ABC123:', reloadedData.find(x => x.qr_code === 'ABC123'));
}

// Verify
console.log('\n=== VERIFICATION ===');
const finalItem = handler.getData().find(x => x.qr_code === 'ABC123');
if (finalItem && finalItem.current_stock === 15 && finalItem.expected_stock === 25) {
  console.log('✅ SUCCESS: Changes persisted correctly!');
  console.log('   Current stock: 15 (expected 15) ✓');
  console.log('   Expected stock: 25 (expected 25) ✓');
} else {
  console.log('❌ FAILURE: Changes did not persist');
  console.log('   Got:', finalItem);
}
