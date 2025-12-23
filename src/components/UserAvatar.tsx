import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const COLOR_CLASSES = [
  { bg: 'bg-blue-500/20', text: 'text-blue-200' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-200' },
  { bg: 'bg-purple-500/20', text: 'text-purple-200' },
  { bg: 'bg-pink-500/20', text: 'text-pink-200' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-200' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-200' },
];

const FONT_CLASSES = ['font-semibold', 'font-bold', 'font-extrabold'] as const;

function hashToIndex(input: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}

function getInitial(user: User | null | undefined) {
  const source = (user?.username || user?.email || 'U').trim();
  return (source[0] || 'U').toUpperCase();
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: {
  user: User | null | undefined;
  className?: string;
  fallbackClassName?: string;
}) {
  const seed = (user?.username || user?.email || 'user').toLowerCase();
  const palette = COLOR_CLASSES[hashToIndex(seed, COLOR_CLASSES.length)];
  const font = FONT_CLASSES[hashToIndex(seed + ':font', FONT_CLASSES.length)];
  const isViewer = user?.role === 'viewer';

  return (
    <Avatar
      className={cn(
        'shrink-0',
        isViewer ? 'ring-2 ring-yellow-500/60 ring-offset-2 ring-offset-[#0f172a]' : 'border border-white/10',
        className
      )}
      aria-label={user?.username ? `User avatar for ${user.username}` : 'User avatar'}
    >
      <AvatarFallback
        className={cn(
          'select-none',
          palette.bg,
          palette.text,
          font,
          fallbackClassName
        )}
      >
        {getInitial(user)}
      </AvatarFallback>
    </Avatar>
  );
}
