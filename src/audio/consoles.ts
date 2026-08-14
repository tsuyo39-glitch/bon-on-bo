// コンソールモード別の波形・質感の定義（SPECIFICATION.md §3.3 / §4.1）。

import type { ConsoleMode } from '../model/project';

const pulseWaveCache = new WeakMap<BaseAudioContext, Map<number, PeriodicWave>>();

/**
 * デューティ比 duty (0–1) の矩形波 PeriodicWave を返す。
 * ファミコンの 12.5 / 25 / 50% デューティを想定。ctx ごとにキャッシュする。
 */
export function getPulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  let byDuty = pulseWaveCache.get(ctx);
  if (!byDuty) {
    byDuty = new Map();
    pulseWaveCache.set(ctx, byDuty);
  }
  const cached = byDuty.get(duty);
  if (cached) return cached;

  // パルス波のフーリエ係数: c_n = (2 / nπ) · sin(nπ·duty)（DC 成分は除く）
  const harmonics = 32;
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n++) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  }
  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  byDuty.set(duty, wave);
  return wave;
}

const noiseBufferCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** 1 秒分のホワイトノイズバッファ。ctx ごとにキャッシュする */
export function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseBufferCache.get(ctx);
  if (cached) return cached;
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBufferCache.set(ctx, buffer);
  return buffer;
}

/**
 * WaveShaper 用の量子化カーブ。levels 段（4bit なら 16）に階段化して
 * ゲームボーイ風のビットクラッシュ質感を作る。
 */
export function makeBitcrushCurve(levels: number, samples = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    const quantized = Math.round(((x + 1) / 2) * (levels - 1)) / (levels - 1);
    curve[i] = quantized * 2 - 1;
  }
  return curve;
}

/**
 * 伽藍の空気感を与える穏やかな音色補正。
 * 旧チップチューン版のビットクラッシュは使わず、人声の連続性を保つ。
 */
export function createConsoleChain(
  ctx: BaseAudioContext,
  mode: ConsoleMode,
  destination: AudioNode,
): AudioNode {
  switch (mode) {
    case 'famicom':
      return destination;
    case 'gameboy': {
      const warmth = ctx.createBiquadFilter();
      warmth.type = 'lowshelf';
      warmth.frequency.value = 420;
      warmth.gain.value = 2.5;
      warmth.connect(destination);
      return warmth;
    }
    case 'superfamicom': {
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 10500;
      lowpass.Q.value = 0.35;
      lowpass.connect(destination);
      return lowpass;
    }
  }
}

/**
 * ファミコンらしい段階的な音量減衰をスケジュールする。
 * 連続カーブではなく steps 段の setValueAtTime で階段状に落とす。
 */
export function scheduleSteppedDecay(
  param: AudioParam,
  peak: number,
  start: number,
  duration: number,
  steps = 10,
): void {
  param.setValueAtTime(peak, start);
  for (let i = 1; i <= steps; i++) {
    const level = peak * (1 - i / steps) ** 2;
    param.setValueAtTime(level, start + (duration * i) / steps);
  }
}
