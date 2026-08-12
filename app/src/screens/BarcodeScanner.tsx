import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Ic } from '../components/Icons';

const HINTS = new Map();
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]);

// Default export so it can be React.lazy()-loaded — keeps ZXing out of the
// main bundle until the user actually opens the scanner.
export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [manual, setManual] = useState('');

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(HINTS, { delayBetweenScanAttempts: 250 });

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current!,
        (result, _err, controls) => {
          controlsRef.current = controls;
          if (result && !doneRef.current) {
            doneRef.current = true;
            controls.stop();
            onDetected(result.getText());
          }
        },
      )
      .then((controls) => {
        controlsRef.current = controls;
        if (cancelled) {
          controls.stop();
          return;
        }
        // detect torch capability on the live track
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
        if (caps?.torch) setCanTorch(true);
      })
      .catch(() => {
        if (!cancelled) setError('Geen toegang tot de camera. Geef cameratoegang of voer de code handmatig in.');
      });

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        // already stopped
      }
    };
  }, [onDetected]);

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      // torch not controllable
    }
  };

  const submitManual = () => {
    const code = manual.replace(/\D/g, '');
    if (code.length >= 6 && !doneRef.current) {
      doneRef.current = true;
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore
      }
      onDetected(code);
    }
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
        <video ref={videoRef} className="ff-scan-video" playsInline muted />
        {!error && (
          <div className="ff-scan-frame">
            <span className="c tl" /><span className="c tr" /><span className="c bl" /><span className="c br" />
            <div className="ff-scan-laser" />
          </div>
        )}
        {error && <div className="ff-scan-error">{error}</div>}
        {!error && <div className="ff-scan-hint">Richt de camera op de streepjescode</div>}
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
