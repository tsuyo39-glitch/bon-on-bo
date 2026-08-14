import { getNoiseBuffer } from '../consoles';
import type { InstrumentPlayer } from './types';

export const DRUM_LANE_NAMES = [
  '木魚・低',
  '木魚・高',
  '鈴（りん）',
  '引磬',
  '太鼓',
  '拍子木',
  '妙鉢',
  '錫杖',
] as const;

function playNoise(
  ctx: BaseAudioContext,
  destination: AudioNode,
  time: number,
  peak: number,
  decay: number,
  filterType: BiquadFilterType,
  frequency: number,
): void {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  gain.gain.setValueAtTime(0, time + decay);

  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
  source.stop(time + decay + 0.02);
}

/** 三角波の急速ピッチ下降（キック・タム共用） */
function playPitchDrop(
  ctx: BaseAudioContext,
  destination: AudioNode,
  time: number,
  peak: number,
  fromHz: number,
  toHz: number,
  dropSec: number,
  decay: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(fromHz, time);
  osc.frequency.exponentialRampToValueAtTime(toHz, time + dropSec);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  gain.gain.setValueAtTime(0, time + decay);

  osc.connect(gain).connect(destination);
  osc.start(time);
  osc.stop(time + decay + 0.03);
}

/** 短いノイズを 3 連発させる手拍子 */
function playClap(ctx: BaseAudioContext, destination: AudioNode, time: number, velocity: number): void {
  playNoise(ctx, destination, time, velocity * 0.9, 0.02, 'bandpass', 1200);
  playNoise(ctx, destination, time + 0.02, velocity * 0.9, 0.02, 'bandpass', 1200);
  playNoise(ctx, destination, time + 0.04, velocity, 0.14, 'bandpass', 1200);
}

/** 2 つの矩形波によるカウベル（540Hz + 800Hz） */
function playCowbell(ctx: BaseAudioContext, destination: AudioNode, time: number, velocity: number): void {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(velocity * 0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
  gain.gain.setValueAtTime(0, time + 0.14);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700;
  filter.Q.value = 1.5;

  filter.connect(gain).connect(destination);
  for (const freq of [540, 800]) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + 0.16);
  }
}

/** 木魚: 短い中空の胴鳴り。2音のサイン波を急減衰させる。 */
function playMokugyo(ctx: BaseAudioContext, destination: AudioNode, time: number, velocity: number, high = false): void {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(velocity * 0.75, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = high ? 720 : 430;
  filter.Q.value = 3.5;
  filter.connect(gain).connect(destination);
  for (const ratio of [1, 1.47]) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime((high ? 620 : 370) * ratio, time);
    osc.frequency.exponentialRampToValueAtTime((high ? 540 : 320) * ratio, time + 0.035);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + 0.16);
  }
  playNoise(ctx, destination, time, velocity * 0.12, 0.018, 'bandpass', 1100);
}

/** 鈴・鉢: 複数の非整数倍音を長く残す。 */
function playTempleBell(ctx: BaseAudioContext, destination: AudioNode, time: number, velocity: number, large = false): void {
  const frequencies = large ? [260, 421, 603, 887] : [920, 1513, 2180, 3110];
  frequencies.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const decay = (large ? 1.6 : 0.85) - index * 0.12;
    gain.gain.setValueAtTime((velocity * (large ? 0.22 : 0.13)) / (index + 1), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(time + decay + 0.04);
  });
}

// レーン: 0=Kick / 1=Snare / 2=HH Close / 3=HH Open / 4=Tom / 5=Clap / 6=Crash / 7=Cowbell
// （SPECIFICATION.md §4.2）
export const playDrums: InstrumentPlayer = (ctx, destination, { time, pitch, velocity }) => {
  switch (pitch) {
    case 0:
      playMokugyo(ctx, destination, time, velocity);
      break;
    case 1:
      playMokugyo(ctx, destination, time, velocity, true);
      break;
    case 2:
      playTempleBell(ctx, destination, time, velocity);
      break;
    case 3:
      playTempleBell(ctx, destination, time, velocity, true);
      break;
    case 4:
      playPitchDrop(ctx, destination, time, velocity * 0.7, 130, 62, 0.12, 0.42);
      break;
    case 5:
      playClap(ctx, destination, time, velocity * 0.75);
      break;
    case 6:
      playTempleBell(ctx, destination, time, velocity * 0.85, true);
      playNoise(ctx, destination, time, velocity * 0.12, 0.6, 'highpass', 4200);
      break;
    case 7:
      playCowbell(ctx, destination, time, velocity * 0.65);
      break;
  }
};
