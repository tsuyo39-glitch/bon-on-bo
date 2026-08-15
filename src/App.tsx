import { useEffect, useState } from 'react';
import { ConsoleModeSwitch } from './features/console-mode/ConsoleModeSwitch';
import { DrumGrid } from './features/drum-grid/DrumGrid';
import { ProjectFileButtons } from './features/export/ProjectFileButtons';
import { WavExportButton } from './features/export/WavExportButton';
import { PianoRoll, type PitchedTrackId } from './features/piano-roll/PianoRoll';
import { UpdateToast } from './features/pwa/UpdateToast';
import { TrackTabs } from './features/tracks/TrackTabs';
import { Transport } from './features/transport/Transport';
import { useTransport } from './features/transport/useTransport';
import { TRACK_IDS, type TrackId } from './model/project';
import { useProjectStore } from './store/projectStore';

function isEditingText(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  );
}

function App() {
  const project = useProjectStore((s) => s.project);
  const setTitle = useProjectStore((s) => s.setTitle);
  const [activeTrack, setActiveTrack] = useState<TrackId>('drums');
  const { toggle: togglePlayback } = useTransport();

  const loadChantPattern = () => {
    const current = useProjectStore.getState().project;
    const hasNotes = current.tracks.some((track) => track.notes.length > 0);
    if (hasNotes && !window.confirm('現在の譜面を「般若の型」に置き換えますか？')) return;
    useProjectStore.getState().loadProject({
      ...current,
      title: '般若の型',
      bpm: 72,
      tracks: current.tracks.map((track) => ({
        ...track,
        notes:
          track.id === 'piano'
            ? [
                { step: 0, pitch: 48, length: 8, velocity: 0.72 },
                { step: 8, pitch: 50, length: 4, velocity: 0.65 },
                { step: 12, pitch: 48, length: 12, velocity: 0.76 },
                { step: 24, pitch: 43, length: 8, velocity: 0.68 },
                { step: 32, pitch: 48, length: 16, velocity: 0.78 },
                { step: 48, pitch: 50, length: 8, velocity: 0.66 },
                { step: 56, pitch: 48, length: 8, velocity: 0.72 },
              ]
            : track.id === 'guitar'
              ? [
                  { step: 0, pitch: 43, length: 8, velocity: 0.58 },
                  { step: 64, pitch: 41, length: 8, velocity: 0.54 },
                ]
              : track.id === 'bass'
                ? [
                    { step: 0, pitch: 36, length: 32, velocity: 0.5 },
                    { step: 32, pitch: 34, length: 32, velocity: 0.46 },
                  ]
                : Array.from({ length: 32 }, (_, i) => ({
                    step: i * 2,
                    pitch: i % 8 === 7 ? 2 : i % 4 === 3 ? 1 : 0,
                    length: 1,
                    velocity: i % 4 === 0 ? 0.88 : 0.62,
                  })),
      })),
    });
  };

  const clearScore = () => {
    const hasNotes = useProjectStore.getState().project.tracks.some((track) => track.notes.length > 0);
    if (!hasNotes) return;
    if (!window.confirm('すべてのトラックの楽譜を削除しますか？\nこの操作は元に戻せません。')) return;
    useProjectStore.getState().clearAllNotes();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || isEditingText(event.target)) {
        return;
      }

      const trackIndex = Number(event.key) - 1;
      const selectedTrack = TRACK_IDS[trackIndex];
      if (selectedTrack) {
        event.preventDefault();
        setActiveTrack(selectedTrack);
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      } else if (event.code === 'KeyM') {
        event.preventDefault();
        useProjectStore.getState().toggleMute(activeTrack);
      } else if (event.code === 'KeyS') {
        event.preventDefault();
        useProjectStore.getState().toggleSolo(activeTrack);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTrack, togglePlayback]);

  useEffect(() => {
    document.documentElement.dataset.console = project.consoleMode;
  }, [project.consoleMode]);

  return (
    <div className="sacred-app min-h-dvh">
      <div className="ambient-light ambient-light-left" aria-hidden="true" />
      <div className="ambient-light ambient-light-right" aria-hidden="true" />
      <header className="temple-header flex flex-wrap items-center gap-4 border-b-2 border-ink px-4 py-3">
        <div className="bonji-seal" aria-hidden="true"><span>अ</span></div>
        <div>
          <h1 className="text-2xl tracking-[0.28em]">梵音房</h1>
          <p className="text-xs tracking-[0.18em] text-shade">BON-ON-BO · 聖音を結ぶ場所</p>
        </div>
        <input
          type="text"
          value={project.title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="プロジェクト名"
          className="w-48 border-2 border-ink bg-paper px-2 py-1 text-sm text-shade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        <div className="ml-auto flex items-center gap-6">
          <ConsoleModeSwitch />
          <div className="flex gap-2">
            <button type="button" onClick={loadChantPattern} className="preset-button border-2 border-ink bg-gold px-3 py-2 shadow-(--shadow-pixel)">
              般若の響き
            </button>
            <button
              type="button"
              onClick={clearScore}
              disabled={!project.tracks.some((track) => track.notes.length > 0)}
              className="border-2 border-ink bg-paper px-3 py-2 text-shade shadow-(--shadow-pixel) disabled:cursor-not-allowed disabled:opacity-35"
            >
              楽譜を削除
            </button>
            <ProjectFileButtons />
            <WavExportButton />
          </div>
        </div>
      </header>

      <Transport onToggle={togglePlayback} />

      <main className="sacred-main space-y-5 p-4">
        <section className="instrument-sanctuary">
          <p className="section-caption">四つの響き</p>
          <TrackTabs activeTrack={activeTrack} onSelect={setActiveTrack} />
        </section>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-y-2 border-ink bg-tone px-3 py-2 text-xs text-shade" aria-label="キーボードショートカット">
          <span><kbd className="font-num text-[9px] text-ink">SPACE</kbd> 再生/停止</span>
          <span><kbd className="font-num text-[9px] text-ink">1–4</kbd> トラック切替</span>
          <span><kbd className="font-num text-[9px] text-ink">M</kbd> ミュート</span>
          <span><kbd className="font-num text-[9px] text-ink">S</kbd> ソロ</span>
        </div>

        <section className="score-sanctuary">
          <p className="section-caption">音曼荼羅</p>
          {activeTrack === 'drums' ? (
            <DrumGrid />
          ) : (
            <PianoRoll trackId={activeTrack as PitchedTrackId} />
          )}
        </section>
      </main>

      <UpdateToast />
    </div>
  );
}

export default App;
