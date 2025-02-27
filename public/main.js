function toggleNavbar() {
    var x = document.getElementById("myLinks");
    if (x.style.display === "block") {
      x.style.display = "none";
    } else {
      x.style.display = "block";
    }
  }

function onScanSuccess(decodedText, decodedResult) {
    // Handle the result here.
    console.log(`Code matched = ${decodedText}`, decodedResult);
}

function onScanFailure(error) {
    // Handle scan failure, usually better to ignore and keep scanning.
    console.warn(`Code scan error = ${error}`);
}

let html5QrcodeScanner = null;

document.getElementById('openQrScanner').addEventListener('click', () => {
    const modal = document.getElementById('qrScannerModal');
    modal.style.display = 'block';
    
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
            fps: 10,
            qrbox: {width: 250, height: 250},
        });
        
        html5QrcodeScanner.render((decodedText, decodedResult) => {
            // Handle the scanned code here
            processQrCode(decodedText);
            // Close scanner and modal after successful scan
            html5QrcodeScanner.clear();
            modal.style.display = 'none';
        });
    }
});

document.getElementById('closeQrScanner').addEventListener('click', () => {
    const modal = document.getElementById('qrScannerModal');
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
    }
    modal.style.display = 'none';
});

// Close modal if clicked outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('qrScannerModal');
    if (event.target === modal) {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
        }
        modal.style.display = 'none';
    }
});

function processQrCode(decodedText) {
    // Your existing QR code processing logic here
    document.getElementById('qrCodeResult').textContent = `Scanned QR Code: ${decodedText}`;
    // Add to table or perform other operations
}
