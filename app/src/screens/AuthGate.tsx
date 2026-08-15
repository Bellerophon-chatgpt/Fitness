import { useState } from 'react';
import { sendLoginCode, verifyLoginCode } from '../data/auth';

export function AuthGate({ onSkip }: { onSkip: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const validEmail = /\S+@\S+\.\S+/.test(email.trim());

  const send = async () => {
    if (!validEmail || busy) return;
    setBusy(true);
    setError(null);
    const err = await sendLoginCode(email);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      setStep('code');
      setSent(true);
    }
  };

  const verify = async () => {
    if (code.trim().length < 6 || busy) return;
    setBusy(true);
    setError(null);
    const err = await verifyLoginCode(email, code);
    setBusy(false);
    if (err) setError(err);
    // on success the auth listener in App takes over and swaps in the app
  };

  return (
    <div className="ff-auth">
      <div className="ff-auth-card">
        <div className="ff-wordmark" style={{ fontSize: 22, marginBottom: 6 }}>
          FORM<b>&amp;</b>FUEL
        </div>

        {step === 'email' ? (
          <>
            <div className="ff-auth-sub">Log in met je e-mail om je training en voeding te synchroniseren tussen je apparaten. Je krijgt een inlogcode per mail — geen wachtwoord nodig.</div>
            <input
              className="ff-search ff-auth-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              autoFocus
            />
            {error && <div className="ff-auth-err">{error}</div>}
            <button className="ff-btn ff-btn-primary" disabled={!validEmail || busy} onClick={send}>
              {busy ? 'Versturen…' : 'Stuur inlogcode'}
            </button>
            <button className="ff-auth-skip" onClick={onSkip}>Alleen op dit apparaat gebruiken</button>
          </>
        ) : (
          <>
            <div className="ff-auth-sub">
              We hebben een code gestuurd naar <b>{email}</b>. Voer die hieronder in.
            </div>
            <input
              className="ff-search ff-auth-input ff-auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
              autoFocus
            />
            {error && <div className="ff-auth-err">{error}</div>}
            <button className="ff-btn ff-btn-primary" disabled={code.length < 6 || busy} onClick={verify}>
              {busy ? 'Controleren…' : 'Inloggen'}
            </button>
            <button className="ff-auth-skip" onClick={() => { setStep('email'); setCode(''); setError(null); }}>
              {sent ? 'Andere e-mail gebruiken' : 'Terug'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
