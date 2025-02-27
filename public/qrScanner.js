export class QRScanner {
  constructor() {
    this.scanner = null;
  }

  async initialize(onSuccess) {
    if (!this.scanner) {
      this.scanner = new Html5Qrcode("reader");
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
    };

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No cameras found on the device!");
      }

      // Try rear camera first
      try {
        await this.scanner.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          this.handleError
        );
      } catch {
        // If rear camera fails, try front camera
        await this.scanner.start(
          { facingMode: "user" },
          config,
          onSuccess,
          this.handleError
        );
      }
    } catch (err) {
      console.error("Error initializing scanner:", err);
      throw err;
    }
  }

  handleError(errorMessage) {
    if (!errorMessage.includes("QR code no longer in front of camera")) {
      console.log(errorMessage);
    }
  }

  async stop() {
    if (this.scanner) {
      try {
        await this.scanner.stop();
        this.scanner = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
        this.scanner = null;
      }
    }
  }
}