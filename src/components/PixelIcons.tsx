type IconProps = { size?: number };

function PixelSvg({ size = 20, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlayIcon({ size }: IconProps) {
  return (
    <PixelSvg size={size}>
      <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />
    </PixelSvg>
  );
}

export function StopIcon({ size }: IconProps) {
  return (
    <PixelSvg size={size}>
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
    </PixelSvg>
  );
}

export function MetronomeIcon({ size }: IconProps) {
  return (
    <PixelSvg size={size}>
      <path d="M8 3h8l3 18H5L8 3Z" />
      <path d="m12 6 3 10" />
      <circle cx="13.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
    </PixelSvg>
  );
}
