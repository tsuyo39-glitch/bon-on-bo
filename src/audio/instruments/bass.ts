import { midiToFreq } from '../pitch';
import type { InstrumentPlayer } from './types';

// 地鳴り: 寺院の床下から響くような低い持続音。
export const playBass: InstrumentPlayer = (ctx, destination, { time, pitch, velocity, duration }) => {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = midiToFreq(pitch - 12);

  const harmonic = ctx.createOscillator();
  harmonic.type = 'triangle';
  harmonic.frequency.value = midiToFreq(pitch - 5);

  const gain = ctx.createGain();
  const level = velocity * 0.38;
  const release = 0.4;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(level, time + 0.08);
  gain.gain.setValueAtTime(level, time + duration);
  gain.gain.linearRampToValueAtTime(0, time + duration + release);

  const harmonicGain = ctx.createGain();
  harmonicGain.gain.value = 0.16;
  osc.connect(gain).connect(destination);
  harmonic.connect(harmonicGain).connect(gain);
  osc.start(time);
  osc.stop(time + duration + release + 0.05);
  harmonic.start(time);
  harmonic.stop(time + duration + release + 0.05);
};
