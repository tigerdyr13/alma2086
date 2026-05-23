import { unlockTransitionAudio } from './transition-audio';

let sharedCtx: AudioContext | null = null;

async function getContext(): Promise<AudioContext | null> {
  await unlockTransitionAudio();
  if (typeof window === 'undefined') return null;
  try {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx) sharedCtx = new Ctx();
    if (sharedCtx.state === 'suspended') await sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

function noiseBurst(ctx: AudioContext, duration: number, volume: number, freq = 700): void {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

export async function playInterruptionGlitch(intensity: 'normal' | 'strong' = 'normal'): Promise<void> {
  const ctx = await getContext();
  if (!ctx) return;

  const vol = intensity === 'strong' ? 0.09 : 0.055;
  noiseBurst(ctx, intensity === 'strong' ? 0.5 : 0.3, vol, intensity === 'strong' ? 400 : 750);
  noiseBurst(ctx, 0.15, vol * 0.6, 1200);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(intensity === 'strong' ? 90 : 140, ctx.currentTime);
  gain.gain.setValueAtTime(intensity === 'strong' ? 0.04 : 0.025, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function vibrateInterruption(intensity: 'normal' | 'strong' = 'normal'): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  if (intensity === 'strong') {
    navigator.vibrate([30, 40, 50, 40, 30]);
  } else {
    navigator.vibrate([25, 35, 25]);
  }
}
