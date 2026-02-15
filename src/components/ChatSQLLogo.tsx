/**
 * ChatSQL Logo Component
 * 
 * Renders the ChatSQL logo at various sizes.
 * Based on the approved favicon design: gradient rounded square,
 * white chat bubble with data-row lines, and AI sparkle accent.
 * 
 * Usage:
 *   <ChatSQLLogo size="sm" />          — 32×32 (favicon, tiny spots)
 *   <ChatSQLLogo size="md" />          — 40×40 (sidebar, navbar)
 *   <ChatSQLLogo size="lg" />          — 64×64 (headings, hero)
 *   <ChatSQLLogo size={48} />          — custom pixel size
 *   <ChatSQLLogo className="shadow" /> — extra classes on wrapper
 */

import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg' | number;

interface ChatSQLLogoProps {
  size?: LogoSize;
  className?: string;
  /** Show hover glow animation */
  glow?: boolean;
}

const sizeMap: Record<string, number> = {
  sm: 32,
  md: 40,
  lg: 64,
};

export function ChatSQLLogo({ size = 'md', className, glow = false }: ChatSQLLogoProps) {
  const px = typeof size === 'number' ? size : sizeMap[size] ?? 40;

  return (
    <div
      className={cn(
        'relative shrink-0',
        glow && 'group',
        className
      )}
      style={{ width: px, height: px }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      )}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full"
      >
        <defs>
          <linearGradient id={`logo-bg-${px}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* Rounded square background */}
        <rect width="64" height="64" rx="16" fill={`url(#logo-bg-${px})`} />

        {/* Chat bubble */}
        <rect x="14" y="14" width="36" height="26" rx="8" fill="white" />
        <polygon points="20,40 28,40 18,50" fill="white" />

        {/* Data row lines */}
        <rect x="20" y="22" width="24" height="3" rx="1.5" fill="#6366f1" />
        <rect x="20" y="29" width="16" height="3" rx="1.5" fill="#6366f1" opacity="0.5" />

        {/* AI sparkle */}
        <g transform="translate(52, 12)">
          <path
            d="M0-6 L1.6-1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6-1.6Z"
            fill="white"
            opacity="0.9"
          />
        </g>
        <g transform="translate(54, 22)">
          <path
            d="M0-3 L0.8-0.8 L3 0 L0.8 0.8 L0 3 L-0.8 0.8 L-3 0 L-0.8-0.8Z"
            fill="white"
            opacity="0.6"
          />
        </g>
      </svg>
    </div>
  );
}

export default ChatSQLLogo;
