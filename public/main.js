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

document.getElementById('openQrScanner').addEventListener('click', async () => {
    const modal = document.getElementById('qrScannerModal');
    modal.style.display = 'block';
    
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("reader");
        
        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                const config = {
                    fps: 10,
                    qrbox: {width: 250, height: 250},
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                };

                await html5QrcodeScanner.start(
                    { facingMode: "environment" }, // Try rear camera first
                    config,
                    (decodedText) => {
                        // Success callback
                        processQrCode(decodedText);
                        html5QrcodeScanner.stop().then(() => {
                            html5QrcodeScanner = null;
                            modal.style.display = 'none';
                        });
                    },
                    (errorMessage) => {
                        // Error callback
                        console.log(errorMessage);
                    }
                ).catch((err) => {
                    // If rear camera fails, try front camera
                    html5QrcodeScanner.start(
                        { facingMode: "user" },
                        config,
                        (decodedText) => {
                            processQrCode(decodedText);
                            html5QrcodeScanner.stop().then(() => {
                                html5QrcodeScanner = null;
                                modal.style.display = 'none';
                            });
                        },
                        (errorMessage) => {
                            console.log(errorMessage);
                        }
                    );
                });
            } else {
                alert("No cameras found on the device!");
            }
        } catch (err) {
            console.error("Error initializing scanner:", err);
            alert("Error accessing camera: " + err.message);
            modal.style.display = 'none';
        }
    }
});

document.getElementById('closeQrScanner').addEventListener('click', () => {
    const modal = document.getElementById('qrScannerModal');
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner = null;
            modal.style.display = 'none';
        }).catch(err => {
            console.error("Error stopping scanner:", err);
            html5QrcodeScanner = null;
            modal.style.display = 'none';
        });
    } else {
        modal.style.display = 'none';
    }
});

// Close modal if clicked outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('qrScannerModal');
    if (event.target === modal) {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                html5QrcodeScanner = null;
                modal.style.display = 'none';
            }).catch(err => {
                console.error("Error stopping scanner:", err);
                html5QrcodeScanner = null;
                modal.style.display = 'none';
            });
        } else {
            modal.style.display = 'none';
        }
    }
});

function processQrCode(decodedText) {
    // Your existing QR code processing logic here
    document.getElementById('qrCodeResult').textContent = `Scanned QR Code: ${decodedText}`;
    // Add to table or perform other operations
}
