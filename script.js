document.getElementById('uploadButton').addEventListener('click', () => {
  document.getElementById('jsonFileInput').click();
});

document.getElementById('jsonFileInput').addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const jsonContent = e.target.result;
      try {
        const jsonObject = JSON.parse(jsonContent);
        document.getElementById('jsonOutput').textContent = JSON.stringify(jsonObject, null, 2);
      } catch (error) {
        document.getElementById('jsonOutput').textContent = 'Invalid JSON file';
      }
    };
    reader.readAsText(file);
  }
});
