import { useEffect, useRef, useState } from 'react';
import { Ic } from '../components/Icons';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];

// Minimal typing for the native Barcode Detection API (not in TS' DOM lib).
interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> }
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}
declare global {
  interface Window { BarcodeDetector?: BarcodeDetectorCtor }
}

// Default export so it can be React.lazy()-loaded — keeps the scanner (and the
// ZXing fallback) out of the main bundle until the user opens it.
export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const zxingStop = useRef<null | (() => void)>(null);
  const doneRef = useRef(false);
  const cbRef = useRef(onDetected);
  cbRef.current = onDetected;

  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [hit, setHit] = useState(false);
  const [slow, setSlow] = useState(false);
  const [manual, setManual] = useState('');

  const stopAll = () => {
    if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; }
    try { zxingStop.current?.(); } catch { /* already stopped */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const finish = (raw: string) => {
    const code = raw.replace(/\D/g, '');
    if (doneRef.current || code.length < 6) return;
    doneRef.current = true;
    setHit(true);
    stopAll();
    setTimeout(() => cbRef.current(code), 250); // brief "found" flash
  };

  useEffect(() => {
    let cancelled = false;
    const slowTimer = window.setTimeout(() => setSlow(true), 7000);

    (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        if (!cancelled) setError('Geen toegang tot de camera. Geef cameratoegang of voer de code handmatig in.');
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      try { await video.play(); } catch { /* autoplay may resolve late */ }

      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
      if (caps?.torch) setCanTorch(true);

      // Prefer the browser's native detector (fast + reliable on Android).
      let detector: BarcodeDetectorLike | null = null;
      const Ctor = window.BarcodeDetector;
      if (Ctor) {
        try {
          let formats = FORMATS;
          if (Ctor.getSupportedFormats) {
            const sup = await Ctor.getSupportedFormats();
            const inter = FORMATS.filter((f) => sup.includes(f));
            if (inter.length) formats = inter;
          }
          detector = new Ctor({ formats });
        } catch { detector = null; }
      }

      if (detector) {
        const tick = async () => {
          if (doneRef.current || cancelled) return;
          const v = videoRef.current;
          if (v && v.readyState >= 2) {
            try {
              const codes = await detector.detect(v);
              if (codes && codes.length) { finish(codes[0].rawValue); return; }
            } catch { /* transient decode error, keep going */ }
          }
          loopRef.current = window.setTimeout(tick, 200);
        };
        tick();
      } else {
        // Fallback for browsers without BarcodeDetector (e.g. iOS Safari): ZXing.
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ]);
        if (cancelled || doneRef.current) return;
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
        ]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
        const controls = await reader.decodeFromStream(stream, video, (result) => {
          if (result) finish(result.getText());
        });
        zxingStop.current = () => controls.stop();
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch { /* torch not controllable */ }
  };

  const submitManual = () => {
    finish(manual);
  };

  return (
    <div className="ff-scan">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Scan barcode</div>
        {canTorch ? (
          <button className={'ff-x' + (torchOn ? ' on' : '')} onClick={toggleTorch} aria-label="Zaklamp">
            {Ic.flame(18, torchOn ? '#1a1304' : 'currentColor')}
          </button>
        ) : (
          <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
        )}
      </div>

      <div className="ff-scan-view">
        <video ref={videoRef} className="ff-scan-video" playsInline muted autoPlay />
        {!error && (
          <div className={'ff-scan-frame' + (hit ? ' hit' : '')}>
            <span className="c tl" /><span className="c tr" /><span className="c bl" /><span className="c br" />
            {!hit && <div className="ff-scan-laser" />}
          </div>
        )}
        {error && <div className="ff-scan-error">{error}</div>}
        {!error && !hit && <div className="ff-scan-hint">Richt de camera op de streepjescode{slow ? ' — lukt het niet? Voer de code hieronder handmatig in.' : ''}</div>}
        {hit && <div className="ff-scan-hint">Gevonden ✓</div>}
      </div>

      <div className="ff-scan-manual">
        <div className="ff-sublabel" style={{ marginBottom: 8 }}>Of voer de code handmatig in</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="ff-search"
            inputMode="numeric"
            placeholder="Bijv. 5410188031072"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitManual(); }}
          />
          <button className="ff-x" style={{ width: 48 }} onClick={submitManual} aria-label="Zoek code">
            {Ic.search(18)}
          </button>
        </div>
      </div>
    </div>
  );
}
