/**
 * AppLogo — premium CSS-based logo for the auth pages.
 * Renders the app title (first half gradient-tinted, second half white) with
 * a rotating ring accent. Generic — uses environment.appTitle.
 */
import { environment } from '@/config/environment';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { text: 'text-2xl', ring: 28, icon: 14, gap: 'gap-2' },
  md: { text: 'text-4xl', ring: 40, icon: 20, gap: 'gap-3' },
  lg: { text: 'text-5xl', ring: 52, icon: 26, gap: 'gap-3.5' },
} as const;

export function AppLogo({ size = 'md' }: AppLogoProps) {
  const s = SIZES[size];
  const title = (environment.appTitle ?? 'App').trim();
  const splitIdx = title.length <= 3 ? title.length : Math.ceil(title.length / 2);
  const head = title.slice(0, splitIdx);
  const tail = title.slice(splitIdx);

  return (
    <div className={`inline-flex items-center ${s.gap}`}>
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: s.ring, height: s.ring }}>
        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]">
          <defs>
            <linearGradient id="app-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="url(#app-ring)"
            strokeWidth="2.5"
            strokeDasharray="70 30"
            strokeLinecap="round"
          />
        </svg>
        <div
          className="rounded-full"
          style={{
            width: s.icon,
            height: s.icon,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            boxShadow: '0 0 12px rgba(96, 165, 250, 0.5)',
          }}
        />
      </div>

      <div className="flex items-baseline">
        <span
          className={`${s.text} font-extrabold tracking-tight`}
          style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(96, 165, 250, 0.3))',
          }}
        >
          {head}
        </span>
        {tail && (
          <span
            className={`${s.text} font-extrabold tracking-tight text-white`}
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.15))' }}
          >
            {tail}
          </span>
        )}
      </div>
    </div>
  );
}
