import { QRScanner } from "./qrScanner.js";
import { FileHandler } from "./fileHandler.js";
import { ModalHandler } from "./modalHandler.js";

// Helper function to add touch and click support for Android compatibility
function addClickListener(element, callback) {
  if (!element) return;
  
  // Add click event
  element.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    callback();
  });
  
  // Add touchend as fallback for Android devices
  element.addEventListener("touchend", function(e) {
    e.preventDefault();
    e.stopPropagation();
    callback();
  });
}

// Notification/Toast System
class NotificationManager {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background-color: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
      color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
      border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
      border-radius: 4px;
      z-index: 9999;
      font-size: 14px;
      max-width: 400px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-in-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  static showLoading(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'appLoader';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9998;
    `;
    loader.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
        <p style="margin: 0; color: #333;">${message}</p>
      </div>
    `;
    document.body.appendChild(loader);
    return loader;
  }

  static hideLoading() {
    const loader = document.getElementById('appLoader');
    if (loader) loader.remove();
  }
}

// Add animation styles if not already present
if (!document.getElementById('notificationStyles')) {
  const style = document.createElement('style');
  style.id = 'notificationStyles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Constants
const COLUMN_DISPLAY_NAMES = {
  qr_code: "QR Code",
  name: "Name",
  location: "Standort",
  description: "Beschreibung",
  category: "Kategorie",
  current_stock: "Aktueller Bestand",
  expected_stock: "Erwarteter Bestand",
  stock_last_updated: "Letzte Inventur",
  last_updated: "Zuletzt aktualisiert"
};

const SEARCHABLE_COLUMNS = ["qr_code", "name", "location"];

// Default settings
const DEFAULT_SETTINGS = {
  columns: {
    qr_code: true, // Always visible
    name: true,
    location: true,
    description: false,
    category: false,
    current_stock: false,
    expected_stock: false,
    stock_last_updated: false
  },
  highlight_discrepancies: false,
  show_timestamps: true
};

// DOM element selectors
const SELECTORS = {
  uploadButton: "#content button#uploadButton",
  downloadJsonButton: "#content button#downloadJsonButton",
  jsonFileInput: "#jsonFileInput",
  qrScannerModal: "#qrScannerModal",
  openQrScanner: "#openQrScanner",
  closeQrScanner: "#closeQrScanner",
  reopenScannerButton: "#reopenScannerButton",
  settingsButton: "#content button#settingsButton",
  settingsModal: "#settingsModal",
  saveSettings: "#saveSettings",
  searchInput: "#qrCodeResult",
  clearSearch: "#clearSearch",
  tableBody: "#tableBody",
  tableHead: ".sortable-table thead tr",
  jsonOutput: "#jsonOutput",
  reader: "#reader",
  myDropdown: "#myDropdown",
  noResultsMessage: "#noResultsMessage"
};

// Application state
class AppState {
  constructor() {
    this.settings = this.loadSettings();
    this.fileHandler = new FileHandler();
    this.qrScanner = new QRScanner();
    this.modalHandler = null;
    this.currentSort = { column: "", ascending: true };
  }

  loadSettings() {
    return JSON.parse(localStorage.getItem('appSettings')) || DEFAULT_SETTINGS;
  }

  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
  }
}

// Settings management
class SettingsManager {
  constructor(appState) {
    this.appState = appState;
  }

  initialize() {
    this.updateCheckboxes();
  }

  updateCheckboxes() {
    // Update column checkboxes
    for (const [key, value] of Object.entries(this.appState.settings.columns)) {
      const checkbox = document.getElementById(`col_${key}`);
      if (checkbox) {
        checkbox.checked = value;
      }
    }

    // Update other settings
    const highlightCheckbox = document.getElementById('setting_highlight_discrepancies');
    const timestampsCheckbox = document.getElementById('setting_show_timestamps');
    
    if (highlightCheckbox) highlightCheckbox.checked = this.appState.settings.highlight_discrepancies;
    if (timestampsCheckbox) timestampsCheckbox.checked = this.appState.settings.show_timestamps;
  }

