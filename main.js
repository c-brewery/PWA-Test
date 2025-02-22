function onScanSuccess(decodedText, decodedResult) {
    // Handle the result here.
    console.log(`Code matched = ${decodedText}`, decodedResult);
}

function onScanFailure(error) {
    // Handle scan failure, usually better to ignore and keep scanning.
    console.warn(`Code scan error = ${error}`);
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 10, qrbox: 250 });

html5QrcodeScanner.render(onScanSuccess, onScanFailure);
