import { getNoiseBuffer } from '../consoles';
import { midiToFreq } from '../pitch';
import type { InstrumentPlayer } from './types';

// 声明: 声帯波、母音フォルマント、息、ゆっくりした音程揺れを重ねた男声合成。
export const playPiano: InstrumentPlayer = (ctx, destination, { time, pitch, velocity, duration }) => {
  const end = time + Math.max(0.35, duration);
  const voiceBus = ctx.createGain();
  const sourceBus = ctx.createGain();
  const throat = ctx.createBiquadFilter();
  throat.type = 'lowpass';
  throat.frequency.value = 3900;
  throat.Q.value = 0.45;

  voiceBus.gain.setValueAtTime(0.001, time);
  voiceBus.gain.exponentialRampToValueAtTime(velocity * 0.5, time + 0.11);
  voiceBus.gain.linearRampToValueAtTime(velocity * 0.43, Math.max(time + 0.13, end - 0.18));
  voiceBus.gain.exponentialRampToValueAtTime(0.001, end + 0.16);
  voiceBus.connect(destination);
  sourceBus.connect(throat);

  // 「お〜あ」の中間に聞こえる男性母音。並列フィルターで口腔共鳴を作る。
  const formants = [
    { frequency: 430, q: 5.2, level: 1 },
    { frequency: 920, q: 7, level: 0.48 },
    { frequency: 2450, q: 10, level: 0.16 },
  ];
  formants.forEach(({ frequency, q, level }) => {
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    gain.gain.value = level;
    throat.connect(filter).connect(gain).connect(voiceBus);
  });

  const fundamental = midiToFreq(pitch);
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();
  vibrato.type = 'sine';
  vibrato.frequency.value = 4.7;
  vibratoDepth.gain.setValueAtTime(0, time);
  vibratoDepth.gain.linearRampToValueAtTime(9, time + 0.3);
  vibrato.connect(vibratoDepth);

  // わずかにずれた二つの声帯波で、単一発振器らしさを消す。
  [-4, 3].forEach((detune, index) => {
    const osc = ctx.createOscillator();
    const level = ctx.createGain();
    osc.type = index === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.value = fundamental;
    osc.detune.value = detune;
    level.gain.value = index === 0 ? 0.55 : 0.26;
    vibratoDepth.connect(osc.detune);
    osc.connect(level).connect(sourceBus);
    osc.start(time);
    osc.stop(end + 0.18);
  });

  // 子音のない声明にも微かな呼気を混ぜ、電子音の輪郭を和らげる。
  const breath = ctx.createBufferSource();
  const breathFilter = ctx.createBiquadFilter();
  const breathGain = ctx.createGain();
  breath.buffer = getNoiseBuffer(ctx);
  breath.loop = true;
  breathFilter.type = 'bandpass';
  breathFilter.frequency.value = 1750;
  breathFilter.Q.value = 0.7;
  breathGain.gain.setValueAtTime(0.001, time);
  breathGain.gain.linearRampToValueAtTime(velocity * 0.035, time + 0.1);
  breathGain.gain.setValueAtTime(velocity * 0.025, Math.max(time + 0.12, end - 0.15));
  breathGain.gain.exponentialRampToValueAtTime(0.001, end + 0.12);
  breath.connect(breathFilter).connect(breathGain).connect(voiceBus);
  breath.start(time);
  breath.stop(end + 0.14);

  vibrato.start(time);
  vibrato.stop(end + 0.18);
};