  save() {
    // Save column settings
    for (const [key] of Object.entries(this.appState.settings.columns)) {
      const checkbox = document.getElementById(`col_${key}`);
      if (checkbox && !checkbox.disabled) {
        this.appState.settings.columns[key] = checkbox.checked;
      }
    }

    // Save other settings
    const highlightCheckbox = document.getElementById('setting_highlight_discrepancies');
    const timestampsCheckbox = document.getElementById('setting_show_timestamps');
    
    if (highlightCheckbox) this.appState.settings.highlight_discrepancies = highlightCheckbox.checked;
    if (timestampsCheckbox) this.appState.settings.show_timestamps = timestampsCheckbox.checked;

    this.appState.saveSettings();
  }
}

// Table management
class TableManager {
  constructor(appState) {
    this.appState = appState;
    this.noResultsMessage = null;
    this.currentData = [];
    this.currentHeadersVisible = {};
  }

  displayData(jsonData, highlightQrCode = null) {
    const tableBody = document.querySelector(SELECTORS.tableBody);
    const tableHead = document.querySelector(SELECTORS.tableHead);
    
    if (!tableBody || !tableHead) return;

    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    // Check if we need to rebuild headers (column visibility changed)
    const headersChanged = this.checkHeadersChanged();
    if (headersChanged) {
      tableHead.innerHTML = "";
      this.createTableHeaders(tableHead);
      tableBody.innerHTML = "";
      this.currentData = [];
    }
    
    // Use incremental update for table rows
    this.updateTableRows(tableBody, dataArray, highlightQrCode);
    this.currentData = dataArray;
    this.setupSorting();
  }

  checkHeadersChanged() {
    const newHeadersVisible = {...this.appState.settings.columns};
    const changed = JSON.stringify(newHeadersVisible) !== JSON.stringify(this.currentHeadersVisible);
    if (changed) {
      this.currentHeadersVisible = newHeadersVisible;
    }
    return changed;
  }

  updateTableRows(tableBody, newData, highlightQrCode) {
    // Get current rows
    const currentRows = Array.from(tableBody.querySelectorAll('tr'));
    
    // If data length changed significantly, just rebuild
    if (Math.abs(currentRows.length - newData.length) > 5 || this.currentData.length === 0) {
      tableBody.innerHTML = "";
      newData.forEach((item) => {
        const row = this.createTableRow(item, highlightQrCode);
        tableBody.appendChild(row);
      });
      return;
    }
    
    // Incremental update: update existing rows and add/remove as needed
    newData.forEach((item, index) => {
      if (index < currentRows.length) {
        // Update existing row
        const row = currentRows[index];
        const rowHtml = this.buildRowHtml(item);
        row.innerHTML = rowHtml;
        row.style.cursor = "pointer";
        
        // Update classes
        row.classList.remove('scanned-row', 'stock-discrepancy');
        if (highlightQrCode && item.qr_code === highlightQrCode) {
          row.classList.add('scanned-row');
        }
        if (this.shouldHighlightDiscrepancy(item)) {
          row.classList.add('stock-discrepancy');
        }
        
        // Re-attach click handler
        row.onclick = null;
        // Remove old event listeners by cloning node
        const newRow = row.cloneNode(true);
        row.parentNode.replaceChild(newRow, row);
        addClickListener(newRow, () => this.handleRowClick(item, newData));
      } else {
        // Add new row
        const row = this.createTableRow(item, highlightQrCode);
        tableBody.appendChild(row);
      }
    });
    
    // Remove extra rows if data is smaller
    while (currentRows.length > newData.length) {
      currentRows[currentRows.length - 1].remove();
      currentRows.pop();
    }
  }

  createTableHeaders(tableHead) {
    for (const [key, visible] of Object.entries(this.appState.settings.columns)) {
      if (visible) {
        const th = document.createElement("th");
        th.dataset.sort = key;
        const displayName = COLUMN_DISPLAY_NAMES[key] || key;
        th.innerHTML = `${displayName} <span class="sort-icon">↕</span>`;
        tableHead.appendChild(th);
      }
    }
  }

