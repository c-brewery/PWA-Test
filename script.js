import { Html5Qrcode } from "./node_modules/html5-qrcode/html5-qrcode.min.js";

document.addEventListener('DOMContentLoaded', () => {
  if (!Html5Qrcode) {
    console.error('Html5Qrcode is not loaded');
    return;
  }

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

  document.getElementById('startQrScannerButton').addEventListener('click', () => {
    const qrScanner = new Html5Qrcode("qrScanner");
    qrScanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      qrCodeMessage => {
        document.getElementById('qrCodeResult').textContent = qrCodeMessage;
        qrScanner.stop().then(() => {
          console.log("QR Code scanning stopped.");
        }).catch(err => {
          console.error("Failed to stop scanning.", err);
        });
      },
      errorMessage => {
        console.log(`QR Code no longer in front of camera. Error: ${errorMessage}`);
      }
    ).catch(err => {
      console.error(`Unable to start scanning, error: ${err}`);
    });
  });
});
