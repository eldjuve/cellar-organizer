import React, { useEffect, useRef, useState } from "react";
import type { WineItem } from "types";

export function BarcodeScanner({
  onResult,
  onClose,
}: {
  onResult: (wine: WineItem | null) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const fetchingRef = useRef(false);
  const lastCodeRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (typeof BarcodeDetector === "undefined") {
      setError("BarcodeDetector is not supported in this browser. Try Chrome or Safari on iOS 17+.");
      return;
    }

    let stream: MediaStream | null = null;

    const detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    const scan = async () => {
      const video = videoRef.current;
      if (!video || fetchingRef.current) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      try {
        const results = await detector.detect(video);
        if (results.length > 0) {
          const code = results[0].rawValue;
          if (code === lastCodeRef.current) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }
          lastCodeRef.current = code;
          fetchingRef.current = true;
          setNotFound(false);
          try {
            const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
            const { wine } = (await res.json()) as { wine: WineItem | null };
            if (wine) {
              onResult(wine);
              return; // don't restart scanning
            } else {
              setNotFound(true);
            }
          } catch {
            setError("Failed to look up barcode.");
            return;
          } finally {
            fetchingRef.current = false;
          }
        }
      } catch {
        // detection error — keep scanning
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.onloadedmetadata = () => {
            video.play();
            rafRef.current = requestAnimationFrame(scan);
          };
        }
      })
      .catch(() => {
        setError("Could not access camera. Please allow camera permissions.");
      });

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white text-sm font-medium">Scan barcode</span>
        <button
          onClick={onClose}
          className="text-white text-2xl leading-none px-2"
          aria-label="Close scanner"
        >
          ×
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-white text-center text-sm">{error}</p>
        </div>
      ) : (
        <div className="relative flex-1">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-64 h-32 border-2 border-white/60 rounded-lg" />
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Scan barcode</span>
            </div>
          </div>
          {notFound && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-lg text-center">
              No wine found for this barcode
            </div>
          )}
        </div>
      )}
    </div>
  );
}
