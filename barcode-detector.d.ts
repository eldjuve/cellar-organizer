// Type declarations for the WICG Shape Detection API — BarcodeDetector.
// Not yet part of the TypeScript standard DOM lib.
// Spec: https://wicg.github.io/shape-detection-api/#barcode-detection-api

type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e"
  | "unknown";

interface BarcodeDetectorOptions {
  formats?: BarcodeFormat[];
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
  format: BarcodeFormat;
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  detect(image: ImageBitmapSource | HTMLVideoElement): Promise<DetectedBarcode[]>;
  static getSupportedFormats(): Promise<BarcodeFormat[]>;
}
