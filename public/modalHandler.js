export class ModalHandler {
  constructor(modalId, formId, closeButtonSelector, saveButtonId, onSave) {
    this.modal = document.getElementById(modalId);
    this.form = document.getElementById(formId);
    this.closeButton = this.modal.querySelector(closeButtonSelector);
    this.saveButton = document.getElementById(saveButtonId);
    this.onSave = onSave;

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

    if (this.saveButton && this.onSave) {
      addEventListeners(this.saveButton, () => {
        const formData = new FormData(this.form);
        this.onSave(formData);
        this.hide();
      });
    }
  }

  show(data) {
    this.form.innerHTML = '';
    this.populateForm(data);
    this.modal.style.display = 'block';
  }

  hide() {
    this.modal.style.display = 'none';
  }

  populateForm(data) {
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key to prevent XSS
      if (!this.isSafeKey(key)) {
        console.warn(`Skipping unsafe key: ${key}`);
        continue;
      }
      const inputContainer = this.createInputContainer(key, value);
      this.form.appendChild(inputContainer);
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
    label.textContent = key;
    container.appendChild(label);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    inputWrapper.style.display = 'flex';
    inputWrapper.style.alignItems = 'center';

    const input = this.createInput(key, value);
    inputWrapper.appendChild(input);

    if (key === 'current_stock') {
      inputWrapper.appendChild(this.createStockButton('+', () => input.value = parseInt(input.value) + 1));
      inputWrapper.appendChild(this.createStockButton('-', () => input.value = parseInt(input.value) - 1));
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
      input.value = isNaN(dateValue.getTime()) || key === 'last_updated' 
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

    input.disabled = ['qr_code', 'last_updated', 'expected_stock'].includes(key);
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