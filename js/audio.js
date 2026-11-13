/* Meridian Bureau: sound. Everything is synthesised on the spot; there are no audio files. */
(function (MB) {
  'use strict';

  const MUTE_KEY = 'meridian-bureau-mute';
  let ctx = null, master = null, muted = false, lastTick = 0;
  try { muted = window.localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* ignore */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, at, dur, type, vol, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function hiss(at, dur, vol) {
    const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; g.gain.value = vol;
    src.connect(g); g.connect(master);
    src.start(ctx.currentTime + at);
  }
  const pitch = n => 440 * Math.pow(2, (n - 69) / 12);
  function tune(notes, step, type, vol) {
    notes.forEach((n, i) => { if (n != null) tone(pitch(n), i * step, step * 0.95, type, vol); });
  }

  const SOUNDS = {
    tick() {
      const now = Date.now();
      if (now - lastTick < 45) return;
      lastTick = now;
      tone(1500 + Math.random() * 300, 0, 0.02, 'square', 0.04);
    },
    click() { tone(660, 0, 0.05, 'square', 0.12); },
    clue() { tune([76, 81], 0.09, 'triangle', 0.3); },
    deny() { tone(150, 0, 0.22, 'sawtooth', 0.16, 90); },
    alert() { tune([70, 64, 70, 64], 0.1, 'square', 0.14); },
    fly() { tone(180, 0, 1.4, 'sawtooth', 0.09, 520); hiss(0, 1.4, 0.05); },
    land() { tune([72, 67], 0.1, 'triangle', 0.22); },
    stamp() { hiss(0, 0.12, 0.4); tone(90, 0, 0.18, 'sine', 0.5, 50); },
    start() { tune([62, 65, 69, 74, 72, 69, 74], 0.11, 'square', 0.16); },
    win() {
      tune([67, 72, 76, 79, null, 76, 79, 84], 0.12, 'square', 0.18);
      tune([48, null, 55, null, 52, null, 60, 60], 0.12, 'triangle', 0.25);
    },
    lose() { tune([67, 63, 60, 55, 51], 0.2, 'triangle', 0.25); }
  };

  MB.Audio = {
    unlock: ensure,
    play(name) {
      if (muted || !SOUNDS[name]) return;
      try { if (ensure()) SOUNDS[name](); } catch (e) { /* sound is optional */ }
    },
    isMuted: () => muted,
    setMuted(on) {
      muted = !!on;
      if (master) master.gain.value = muted ? 0 : 0.22;
      try { window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
    }
  };
})(window.MB = window.MB || {});
