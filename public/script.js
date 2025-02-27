import { startQrScanner } from './qrScanner.js';
import { handleFileUpload, loadCachedData } from './fileHandler.js';
import { showModal } from './modalHandler.js';



document.addEventListener('DOMContentLoaded', () => {
  if (!Html5Qrcode) {
    console.error('Html5Qrcode is not loaded');
    return;
  }

  let inventoryData = [];
  const lastLoadedFileKey = 'lastLoadedFile';
  const cachedDataKey = 'cachedInventoryData';

  const uploadButton = document.getElementById('uploadButton');
  const downloadJsonButton = document.getElementById('downloadJsonButton');
  const jsonFileInput = document.getElementById('jsonFileInput');

  uploadButton.addEventListener('click', () => {
    jsonFileInput.click();
  });

  jsonFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonContent = e.target.result;
        try {
          inventoryData = JSON.parse(jsonContent).inventory;
          localStorage.setItem(cachedDataKey, JSON.stringify(inventoryData));
          displayJsonData(inventoryData);
          document.getElementById('jsonOutput').style.display = 'none';
        } catch (error) {
          document.getElementById('jsonOutput').textContent = 'Invalid JSON file';
        }
      };
      reader.readAsText(file);
    }
  });

  const lastLoadedFile = localStorage.getItem(lastLoadedFileKey);
  const cachedData = localStorage.getItem(cachedDataKey);
  if (lastLoadedFile && cachedData) {
    inventoryData = JSON.parse(cachedData);
    displayJsonData(inventoryData);
    document.getElementById('jsonOutput').style.display = 'none';
  }

  const reopenScannerButton = document.getElementById('reopenScannerButton');

  const qrScanner = new Html5Qrcode("reader");

  // QR Scanner Modal Elements
  const qrScannerModal = document.getElementById('qrScannerModal');
  const openQrScannerBtn = document.getElementById('openQrScanner');
  const closeQrScannerBtn = document.getElementById('closeQrScanner');

  function startQrScanner() {
    qrScannerModal.style.display = 'block';
    qrScanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      qrCodeMessage => {
        document.getElementById('qrCodeResult').textContent = qrCodeMessage;
        stopQrScanner();
        const scannedData = inventoryData.find(item => item.qr_code === qrCodeMessage);
        if (scannedData) {
          showModal(scannedData);
        } else {
          alert('QR code not found in inventory');
        }
      },
      errorMessage => {
        console.log(`QR Code no longer in front of camera. Error: ${errorMessage}`);
      }
    ).catch(err => {
      console.error(`Unable to start scanning, error: ${err}`);
    });
  }

  function stopQrScanner() {
    qrScanner.stop().then(() => {
      console.log("QR Code scanning stopped.");
      qrScannerModal.style.display = 'none';
    }).catch(err => {
      console.error("Failed to stop scanning.", err);
    });
  }

  // Event Listeners für QR Scanner
  openQrScannerBtn.addEventListener('click', startQrScanner);
  closeQrScannerBtn.addEventListener('click', stopQrScanner);

  // Schließe Scanner auch wenn außerhalb des Modals geklickt wird
  window.addEventListener('click', (event) => {
    if (event.target === qrScannerModal) {
      stopQrScanner();
    }
  });

  reopenScannerButton.addEventListener('click', () => {
    document.getElementById('reader').style.display = 'block'; // Show the camera image
    startQrScanner();
  });

  downloadJsonButton.addEventListener('click', () => {
    const jsonContent = document.getElementById('jsonOutput').textContent;
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  function showModal(data) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('editForm');
    form.innerHTML = '';

    for (const key in data) {
      const value = data[key];
      const input = document.createElement('input');
      input.type = key.includes('date') || key.includes('timestamp') ? 'datetime-local' : (typeof value === 'number' ? 'number' : 'text');
      input.name = key;
      if (key.includes('date') || key.includes('timestamp')) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime()) || key === 'last_updated') {
          input.value = new Date().toISOString().slice(0, 16);
        } else {
          input.value = dateValue.toISOString().slice(0, 16);
        }
      } else {
        input.value = value;
      }
      input.disabled = ['qr_code', 'last_updated', 'expected_stock'].includes(key);
      const label = document.createElement('label');
      label.textContent = key;
      form.appendChild(label);

      const inputContainer = document.createElement('div');
      inputContainer.className = 'input-container';
      inputContainer.style.display = 'flex';
      inputContainer.style.alignItems = 'center';
      inputContainer.appendChild(input);
      input.style.flex = '1';

      if (key === 'current_stock') {
        const increaseButton = document.createElement('button');
        increaseButton.type = 'button';
        increaseButton.textContent = ' + ';
        increaseButton.style.width = '25%';
        increaseButton.style.marginLeft = '5px';
        increaseButton.onclick = () => {
          input.value = parseInt(input.value) + 1;
        };
        inputContainer.appendChild(increaseButton);

        const decreaseButton = document.createElement('button');
        decreaseButton.type = 'button';
        decreaseButton.textContent = ' - ';
        decreaseButton.style.width = '25%';
        decreaseButton.style.marginLeft = '5px';
        decreaseButton.onclick = () => {
          input.value = parseInt(input.value) - 1;
        };
        inputContainer.appendChild(decreaseButton);
      }

      form.appendChild(inputContainer);
    }

    const closeButton = document.querySelector('.close');
    closeButton.onclick = () => {
      modal.style.display = 'none';
    };

    window.onclick = event => {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };

    document.getElementById('saveChangesButton').onclick = () => {
      const formData = new FormData(form);
      for (const [key, value] of formData.entries()) {
        data[key] = key.includes('date') || key.includes('timestamp') ? new Date(value).toISOString() : (typeof data[key] === 'number' ? parseInt(value) : value);
      }
      localStorage.setItem(cachedDataKey, JSON.stringify(inventoryData));
      displayJsonData(inventoryData);
      document.getElementById('jsonOutput').style.display = 'none';
      modal.style.display = 'none';
    };

    modal.style.display = 'block';
  }

  // Rearrange elements
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'buttonContainer';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.appendChild(document.getElementById('uploadButton'));
  buttonContainer.appendChild(document.getElementById('downloadJsonButton'));

  const readerContainer = document.createElement('div');
  readerContainer.id = 'readerContainer';
  readerContainer.appendChild(document.getElementById('reader'));

  const qrCodeResultContainer = document.createElement('div');
  qrCodeResultContainer.id = 'qrCodeResultContainer';
  qrCodeResultContainer.appendChild(document.getElementById('qrCodeResult'));
  qrCodeResultContainer.appendChild(document.getElementById('jsonOutput'));

  document.body.insertBefore(buttonContainer, document.body.firstChild);
  document.body.appendChild(readerContainer);
  document.body.appendChild(qrCodeResultContainer);
});

function toggleDropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function displayJsonData(jsonData) {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';
  
  // Konvertiere JSON-Objekt in Array, falls es noch keins ist
  const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
  
  dataArray.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.qr_code || ''}</td>
      <td>${item.name || ''}</td>
      <td>${item.location || ''}</td>
    `;
    // Füge Click-Event und Cursor-Style hinzu
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const scannedData = dataArray.find(data => data.qr_code === item.qr_code);
      if (scannedData) {
        showModal(scannedData);
      }
    });
    tableBody.appendChild(row);
  });
}

// Sortierfunktion für die Tabelle
function setupTableSorting() {
  const table = document.querySelector('.sortable-table');
  const headers = table.querySelectorAll('th');
  let currentSort = { column: '', ascending: true };

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      const ascending = currentSort.column === column ? !currentSort.ascending : true;
      
      // Sortiere die Tabellenzeilen
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.sort((a, b) => {
        const aValue = a.children[Array.from(headers).indexOf(header)].textContent;
        const bValue = b.children[Array.from(headers).indexOf(header)].textContent;
        return ascending ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      });
      
      // Aktualisiere die Sortierrichtung
      currentSort = { column, ascending };
      
      // Aktualisiere die Tabellenansicht
      const tbody = table.querySelector('tbody');
      rows.forEach(row => tbody.appendChild(row));
      
      // Aktualisiere die Sortierpfeile
      headers.forEach(h => {
        const arrow = h.querySelector('.sort-icon');
        if (h === header) {
          arrow.textContent = ascending ? '↓' : '↑';
        } else {
          arrow.textContent = '↕';
        }
      });
    });
  });
}

// Initialisiere die Tabellensortierung nach dem Laden der Seite
document.addEventListener('DOMContentLoaded', setupTableSorting);
