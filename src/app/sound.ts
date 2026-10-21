// 原创音效：WebAudio 实时合成，无外部音频文件
let ctx: AudioContext | null = null;
let enabled = true;
let volume = 0.4;
export function configureSound(on: boolean, vol: number) { enabled = on; volume = vol; }

type SoundKind = 'level' | 'item' | 'error' | 'death' | 'click' | 'success';
const PATTERNS: Record<SoundKind, [number, number, OscillatorType][]> = {
  level: [[523, 0.08, 'triangle'], [659, 0.08, 'triangle'], [784, 0.16, 'triangle']],
  success: [[660, 0.07, 'sine'], [880, 0.12, 'sine']],
  item: [[880, 0.05, 'sine']],
  error: [[220, 0.12, 'square']],
  death: [[330, 0.15, 'sawtooth'], [220, 0.2, 'sawtooth'], [110, 0.35, 'sawtooth']],
  click: [[1200, 0.02, 'sine']],
};

export function play(kind: SoundKind) {
  if (!enabled || volume <= 0) return;
  try {
    ctx ||= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const [freq, dur, type] of PATTERNS[kind]) {
      const o = ctx.createOscillator();
      const gain = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      gain.gain.setValueAtTime(volume * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gain).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
      t += dur * 0.9;
    }
  } catch { /* 音频不可用 */ }
}
