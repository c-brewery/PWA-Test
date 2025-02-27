import { QRScanner } from "./qrScanner.js";
import { FileHandler } from "./fileHandler.js";
import { ModalHandler } from "./modalHandler.js";

document.addEventListener("DOMContentLoaded", () => {
  if (!Html5Qrcode) {
    console.error("Html5Qrcode is not loaded");
    return;
  }

  const fileHandler = new FileHandler();
  const qrScanner = new QRScanner();
  
  // Initialize UI elements
  const uploadButton = document.getElementById("uploadButton");
  const downloadJsonButton = document.getElementById("downloadJsonButton");
  const jsonFileInput = document.getElementById("jsonFileInput");
  const qrScannerModal = document.getElementById("qrScannerModal");
  const openQrScannerBtn = document.getElementById("openQrScanner");
  const closeQrScannerBtn = document.getElementById("closeQrScanner");
  const reopenScannerButton = document.getElementById("reopenScannerButton");

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
    document.getElementById("qrCodeResult").textContent = qrCodeMessage;
    qrScanner.stop().then(() => {
      qrScannerModal.style.display = "none";
      const scannedData = fileHandler.findItemByQRCode(qrCodeMessage);
      if (scannedData) {
        displayJsonData(fileHandler.getData(), qrCodeMessage);
        modalHandler.show(scannedData);
      } else {
        alert("QR code not found in inventory");
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

  // Load cached data if available
  const cachedData = fileHandler.loadCachedData();
  if (cachedData) {
    displayJsonData(cachedData.data);
    document.getElementById("jsonOutput").style.display = "none";
  }
});

function displayJsonData(jsonData, highlightQrCode = null) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

  dataArray.forEach((item) => {
    const row = document.createElement("tr");
    if (highlightQrCode && item.qr_code === highlightQrCode) {
      row.classList.add("scanned-row");
    }
    row.innerHTML = `
      <td>${item.qr_code || ""}</td>
      <td>${item.name || ""}</td>
      <td>${item.location || ""}</td>
    `;
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
