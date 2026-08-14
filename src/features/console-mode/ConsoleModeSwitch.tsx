import { CONSOLE_MODES, type ConsoleMode } from '../../model/project';
import { useProjectStore } from '../../store/projectStore';

const MODE_LABELS: Record<ConsoleMode, string> = {
  famicom: '朱の伽藍',
  superfamicom: '紫の護摩',
  gameboy: '苔の禅庭',
};

function FamicomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </svg>
  );
}

function SuperFamicomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 21c-1.2-4.7-6.8-4.1-7.5-9 4.1-.6 6.3 1.3 7.5 4.4C13.2 13.3 15.4 11.4 19.5 12c-.7 4.9-6.3 4.3-7.5 9Z" />
      <path d="M12 16.4C8.2 14.1 8 9.2 12 4c4 5.2 3.8 10.1 0 12.4Z" />
    </svg>
  );
}

function GameBoyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M19.5 4.5C10.2 4.3 5.2 9.1 4.5 19.5 14.9 18.8 19.7 13.8 19.5 4.5Z" />
      <path d="M5 19c3.2-3.5 6.2-6.2 10.5-9" />
    </svg>
  );
}

const MODE_ICONS: Record<ConsoleMode, () => React.ReactElement> = {
  famicom: FamicomIcon,
  superfamicom: SuperFamicomIcon,
  gameboy: GameBoyIcon,
};

/** コンソールモード切替（アイコンのみ、選択中はアクセント色） */
export function ConsoleModeSwitch() {
  const consoleMode = useProjectStore((s) => s.project.consoleMode);
  const setConsoleMode = useProjectStore((s) => s.setConsoleMode);

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="伽藍の色調">
      {CONSOLE_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode];
        const selected = mode === consoleMode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={MODE_LABELS[mode]}
            title={MODE_LABELS[mode]}
            onClick={() => setConsoleMode(mode)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-ink/30 select-none ${
              selected ? 'bg-accent text-paper shadow-(--shadow-pixel)' : 'bg-paper text-ink'
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
