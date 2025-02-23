export function showModal(data, inventoryData, cachedDataKey) {
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
      input.value = isNaN(dateValue.getTime()) || key === 'last_updated' ? new Date().toISOString().slice(0, 16) : dateValue.toISOString().slice(0, 16);
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
      increaseButton.textContent = '+';
      increaseButton.style.width = '25%';
      increaseButton.style.height = '30px';
      increaseButton.style.marginLeft = '5px';
      increaseButton.onclick = () => {
        input.value = parseInt(input.value) + 1;
      };
      inputContainer.appendChild(increaseButton);

      const decreaseButton = document.createElement('button');
      decreaseButton.type = 'button';
      decreaseButton.textContent = '-';
      decreaseButton.style.width = '25%';
      decreaseButton.style.height = '30px';
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
    document.getElementById('jsonOutput').textContent = JSON.stringify(inventoryData, null, 2);
    modal.style.display = 'none';
  };

  modal.style.display = 'block';
}