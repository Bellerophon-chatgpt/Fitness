import { useState } from 'react';
import { sendMagicLink } from '../data/auth';

export function AuthGate({ onSkip }: { onSkip: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const validEmail = /\S+@\S+\.\S+/.test(email.trim());

  const send = async () => {
    if (!validEmail || busy) return;
    setBusy(true);
    setError(null);
    const err = await sendMagicLink(email);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <div className="ff-auth">
      <div className="ff-auth-card">
        <div className="ff-wordmark" style={{ fontSize: 22, marginBottom: 6 }}>
          FORM<b>&amp;</b>FUEL
        </div>

        {sent ? (
          <>
            <div className="ff-auth-sub">
              Check je mail: we hebben een inloglink gestuurd naar <b>{email}</b>. Open die link op dit apparaat om in te loggen. Je kunt dit tabblad daarna sluiten.
            </div>
            <button className="ff-btn ff-btn-ghost" onClick={send} disabled={busy}>
              {busy ? 'Versturen…' : 'Stuur opnieuw'}
            </button>
            <button
              className="ff-auth-skip"
              onClick={() => { setSent(false); setError(null); }}
            >
              Andere e-mail gebruiken
            </button>
          </>
        ) : (
          <>
            <div className="ff-auth-sub">
              Log in met je e-mail om je training en voeding te synchroniseren tussen je apparaten. Je krijgt een inloglink per mail — geen wachtwoord nodig.
            </div>
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
              {busy ? 'Versturen…' : 'Stuur inloglink'}
            </button>
            <button className="ff-auth-skip" onClick={onSkip}>Alleen op dit apparaat gebruiken</button>
          </>
        )}
      </div>
    </div>
  );
}
