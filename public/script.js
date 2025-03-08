import { QRScanner } from "./qrScanner.js";
import { FileHandler } from "./fileHandler.js";
import { ModalHandler } from "./modalHandler.js";

// Default settings
const defaultSettings = {
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

// Load settings from localStorage or use defaults
let appSettings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;

document.addEventListener("DOMContentLoaded", () => {
  if (!Html5Qrcode) {
    console.error("Html5Qrcode is not loaded");
    return;
  }

  const fileHandler = new FileHandler();
  const qrScanner = new QRScanner();
  
  // Load cached data immediately and display it
  const cachedData = fileHandler.loadCachedData();
  if (cachedData && cachedData.data) {
    displayJsonData(cachedData.data);
  }

  // Initialize UI elements
  const uploadButton = document.getElementById("uploadButton");
  const downloadJsonButton = document.getElementById("downloadJsonButton");
  const jsonFileInput = document.getElementById("jsonFileInput");
  const qrScannerModal = document.getElementById("qrScannerModal");
  const openQrScannerBtn = document.getElementById("openQrScanner");
  const closeQrScannerBtn = document.getElementById("closeQrScanner");
  const reopenScannerButton = document.getElementById("reopenScannerButton");
  const settingsButton = document.getElementById("settingsButton");
  const settingsModal = document.getElementById("settingsModal");
  const saveSettingsButton = document.getElementById("saveSettings");
  const searchInput = document.getElementById("qrCodeResult");
  const clearSearchButton = document.getElementById("clearSearch");

  // Initialize settings
  initializeSettings();

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(searchTerm);
    clearSearchButton.style.display = searchTerm ? "block" : "none";
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    filterTable("");
    clearSearchButton.style.display = "none";
  });

  // Settings event listeners
  settingsButton.addEventListener("click", () => {
    settingsModal.style.display = "block";
  });

  settingsModal.querySelector(".close").addEventListener("click", () => {
    settingsModal.style.display = "none";
  });

  saveSettingsButton.addEventListener("click", () => {
    saveSettings();
    settingsModal.style.display = "none";
    // Refresh table with new settings
    if (cachedData && cachedData.data) {
      displayJsonData(cachedData.data);
    }
  });

  // Initialize modal handler
  const modalHandler = new ModalHandler(
    'modal',
    'editForm',
    '.close',
    'saveChangesButton',
    (formData) => {
      const item = fileHandler.findItemByQRCode(formData.get('qr_code'));
      if (item) {
        for (const [key, value] of formData.entries()) {
          item[key] = key.includes('date') || key.includes('timestamp')
            ? new Date(value).toISOString()
            : typeof item[key] === 'number'
            ? parseInt(value)
            : value;
        }
        fileHandler.saveToCache();
        displayJsonData(fileHandler.getData());
      }
    }
  );

  // Event Listeners
  uploadButton.addEventListener("click", () => jsonFileInput.click());

  jsonFileInput.addEventListener("change", async (event) => {
    try {
      const data = await fileHandler.handleFileUpload(event.target.files[0]);
      displayJsonData(data);
      document.getElementById("jsonOutput").style.display = "none";
    } catch (error) {
      document.getElementById("jsonOutput").textContent = error.message;
    }
  });

  downloadJsonButton.addEventListener("click", () => {
    fileHandler.downloadCurrentData('edited.json');
  });

  const handleQrCodeScan = (qrCodeMessage) => {
    searchInput.value = qrCodeMessage;
    filterTable(qrCodeMessage);
    clearSearchButton.style.display = "block";
    
    qrScanner.stop().then(() => {
      qrScannerModal.style.display = "none";
      const scannedData = fileHandler.findItemByQRCode(qrCodeMessage);
      if (scannedData) {
        displayJsonData(fileHandler.getData());
        // Ensure the row is visible after redisplaying the data
        filterTable(qrCodeMessage);
        modalHandler.show(scannedData);
      } else {
        alert("QR code not found in inventory");
        // Clear the search if QR code wasn't found
        searchInput.value = "";
        filterTable("");
        clearSearchButton.style.display = "none";
      }
    });
  };

  openQrScannerBtn.addEventListener("click", async () => {
    qrScannerModal.style.display = "block";
    try {
      await qrScanner.initialize(handleQrCodeScan);
    } catch (error) {
      alert(error.message);
      qrScannerModal.style.display = "none";
    }
  });

  closeQrScannerBtn.addEventListener("click", () => {
    qrScanner.stop().then(() => {
      qrScannerModal.style.display = "none";
    });
  });

  reopenScannerButton.addEventListener("click", async () => {
    document.getElementById("reader").style.display = "block";
    qrScannerModal.style.display = "block";
    try {
      await qrScanner.initialize(handleQrCodeScan);
    } catch (error) {
      alert(error.message);
      qrScannerModal.style.display = "none";
    }
  });
});

