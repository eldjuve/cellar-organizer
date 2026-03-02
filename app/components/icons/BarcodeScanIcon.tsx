interface IconProps {
  size?: number;
  className?: string;
}

export function BarcodeScanIcon({ size, className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="7" y2="12" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="17" y1="12" x2="17" y2="12" />
      <rect x="9" y="7" width="6" height="10" rx="1" />
    </svg>
  );
}
