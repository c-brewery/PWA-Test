export function handleFileUpload(event, inventoryData, lastLoadedFileKey, cachedDataKey) {
  const file = event.target.files[0];
  if (file) {
    localStorage.setItem(lastLoadedFileKey, file.name);
    const reader = new FileReader();
    reader.onload = function(e) {
      const jsonContent = e.target.result;
      try {
        inventoryData = JSON.parse(jsonContent).inventory;
        localStorage.setItem(cachedDataKey, JSON.stringify(inventoryData));
        document.getElementById('jsonOutput').textContent = JSON.stringify(inventoryData, null, 2);
      } catch (error) {
        document.getElementById('jsonOutput').textContent = 'Invalid JSON file';
      }
    };
    reader.readAsText(file);
  }
}

export function loadCachedData(inventoryData, lastLoadedFileKey, cachedDataKey) {
  const lastLoadedFile = localStorage.getItem(lastLoadedFileKey);
  const cachedData = localStorage.getItem(cachedDataKey);
  if (lastLoadedFile && cachedData) {
    inventoryData = JSON.parse(cachedData);
    document.getElementById('jsonOutput').textContent = `Last loaded file: ${lastLoadedFile}\n${JSON.stringify(inventoryData, null, 2)}`;
  }
}