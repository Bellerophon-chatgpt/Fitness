// short beep + vibration, used when the rest timer ends
let ctx: AudioContext | undefined;

export function ping() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    o.start(t0);
    o.stop(t0 + 0.47);
  } catch {
    // audio unavailable — silently skip
  }
}

export function buzz() {
  try {
    if (navigator.vibrate) navigator.vibrate([140, 70, 140]);
  } catch {
    // vibration unavailable — silently skip
  }
}