  createTableRow(item, highlightQrCode) {
    const row = document.createElement("tr");
    
    // Add highlighting classes
    if (highlightQrCode && item.qr_code === highlightQrCode) {
      row.classList.add("scanned-row");
    }

    if (this.shouldHighlightDiscrepancy(item)) {
      row.classList.add("stock-discrepancy");
    }

    // Create row content
    const rowHtml = this.buildRowHtml(item);
    row.innerHTML = rowHtml;

    // Add click handler with touch support
    row.style.cursor = "pointer";
    addClickListener(row, () => this.handleRowClick(item, this.currentData));

    return row;
  }

  shouldHighlightDiscrepancy(item) {
    return this.appState.settings.highlight_discrepancies && 
           item.current_stock !== undefined && 
           item.expected_stock !== undefined && 
           item.current_stock !== item.expected_stock;
  }

  buildRowHtml(item) {
    const stockLastUpdated = new Date(item.stock_last_updated);
    const isValidStockUpdate = !isNaN(stockLastUpdated.getTime());
    let rowHtml = '';

    for (const [key, visible] of Object.entries(this.appState.settings.columns)) {
      if (visible) {
        rowHtml += this.createCellHtml(key, item, isValidStockUpdate);
      }
    }

    return rowHtml;
  }

  createCellHtml(key, item, isValidStockUpdate) {
    if (key === 'qr_code') {
      const checkIcon = isValidStockUpdate ? '<i class="fa fa-check-circle" style="color: #4CAF50; margin-right: 8px;"></i>' : '';
      return `<td>${checkIcon}${item[key] || ""}</td>`;
    } else if (key === 'stock_last_updated' && this.appState.settings.show_timestamps) {
      const date = new Date(item[key]);
      return `<td>${isValidStockUpdate ? date.toLocaleString() : ''}</td>`;
    } else {
      return `<td>${item[key] || ""}</td>`;
    }
  }

  handleRowClick(item, dataArray) {
    if (!this.appState.modalHandler) return;
    
    this.appState.modalHandler.show(item);
  }

  setupSorting() {
    const table = document.querySelector(".sortable-table");
    const headers = table.querySelectorAll("th");

    headers.forEach((header) => {
      header.addEventListener("click", () => this.handleSort(header, headers, table));
    });
  }

  handleSort(clickedHeader, headers, table) {
    const column = clickedHeader.dataset.sort;
    const ascending = this.appState.currentSort.column === column ? !this.appState.currentSort.ascending : true;

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.sort((a, b) => {
      const aValue = a.children[Array.from(headers).indexOf(clickedHeader)].textContent;
      const bValue = b.children[Array.from(headers).indexOf(clickedHeader)].textContent;
      return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });

    this.appState.currentSort = { column, ascending };

    const tbody = table.querySelector("tbody");
    rows.forEach((row) => tbody.appendChild(row));

    this.updateSortArrows(headers, clickedHeader, ascending);
  }

  updateSortArrows(headers, clickedHeader, ascending) {
    headers.forEach((header) => {
      const arrow = header.querySelector(".sort-icon");
      if (header === clickedHeader) {
        arrow.textContent = ascending ? "↓" : "↑";
      } else {
        arrow.textContent = "↕";
      }
    });
  }

  filter(searchTerm) {
    const rows = document.querySelectorAll(`${SELECTORS.tableBody} tr`);
    const visibleColumns = Object.entries(this.appState.settings.columns)
      .filter(([_, visible]) => visible)
      .map(([key]) => key);

    let hasVisibleRows = false;

    rows.forEach(row => {
      const cells = Array.from(row.getElementsByTagName("td"));
      const textContent = this.getSearchableText(cells, visibleColumns);

      if (textContent.includes(searchTerm.toLowerCase())) {
        row.classList.remove("row-hidden");
        hasVisibleRows = true;
      } else {
        row.classList.add("row-hidden");
      }
    });

    this.toggleNoResultsMessage(!hasVisibleRows && searchTerm);
  }

