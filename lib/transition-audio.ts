let sharedCtx: AudioContext | null = null;

async function getContext(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx) sharedCtx = new Ctx();
    if (sharedCtx.state === 'suspended') await sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

function noiseBurst(ctx: AudioContext, duration: number, volume: number): void {
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
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

function tone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function sweep(ctx: AudioContext, from: number, to: number, duration: number, volume: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export async function playTransitionAudio(phase: 'detect' | 'link' | 'stage' | 'established'): Promise<void> {
  const ctx = await getContext();
  if (!ctx) return;

  const t = ctx.currentTime;

  switch (phase) {
    case 'detect':
      noiseBurst(ctx, 0.35, 0.04);
      tone(ctx, 220, 0.08, 0.03, 'square');
      break;
    case 'link':
      noiseBurst(ctx, 0.2, 0.025);
      sweep(ctx, 180, 520, 0.45, 0.035);
      break;
    case 'stage':
      tone(ctx, 440, 0.06, 0.02, 'triangle');
      break;
    case 'established':
      tone(ctx, 660, 0.12, 0.04, 'sine');
      tone(ctx, 880, 0.18, 0.025, 'sine');
      {
        const hum = ctx.createOscillator();
        const humGain = ctx.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(55, t);
        humGain.gain.setValueAtTime(0.001, t);
        humGain.gain.linearRampToValueAtTime(0.03, t + 0.08);
        humGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        hum.connect(humGain);
        humGain.connect(ctx.destination);
        hum.start(t);
        hum.stop(t + 0.5);
      }
      break;
  }
}

export async function unlockTransitionAudio(): Promise<void> {
  await getContext();
}
