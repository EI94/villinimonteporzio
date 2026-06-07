import { cn } from '@/app/lib/utils/cn';

interface VoltaLogoProps {
  className?: string;
  /** Colore wordmark — default currentColor (eredita) */
  color?: string;
  height?: number;
}

/** Wordmark Volta ufficiale (SVG estratto da Volta-logo-RGB-Black.svg) */
export function VoltaLogo({ className, color = 'currentColor', height = 24 }: VoltaLogoProps) {
  return (
    <svg
      viewBox="0 0 922.2 256.5"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Volta"
      role="img"
      style={{ height, width: 'auto' }}
      className={cn('block', className)}
    >
      <path
        fill={color}
        d="M554.1,246.7h-89V9.8h89V246.7z M680.7,58.7h-23.1V9.8h-85.1v200.9c0,19.9,16.1,36,36,36h49.1V121.4h23.1V58.7z M446.8,94.7v116c0,19.9-16.1,36-36,36h-141c-19.9,0-36-16.1-36-36v-116c0-19.9,16.1-36,36-36h141C430.7,58.7,446.8,74.8,446.8,94.7z M348,113.7h-15.4v77.9H348V113.7z M876.1,58.7h-177v62.8h114.2v70.1h-15.4v-54.7h-98.8v73.8c0,19.9,16.1,36,36,36h177v-152C912.1,74.8,896,58.7,876.1,58.7z M134.1,58.7l-17.5,128l-17.5-128h-89l25.7,188h72.6h16.4H166c18,0,33.2-13.3,35.7-31.1l21.5-156.9H134.1z"
      />
    </svg>
  );
}
