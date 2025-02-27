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
    this.closeButton.onclick = () => this.hide();
    window.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    if (this.saveButton && this.onSave) {
      this.saveButton.onclick = () => {
        const formData = new FormData(this.form);
        this.onSave(formData);
        this.hide();
      };
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
      const inputContainer = this.createInputContainer(key, value);
      this.form.appendChild(inputContainer);
    }
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
    } else {
      input.type = typeof value === 'number' ? 'number' : 'text';
      input.value = value;
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
    button.onclick = onClick;
    return button;
  }
}