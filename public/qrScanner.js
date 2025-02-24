export function startQrScanner(inventoryData, showModal) {
  const qrScanner = new Html5Qrcode("reader");
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
        document.getElementById('reader').style.display = 'none';
        const scannedData = inventoryData.find(item => item.qr_code === qrCodeMessage);
        if (scannedData) {
          showModal(scannedData);
        } else {
          alert('QR code not found in inventory');
        }
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
}