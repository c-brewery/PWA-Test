export class ModalHandler {
  constructor(modalId, formId, closeButtonSelector, saveButtonId, onSave, columnDisplayNames = {}) {
    this.modal = document.getElementById(modalId);
    this.form = document.getElementById(formId);
    this.closeButton = this.modal.querySelector(closeButtonSelector);
    this.saveIcon = document.getElementById('saveIcon');
    this.closeIcon = document.getElementById('closeIcon');
    this.modalTitle = document.getElementById('modalTitle');
    this.onSave = onSave;
    this.columnDisplayNames = columnDisplayNames;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Helper function for cross-browser click/touch support
    const addEventListeners = (element, callback) => {
      if (!element) return;
      element.addEventListener('click', callback);
      element.addEventListener('touchend', callback);
    };

    addEventListeners(this.closeButton, () => this.hide());
    addEventListeners(this.closeIcon, () => this.hide());

    window.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    window.addEventListener('touchend', (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    if (this.saveIcon && this.onSave) {
      addEventListeners(this.saveIcon, () => {
        const formData = new FormData(this.form);
        this.onSave(formData);
        this.hide();
      });
    }
  }

  show(data) {
    this.form.innerHTML = '';
    this.currentData = data;

    // Set the modal title to show the item name
    if (data.name && this.modalTitle) {
      this.modalTitle.textContent = `${data.name} bearbeiten`;
    }

    // Add hidden field for QR code so it's included in FormData
    if (data.qr_code) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'qr_code';
      hiddenInput.value = data.qr_code;
      this.form.appendChild(hiddenInput);
    }

    this.populateForm(data);
    this.modal.style.display = 'block';
  }

  hide() {
    this.modal.style.display = 'none';
  }

  populateForm(data) {
    // Define which fields should be paired side-by-side
    const fieldPairs = [
      ['category', 'location'],  // Kategorie and Standort side-by-side
      ['expected_stock', 'current_stock'],  // Erwarteter Bestand and Aktueller Bestand side-by-side
    ];
    
    const pairedFields = new Set();
    fieldPairs.forEach(pair => pair.forEach(field => pairedFields.add(field)));

    // Track processed fields
    const processedFields = new Set(['qr_code']); // qr_code is added as hidden field

    // First, create paired fields
    fieldPairs.forEach(([field1, field2]) => {
      const value1 = data[field1];
      const value2 = data[field2];
      
      if (value1 !== undefined || value2 !== undefined) {
        const pairContainer = document.createElement('div');
        pairContainer.className = 'input-row-pair';
        
        if (value1 !== undefined && !processedFields.has(field1)) {
          const container1 = this.createInputContainer(field1, value1);
          container1.className = 'input-container input-container-half';
          pairContainer.appendChild(container1);
          processedFields.add(field1);
        } else if (value1 !== undefined) {
          const spacer = document.createElement('div');
          spacer.className = 'input-container input-container-half';
          pairContainer.appendChild(spacer);
        }
        
        if (value2 !== undefined && !processedFields.has(field2)) {
          const container2 = this.createInputContainer(field2, value2);
          container2.className = 'input-container input-container-half';
          pairContainer.appendChild(container2);
          processedFields.add(field2);
        }
        
        this.form.appendChild(pairContainer);
      }
    });

    // Then, create remaining single fields
    for (const [key, value] of Object.entries(data)) {
      if (!processedFields.has(key)) {
        if (!this.isSafeKey(key)) {
          console.warn(`Skipping unsafe key: ${key}`);
          continue;
        }
        const inputContainer = this.createInputContainer(key, value);
        this.form.appendChild(inputContainer);
        processedFields.add(key);
      }
    }
  }

  isSafeKey(key) {
    // Only allow alphanumeric, underscore, and dash characters
    return /^[a-zA-Z0-9_-]+$/.test(key);
  }

  sanitizeValue(value) {
    // If value is a string, escape HTML entities
    if (typeof value === 'string') {
      const div = document.createElement('div');
      div.textContent = value;
      return div.innerHTML;
    }
    return value;
  }

  createInputContainer(key, value) {
    const container = document.createElement('div');
    container.className = 'input-container';

    const label = document.createElement('label');
    const displayName = this.columnDisplayNames[key] || key;
    label.textContent = displayName;
    // Set title for truncated labels to show full text on hover
    if (displayName.length > 20) {
      label.title = displayName;
    }
    container.appendChild(label);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';

    const input = this.createInput(key, value);
    inputWrapper.appendChild(input);

    // For current_stock, add +/- buttons beside the input
    if (key === 'current_stock') {
      const stockControls = document.createElement('div');
      stockControls.className = 'stock-controls';
      
      stockControls.appendChild(this.createStockButton('-', () => {
        const currentVal = parseInt(input.value) || 0;
        input.value = Math.max(0, currentVal - 1);
      }));
      
      stockControls.appendChild(this.createStockButton('+', () => {
        const currentVal = parseInt(input.value) || 0;
        input.value = currentVal + 1;
      }));
      
      inputWrapper.appendChild(stockControls);
    }

    container.appendChild(inputWrapper);
    return container;
  }

  createInput(key, value) {
    const input = document.createElement('input');
    input.name = key;
    
    if (key.includes('date') || key.includes('timestamp')) {
      input.type = 'datetime-local';
      const dateValue = new Date(value);
      input.value = isNaN(dateValue.getTime())
        ? new Date().toISOString().slice(0, 16) 
        : dateValue.toISOString().slice(0, 16);
    } else if (key === 'current_stock' || key === 'expected_stock') {
      input.type = 'number';
      input.min = '0';
      input.value = Math.max(0, parseInt(value) || 0);
    } else {
      input.type = typeof value === 'number' ? 'number' : 'text';
      // Use textContent for safe value assignment
      if (typeof value === 'string') {
        input.value = this.sanitizeValue(value);
      } else {
        input.value = value;
      }
    }

    // Only disable expected_stock and qr_code; enable last_updated for editing
    input.disabled = ['qr_code', 'expected_stock'].includes(key);
    input.style.flex = '1';
    return input;
  }

  createStockButton(text, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.className = 'stock-button';
    
    // Add both click and touchend event listeners for Android compatibility
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    
    return button;
  }
}