function initializeSettings() {
  // Set checkboxes based on current settings
  for (const [key, value] of Object.entries(appSettings.columns)) {
    const checkbox = document.getElementById(`col_${key}`);
    if (checkbox) {
      checkbox.checked = value;
    }
  }

  document.getElementById('setting_highlight_discrepancies').checked = appSettings.highlight_discrepancies;
  document.getElementById('setting_show_timestamps').checked = appSettings.show_timestamps;
}

function saveSettings() {
  // Save column settings
  for (const [key] of Object.entries(appSettings.columns)) {
    const checkbox = document.getElementById(`col_${key}`);
    if (checkbox && !checkbox.disabled) {
      appSettings.columns[key] = checkbox.checked;
    }
  }

  // Save other settings
  appSettings.highlight_discrepancies = document.getElementById('setting_highlight_discrepancies').checked;
  appSettings.show_timestamps = document.getElementById('setting_show_timestamps').checked;

  // Save to localStorage
  localStorage.setItem('appSettings', JSON.stringify(appSettings));
}

function displayJsonData(jsonData, highlightQrCode = null) {
  const tableBody = document.getElementById("tableBody");
  const tableHead = document.querySelector(".sortable-table thead tr");
  tableBody.innerHTML = "";
  tableHead.innerHTML = "";

  const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

  // Update table headers based on visible columns
  for (const [key, visible] of Object.entries(appSettings.columns)) {
    if (visible) {
      const th = document.createElement("th");
      th.dataset.sort = key;
      const displayName = {
        qr_code: "QR Code",
        name: "Name",
        location: "Standort",
        description: "Beschreibung",
        category: "Kategorie",
        current_stock: "Aktueller Bestand",
        expected_stock: "Erwarteter Bestand",
        stock_last_updated: "Letzte Inventur"
      }[key];
      th.innerHTML = `${displayName} <span class="sort-icon">↕</span>`;
      tableHead.appendChild(th);
    }
  }

  dataArray.forEach((item) => {
    const row = document.createElement("tr");
    if (highlightQrCode && item.qr_code === highlightQrCode) {
      row.classList.add("scanned-row");
    }

    // Add stock discrepancy highlighting
    if (appSettings.highlight_discrepancies && 
        item.current_stock !== undefined && 
        item.expected_stock !== undefined && 
        item.current_stock !== item.expected_stock) {
      row.classList.add("stock-discrepancy");
    }

    // Check if stock_last_updated is valid
    const stockLastUpdated = new Date(item.stock_last_updated);
    const isValidStockUpdate = !isNaN(stockLastUpdated.getTime());

    // Build row content based on visible columns
    let rowHtml = '';
    for (const [key, visible] of Object.entries(appSettings.columns)) {
      if (visible) {
        if (key === 'qr_code') {
          rowHtml += `
            <td>
              ${isValidStockUpdate ? '<i class="fa fa-check-circle" style="color: #4CAF50; margin-right: 8px;"></i>' : ''}
              ${item[key] || ""}
            </td>`;
        } else if (key === 'stock_last_updated' && appSettings.show_timestamps) {
          const date = new Date(item[key]);
          rowHtml += `<td>${isValidStockUpdate ? date.toLocaleString() : ''}</td>`;
        } else {
          rowHtml += `<td>${item[key] || ""}</td>`;
        }
      }
    }
    row.innerHTML = rowHtml;

    row.style.cursor = "pointer";
    row.addEventListener("click", () => {
      const modalHandler = new ModalHandler(
        'modal',
        'editForm',
        '.close',
        'saveChangesButton',
        (formData) => {
          const updatedData = { ...item };
          for (const [key, value] of formData.entries()) {
            updatedData[key] = key.includes('date') || key.includes('timestamp')
              ? new Date(value).toISOString()
              : typeof item[key] === 'number'
              ? parseInt(value)
              : value;
          }
          Object.assign(item, updatedData);
          displayJsonData(dataArray);
        }
      );
      modalHandler.show(item);
    });
    tableBody.appendChild(row);
  });

  // Reinitialize table sorting
  setupTableSorting();
}

function toggleDropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

// Sortierfunktion für die Tabelle
function setupTableSorting() {
  const table = document.querySelector(".sortable-table");
  const headers = table.querySelectorAll("th");
  let currentSort = { column: "", ascending: true };

  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.dataset.sort;
      const ascending =
        currentSort.column === column ? !currentSort.ascending : true;

      // Sortiere die Tabellenzeilen
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      rows.sort((a, b) => {
        const aValue =
          a.children[Array.from(headers).indexOf(header)].textContent;
        const bValue =
          b.children[Array.from(headers).indexOf(header)].textContent;
        return ascending
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });

      // Aktualisiere die Sortierrichtung
      currentSort = { column, ascending };

      // Aktualisiere die Tabellenansicht
      const tbody = table.querySelector("tbody");
      rows.forEach((row) => tbody.appendChild(row));

      // Aktualisiere die Sortierpfeile
      headers.forEach((h) => {
        const arrow = h.querySelector(".sort-icon");
        if (h === header) {
          arrow.textContent = ascending ? "↓" : "↑";
        } else {
          arrow.textContent = "↕";
        }
      });
    });
  });
}

// Initialisiere die Tabellensortierung nach dem Laden der Seite
document.addEventListener("DOMContentLoaded", setupTableSorting);

function filterTable(searchTerm) {
  const rows = document.querySelectorAll("#tableBody tr");
  const visibleColumns = Object.entries(appSettings.columns)
    .filter(([_, visible]) => visible)
    .map(([key]) => key);

  let hasVisibleRows = false;

  rows.forEach(row => {
    const cells = Array.from(row.getElementsByTagName("td"));
    const textContent = cells
      .map((cell, index) => ({
        text: cell.textContent.trim().toLowerCase(),
        column: visibleColumns[index]
      }))
      .filter(({ column }) => ["qr_code", "name", "location"].includes(column))
      .map(({ text }) => text)
      .join(" ");

    if (textContent.includes(searchTerm.toLowerCase())) {
      row.classList.remove("row-hidden");
      hasVisibleRows = true;
    } else {
      row.classList.add("row-hidden");
    }
  });

  // If no rows are visible and we have a search term, show a message
  const noResultsMessage = document.getElementById("noResultsMessage") || createNoResultsMessage();
  if (!hasVisibleRows && searchTerm) {
    noResultsMessage.style.display = "block";
  } else {
    noResultsMessage.style.display = "none";
  }
}

function createNoResultsMessage() {
  const message = document.createElement("div");
  message.id = "noResultsMessage";
  message.style.textAlign = "center";
  message.style.padding = "20px";
  message.style.color = "#666";
  message.textContent = "Keine Ergebnisse gefunden";
  
  const table = document.querySelector(".sortable-table");
  table.parentNode.insertBefore(message, table.nextSibling);
  
  return message;
}