  getSearchableText(cells, visibleColumns) {
    return cells
      .map((cell, index) => ({
        text: cell.textContent.trim().toLowerCase(),
        column: visibleColumns[index]
      }))
      .filter(({ column }) => SEARCHABLE_COLUMNS.includes(column))
      .map(({ text }) => text)
      .join(" ");
  }

  toggleNoResultsMessage(show) {
    if (!this.noResultsMessage) {
      this.noResultsMessage = this.createNoResultsMessage();
    }
    this.noResultsMessage.style.display = show ? "block" : "none";
  }

  createNoResultsMessage() {
    const message = document.createElement("div");
    message.id = "noResultsMessage";
    message.style.textAlign = "center";
    message.style.padding = "20px";
    message.style.color = "#666";
    message.textContent = "Keine Ergebnisse gefunden";
    
    const table = document.querySelector(".sortable-table");
    if (table && table.parentNode) {
      table.parentNode.insertBefore(message, table.nextSibling);
    }
    
    return message;
  }
}

// Search functionality
class SearchManager {
  constructor(appState, tableManager) {
    this.appState = appState;
    this.tableManager = tableManager;
    this.searchInput = document.querySelector(SELECTORS.searchInput);
    this.clearButton = document.querySelector(SELECTORS.clearSearch);
  }

  initialize() {
    if (!this.searchInput || !this.clearButton) return;

    this.searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      this.tableManager.filter(searchTerm);
      this.clearButton.style.display = searchTerm ? "block" : "none";
    });

    addClickListener(this.clearButton, () => {
      this.searchInput.value = "";
      this.tableManager.filter("");
      this.clearButton.style.display = "none";
    });
  }

  setSearchTerm(term) {
    if (this.searchInput) {
      this.searchInput.value = term;
      this.tableManager.filter(term);
      if (this.clearButton) {
        this.clearButton.style.display = term ? "block" : "none";
      }
    }
  }

  clearSearch() {
    this.setSearchTerm("");
  }
}

// QR Scanner management
class QRScannerManager {
  constructor(appState, tableManager, searchManager) {
    this.appState = appState;
    this.tableManager = tableManager;
    this.searchManager = searchManager;
    this.qrScannerModal = document.querySelector(SELECTORS.qrScannerModal);
  }

  initialize() {
    const openBtn = document.querySelector(SELECTORS.openQrScanner);
    const closeBtn = document.querySelector(SELECTORS.closeQrScanner);
    const reopenBtn = document.querySelector(SELECTORS.reopenScannerButton);

    addClickListener(openBtn, () => this.openScanner());
    addClickListener(closeBtn, () => this.closeScanner());
    addClickListener(reopenBtn, () => this.reopenScanner());
  }

  async openScanner() {
    if (this.qrScannerModal) this.qrScannerModal.style.display = "block";
    try {
      await this.appState.qrScanner.initialize((qrCode) => this.handleQrCodeScan(qrCode));
    } catch (error) {
      alert(error.message);
      if (this.qrScannerModal) this.qrScannerModal.style.display = "none";
    }
  }

  async closeScanner() {
    await this.appState.qrScanner.stop();
    if (this.qrScannerModal) this.qrScannerModal.style.display = "none";
  }

  async reopenScanner() {
    const reader = document.querySelector(SELECTORS.reader);
    if (reader) reader.style.display = "block";
    if (this.qrScannerModal) this.qrScannerModal.style.display = "block";
    try {
      NotificationManager.showLoading('Initializing QR Scanner...');
      await this.appState.qrScanner.initialize((qrCode) => this.handleQrCodeScan(qrCode));
      NotificationManager.hideLoading();
      NotificationManager.show('QR Scanner ready', 'success');
    } catch (error) {
      NotificationManager.hideLoading();
      NotificationManager.show('Error: ' + error.message, 'error');
      if (this.qrScannerModal) this.qrScannerModal.style.display = "none";
    }
  }

