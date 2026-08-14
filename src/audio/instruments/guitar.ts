import { midiToFreq } from '../pitch';
import type { InstrumentPlayer } from './types';

// 梵鐘: 非整数倍音を重ねた金属的な長い余韻。
export const playGuitar: InstrumentPlayer = (ctx, destination, { time, pitch, velocity, duration }) => {
  const fundamental = midiToFreq(pitch);
  const decay = Math.min(Math.max(duration + 1.2, 1.8), 4.5);
  [1, 1.53, 2.09, 2.71, 3.84].forEach((ratio, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = fundamental * ratio;
    gain.gain.setValueAtTime((velocity * 0.32) / (index + 1), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay - index * 0.16);
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(time + decay + 0.05);
  });
};
