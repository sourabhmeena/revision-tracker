import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

/** Outline icon base — consistent 24px grid, 1.8 stroke, rounded joins. */
function S({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: P) => (
  <S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20a1 1 0 0 0 1 1H9.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V21h3a1 1 0 0 0 1-1V9.5" /></S>
);
export const BookIcon = (p: P) => (
  <S {...p}><path d="M12 6.5C10.5 5 8.5 4.3 6 4.3c-1 0-2 .15-3 .45v13.5c1-.3 2-.45 3-.45 2.5 0 4.5.7 6 2.2m0-13.5c1.5-1.5 3.5-2.2 6-2.2 1 0 2 .15 3 .45v13.5c-1-.3-2-.45-3-.45-2.5 0-4.5.7-6 2.2m0-13.5v13.5" /></S>
);
export const ListIcon = (p: P) => (
  <S {...p}><path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20" /><circle cx="4.2" cy="6.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.2" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.2" cy="17.5" r="1.1" fill="currentColor" stroke="none" /></S>
);
export const CalendarIcon = (p: P) => (
  <S {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3.5V6M16 3.5V6" /></S>
);
export const SettingsIcon = (p: P) => (
  <S {...p}><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1A2 2 0 1 1 7 3.6l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></S>
);
export const SunIcon = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></S>
);
export const MoonIcon = (p: P) => (
  <S {...p}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" /></S>
);
export const PlusIcon = (p: P) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const MinusIcon = (p: P) => (<S {...p}><path d="M5 12h14" /></S>);
export const CheckIcon = (p: P) => (<S {...p}><path d="M5 13l4 4L19 7" /></S>);
export const XIcon = (p: P) => (<S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>);
export const PencilIcon = (p: P) => (
  <S {...p}><path d="M16.5 4.5l3 3M4 20l1-4L16.5 4.5a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1L8.5 19 4 20Z" /></S>
);
export const TrashIcon = (p: P) => (
  <S {...p}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6.5 7l.7 12a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9L17.5 7M10 11v6M14 11v6" /></S>
);
export const CopyIcon = (p: P) => (
  <S {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></S>
);
export const ChevronLeft = (p: P) => (<S {...p}><path d="M14.5 5.5 8 12l6.5 6.5" /></S>);
export const ChevronRight = (p: P) => (<S {...p}><path d="M9.5 5.5 16 12l-6.5 6.5" /></S>);
export const ChevronDown = (p: P) => (<S {...p}><path d="M5.5 9 12 15.5 18.5 9" /></S>);
export const SearchIcon = (p: P) => (<S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></S>);
export const ArrowRight = (p: P) => (<S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>);
export const TrophyIcon = (p: P) => (
  <S {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4.5a1.5 1.5 0 0 0 0 5H7M17 5h2.5a1.5 1.5 0 0 1 0 5H17M9.5 13.5 9 17h6l-.5-3.5M8 20.5h8M10 17v3.5M14 17v3.5" /></S>
);
export const TargetIcon = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></S>
);
export const SparklesIcon = (p: P) => (
  <S {...p}><path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7L12 3.5Z" /><path d="M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" /></S>
);
export const ClockIcon = (p: P) => (<S {...p}><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" /></S>);
export const LayersIcon = (p: P) => (
  <S {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3.5 12 8.5 4.7 8.5-4.7M3.5 16l8.5 4.7 8.5-4.7" /></S>
);
export const CheckCircleIcon = (p: P) => (<S {...p}><circle cx="12" cy="12" r="8.4" /><path d="m8.5 12 2.4 2.4 4.6-4.8" /></S>);
export const LockIcon = (p: P) => (
  <S {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.4" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15.3" r="1.2" fill="currentColor" stroke="none" /></S>
);
export const EyeIcon = (p: P) => (<S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></S>);
export const EyeOffIcon = (p: P) => (
  <S {...p}><path d="M4 4l16 16M9.6 5.9A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M6.3 7.8A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.2 9.2 0 0 0 3.2-.6M9.9 9.9a3 3 0 0 0 4.2 4.2" /></S>
);
export const KeyIcon = (p: P) => (
  <S {...p}><circle cx="8" cy="15" r="4.2" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M13.5 9.5 16 12" /></S>
);
export const LogoutIcon = (p: P) => (
  <S {...p}><path d="M15 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H15M10 12h11m0 0-3-3m3 3-3 3" /></S>
);
export const BoltIcon = (p: P) => (<S {...p}><path d="M13 2 4 13.5h6L9 22l10-12h-6l1-8Z" /></S>);
export const TrendingUpIcon = (p: P) => (<S {...p}><path d="M3 17l6-6 4 4 8-8M21 7v5M21 7h-5" /></S>);
export const InfoIcon = (p: P) => (<S {...p}><circle cx="12" cy="12" r="8.4" /><path d="M12 11v5M12 8h.01" /></S>);
export const BellIcon = (p: P) => (
  <S {...p}><path d="M6 9a6 6 0 1 1 12 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5Z" /><path d="M9.5 19a2.5 2.5 0 0 0 5 0" /></S>
);
export const RefreshIcon = (p: P) => (
  <S {...p}><path d="M3.5 12a8.5 8.5 0 0 1 14.7-5.8L21 9M21 4v5h-5M20.5 12a8.5 8.5 0 0 1-14.7 5.8L3 15M3 20v-5h5" /></S>
);

/** Filled flame for the streak — accepts a `gradientId` to paint with a gradient. */
export function FlameIcon({ gradientId, ...p }: P & { gradientId?: string }) {
  const fill = gradientId ? `url(#${gradientId})` : "currentColor";
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...p}>
      {gradientId && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="45%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      )}
      <path
        fill={fill}
        d="M13.4 1.7c.3 2.5-.5 4.3-1.9 5.8-1.4 1.5-3.2 2.8-4.4 4.8a6.8 6.8 0 0 0 1.2 8.4 6.6 6.6 0 0 0 9.3-.3 6.8 6.8 0 0 0 .6-8.7c-.5-.7-1.6-1.6-1.8-.7-.2.9-.9 1.4-1.5 1.1-.7-.3-.6-1.2-.4-2.3.4-2.2.2-5-1.1-7.2-.3-.5-1.2-2-1.7-1.4Z"
      />
      <path
        fill={gradientId ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)"}
        d="M12.2 12.6c.7 1 .3 2.2-.2 3.1-.4.7-.5 1.6.1 2.2.7.7 2 .6 2.7-.2.9-1 .7-2.4.3-3.3-.3-.7-.9-1.4-1.4-2-.4-.4-1.2-.5-1.5.2Z"
      />
    </svg>
  );
}

/** Brand mark fallback (graduation cap) — used where the logo image isn't ideal. */
export const BrandIcon = (p: P) => (
  <S {...p}><path d="M2.5 8.5 12 4l9.5 4.5L12 13 2.5 8.5Z" /><path d="M6.5 10.8V15c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.2M21 9v5" /></S>
);
