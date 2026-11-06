/* Sons synthétisés (WebAudio), calqués sur les fréquences / durées des fichiers d'origine de la 7.5 */
import { get, set, lsSet } from './store.js';
let AC = null;
export function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
function tone(ctx, { f, f2 = null, t0, dur, type = 'sine', g = 0.25, a = 0.005, r = null }) {
  const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(g, t0 + a); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + (r || dur));
  o.connect(gn).connect(ctx.destination); o.start(t0); o.stop(t0 + (r || dur) + 0.02);
}
const SOUNDS = {
  newalert(c, t) { tone(c, { f: 440, t0: t, dur: .12, g: .3, type: 'triangle' }); tone(c, { f: 1180, t0: t, dur: .12, g: .08 }); tone(c, { f: 587, t0: t + .14, dur: .45, g: .3, type: 'triangle' }); tone(c, { f: 1174, t0: t + .14, dur: .45, g: .07 }); },
  online(c, t) { tone(c, { f: 300, t0: t, dur: 1.3, g: .3, type: 'triangle', a: .02 }); tone(c, { f: 600, t0: t, dur: 1.0, g: .08 }); tone(c, { f: 900, t0: t, dur: .6, g: .04 }); },
  nudge(c, t) {
    const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(200, t); o.frequency.linearRampToValueAtTime(260, t + .45); o.frequency.linearRampToValueAtTime(200, t + .85);
    l.frequency.value = 28; lg.gain.value = .35; l.connect(lg).connect(g.gain);
    g.gain.setValueAtTime(.55, t); g.gain.setValueAtTime(.55, t + .6); g.gain.exponentialRampToValueAtTime(.001, t + .89);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    o.connect(f).connect(g).connect(c.destination); o.start(t); l.start(t); o.stop(t + .9); l.stop(t + .9);
    tone(c, { f: 780, t0: t, dur: .8, g: .06, type: 'square' });
  },
  newemail(c, t) { tone(c, { f: 300, t0: t, dur: .3, g: .25, type: 'triangle' }); tone(c, { f: 400, t0: t + .2, dur: .35, g: .25, type: 'triangle' }); tone(c, { f: 780, t0: t + .5, dur: .9, g: .25, type: 'triangle' }); },
  ring(c, t) { for (let i = 0; i < 2; i++) { tone(c, { f: 1180, t0: t + i * .45, dur: .35, g: .2 }); tone(c, { f: 1160, t0: t + i * .45, dur: .35, g: .1 }); } },
  vimdone(c, t) { tone(c, { f: 520, t0: t, dur: .5, g: .25, type: 'triangle' }); tone(c, { f: 1040, t0: t + .2, dur: .3, g: .12 }); },
  type(c, t) { tone(c, { f: 1800, f2: 600, t0: t, dur: .04, g: .12, type: 'square' }); },
  outgoing(c, t) { tone(c, { f: 880, f2: 1320, t0: t, dur: .09, g: .12 }); },
  wink(c, t) { for (let i = 0; i < 6; i++) tone(c, { f: 600 + i * 120, t0: t + i * .08, dur: .1, g: .15, type: 'triangle' }); tone(c, { f: 1320, t0: t + .5, dur: .5, g: .2 }); },
};
export function play(name) { if (get().muted || !SOUNDS[name]) return; try { const c = ac(); SOUNDS[name](c, c.currentTime); } catch (e) {} }
export function toggleMute() { const m = !get().muted; set({ muted: m }); lsSet('msn_muted', m); }