  handleQrCodeScan(qrCodeMessage) {
    this.searchManager.setSearchTerm(qrCodeMessage);
    
    this.appState.qrScanner.stop().then(() => {
      if (this.qrScannerModal) this.qrScannerModal.style.display = "none";
      
      const scannedData = this.appState.fileHandler.findItemByQRCode(qrCodeMessage);
      if (scannedData) {
        this.tableManager.displayData(this.appState.fileHandler.getData());
        this.searchManager.setSearchTerm(qrCodeMessage);
        if (this.appState.modalHandler) {
          NotificationManager.show('Item found and opened for editing', 'success');
          this.appState.modalHandler.show(scannedData);
        }
      } else {
        NotificationManager.show('QR code not found in inventory', 'error');
        this.searchManager.clearSearch();
      }
    });
  }
}

// File handling
class FileManager {
  constructor(appState, tableManager) {
    this.appState = appState;
    this.tableManager = tableManager;
  }

  initialize() {
    const uploadBtn = document.querySelector(SELECTORS.uploadButton);
    const downloadBtn = document.querySelector(SELECTORS.downloadJsonButton);
    const fileInput = document.querySelector(SELECTORS.jsonFileInput);

    addClickListener(uploadBtn, () => fileInput?.click());

    if (fileInput) {
      fileInput.addEventListener("change", (event) => this.handleFileUpload(event));
    }

    addClickListener(downloadBtn, () => this.downloadData());
  }

  async handleFileUpload(event) {
    try {
      NotificationManager.showLoading('Loading file...');
      const data = await this.appState.fileHandler.handleFileUpload(event.target.files[0]);
      this.tableManager.displayData(data);
      const jsonOutput = document.querySelector(SELECTORS.jsonOutput);
      if (jsonOutput) jsonOutput.style.display = "none";
      NotificationManager.hideLoading();
      NotificationManager.show(`Successfully loaded ${data.length} items`, 'success');
    } catch (error) {
      NotificationManager.hideLoading();
      NotificationManager.show('Error: ' + error.message, 'error');
      const jsonOutput = document.querySelector(SELECTORS.jsonOutput);
      if (jsonOutput) jsonOutput.textContent = error.message;
    }
  }

  downloadData() {
    this.appState.fileHandler.downloadCurrentData('edited.json');
  }
}

// Settings modal management
class SettingsModalManager {
  constructor(appState, tableManager) {
    this.appState = appState;
    this.tableManager = tableManager;
    this.settingsManager = new SettingsManager(appState);
    this.settingsModal = document.querySelector(SELECTORS.settingsModal);
  }

  initialize() {
    const settingsBtn = document.querySelector(SELECTORS.settingsButton);
    const saveBtn = document.querySelector(SELECTORS.saveSettings);
    const closeBtn = this.settingsModal?.querySelector(".close");

    addClickListener(settingsBtn, () => this.openModal());
    addClickListener(closeBtn, () => this.closeModal());
    addClickListener(saveBtn, () => this.saveSettings());
  }

  openModal() {
    if (this.settingsModal) this.settingsModal.style.display = "block";
  }

  closeModal() {
    if (this.settingsModal) this.settingsModal.style.display = "none";
  }

  saveSettings() {
    this.settingsManager.save();
    this.closeModal();
    
    // Refresh table with new settings
    const cachedData = this.appState.fileHandler.loadCachedData();
    if (cachedData && cachedData.data) {
      this.tableManager.displayData(cachedData.data);
    }
  }
}

// Dropdown management
class DropdownManager {
  static initialize() {
    window.toggleDropdown = function() {
      const dropdown = document.querySelector(SELECTORS.myDropdown);
      if (dropdown) dropdown.classList.toggle("show");
    };

    window.onclick = function(event) {
      if (!event.target.matches(".dropbtn")) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let dropdown of dropdowns) {
          if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
          }
        }
      }
    };
  }
}

// Main application class
class InventoryApp {
  constructor() {
    this.appState = new AppState();
    this.tableManager = new TableManager(this.appState);
    this.searchManager = new SearchManager(this.appState, this.tableManager);
    this.qrScannerManager = new QRScannerManager(this.appState, this.tableManager, this.searchManager);
    this.fileManager = new FileManager(this.appState, this.tableManager);
    this.settingsModalManager = new SettingsModalManager(this.appState, this.tableManager);
  }

  async initialize() {
    // Check for required dependencies
    if (!Html5Qrcode) {
      console.error("Html5Qrcode is not loaded");
      return;
    }

    // Initialize managers
    this.settingsModalManager.settingsManager.initialize();
    this.searchManager.initialize();
    this.qrScannerManager.initialize();
    this.fileManager.initialize();
    this.settingsModalManager.initialize();
    DropdownManager.initialize();

    // Initialize modal handler
    this.appState.modalHandler = new ModalHandler(
      'modal',
      'editForm',
      '.modal-close',
      'saveChangesButton',
      (formData) => this.handleFormSubmit(formData),
      COLUMN_DISPLAY_NAMES
    );

    // Load and display cached data
    const cachedData = this.appState.fileHandler.loadCachedData();
    if (cachedData && cachedData.data) {
      this.tableManager.displayData(cachedData.data);
    }
  }

  handleFormSubmit(formData) {
    const qrCode = formData.get('qr_code');
    console.log("=== SAVE FORM SUBMIT ===");
    console.log("QR Code from form:", qrCode);
    console.log("FormData entries:", Array.from(formData.keys()));
    console.log("Current inventory data length:", this.appState.fileHandler.getData().length);
    
    if (!qrCode) {
      console.error("❌ ERROR: QR Code not in form data!");
      alert("Error: Missing QR code in form");
      return;
    }
    
    const item = this.appState.fileHandler.findItemByQRCode(qrCode);
    console.log("Found item:", item);
    console.log("Item is in array:", item ? this.appState.fileHandler.getData().includes(item) : false);
    
    if (item) {
      // Validate form data before applying changes
      const validation = this.validateFormData(formData);
      if (!validation.valid) {
        alert('Validation Error: ' + validation.errors.join('\n'));
        return;
      }

      console.log("Validation passed, updating item...");
      const oldItem = JSON.stringify(item); // Save original for comparison
      
      for (const [key, value] of formData.entries()) {
        if (key === 'qr_code') continue; // Skip qr_code, don't modify it
        const parsedValue = this.parseFormValue(key, value, item[key]);
        console.log(`  ${key}: "${item[key]}" → "${parsedValue}"`);
        item[key] = parsedValue;
      }
      
      console.log("Item after update:", item);
      console.log("Item changed:", oldItem !== JSON.stringify(item));
      
      this.appState.fileHandler.saveToCache();
      console.log("Data saved to localStorage");
      this.tableManager.displayData(this.appState.fileHandler.getData());
    } else {
      console.error("❌ ERROR: Item not found with QR Code:", qrCode);
    }
  }

  validateFormData(formData) {
    const errors = [];
    
    for (const [key, value] of formData.entries()) {
      // Validate stock fields are non-negative
      if (key === 'current_stock' || key === 'expected_stock') {
        const numValue = parseInt(value);
        if (isNaN(numValue)) {
          errors.push(`${key} must be a number`);
        } else if (numValue < 0) {
          errors.push(`${key} cannot be negative`);
        }
      }
      
      // Validate date fields are valid dates
      if (key.includes('date') || key.includes('timestamp')) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${key} must be a valid date`);
        }
      }
      
      // Validate required fields
      if (!value || value.trim() === '') {
        if (['qr_code', 'item_name', 'location'].includes(key)) {
          errors.push(`${key} is required`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  parseFormValue(key, value, originalValue) {
    if (key.includes('date') || key.includes('timestamp')) {
      return new Date(value).toISOString();
    } else if (typeof originalValue === 'number') {
      return Math.max(0, parseInt(value)); // Ensure non-negative
    } else {
      return value;
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new InventoryApp();
    app.initialize();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Display user-friendly error message
    const errorContainer = document.getElementById('appContainer') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;';
    errorDiv.innerHTML = '<strong>Error:</strong> Failed to initialize application. Please refresh the page. If the problem persists, clear your browser cache.';
    errorContainer.prepend(errorDiv);
  }
});
