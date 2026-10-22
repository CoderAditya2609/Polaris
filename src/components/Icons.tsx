import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 3.5c1 11.1 9.4 19.5 20.5 20.5C33.4 25 25 33.4 24 44.5 23 33.4 14.6 25 3.5 24 14.6 23 23 14.6 24 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function JournalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      <path d="m15 5 3 3" />
      <path d="M19 14.5V19a2 2 0 0 1-2 2H6" opacity=".55" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8 14h2M14 14h2M8 17.2h2" opacity=".65" />
    </Svg>
  );
}

export function PolaroidIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 15.5 8 11l4.5 4.5L15.5 12l5.5 5" />
      <circle cx="8.6" cy="8.4" r="1.4" />
    </Svg>
  );
}

export function InsightsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19.5V13M9.3 19.5V7.5M14.7 19.5v-9M20 19.5V4.5" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.1 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.3 9v.03a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.6" />
      <path d="m16 16 4.4 4.4" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.7" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
      <circle cx="12" cy="15.3" r="1" />
      <path d="M12 16.5v1.4" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8.5h2.4L8 5.8h8l1.6 2.7H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5Z" />
      <circle cx="12" cy="13.6" r="3.2" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.3 4.3L19 7" />
    </Svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 16V4.5M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15.5v2.7A2.3 2.3 0 0 0 6.8 20.5h10.4a2.3 2.3 0 0 0 2.3-2.3v-2.7" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.5V16M7.5 11.5 12 16l4.5-4.5" />
      <path d="M4.5 15.5v2.7A2.3 2.3 0 0 0 6.8 20.5h10.4a2.3 2.3 0 0 0 2.3-2.3v-2.7" />
    </Svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.3 13.7a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M13.7 10.3a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </Svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.7" cy="6.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="4.7" cy="12" r=".9" fill="currentColor" stroke="none" />
      <circle cx="4.7" cy="17.5" r=".9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function OrderedListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 6.5h10M10 12h10M10 17.5h10" />
      <path d="M4.2 4.8h1v3.4M3.9 11h1.7l-1.7 2h1.8M3.9 15.9h1.4a.9.9 0 0 1 0 1.8H4v.1h1.3a.9.9 0 0 1 0 1.8H3.9" />
    </Svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 6.5C6.5 8 5 10.4 5 13.4c0 2.2 1.2 3.6 3 3.6 1.6 0 2.7-1.1 2.7-2.6 0-1.4-1-2.4-2.3-2.4-.3 0-.6 0-.8.1.3-1.3 1.2-2.4 2.6-3.2ZM19 6.5c-3 1.5-4.5 3.9-4.5 6.9 0 2.2 1.2 3.6 3 3.6 1.6 0 2.7-1.1 2.7-2.6 0-1.4-1-2.4-2.3-2.4-.3 0-.6 0-.8.1.3-1.3 1.2-2.4 2.6-3.2Z" />
    </Svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 7.5H5v-4" />
      <path d="M5 7.5 8.6 4A8 8 0 1 1 4.4 14" transform="translate(1.5 1.5)" />
    </Svg>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 7.5h4v-4" />
      <path d="M19 7.5 15.4 4A8 8 0 1 0 19.6 14" transform="translate(-1.5 1.5)" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15M9 7V4.8h6V7M7 7l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" opacity=".6" />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.5M6.7 6.8A16.8 16.8 0 0 0 2.5 12s3.5 6 9.5 6a9.4 9.4 0 0 0 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="4.2" />
      <path d="m11 11 8.5 8.5M16 16l2.3-2.3M18.5 18.5 21 16" />
    </Svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c.6 5 3.9 8.4 9 9-5.1.6-8.4 4-9 9-.6-5-3.9-8.4-9-9 5.1-.6 8.4-4 9-9Z" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.8c2.6 1 5.1 1.6 7.5 1.7v6.2c0 4.8-3 8.2-7.5 10.5-4.5-2.3-7.5-5.7-7.5-10.5V4.5c2.4-.1 4.9-.7 7.5-1.7Z" />
      <path d="m8.8 11.8 2.2 2.2 4.4-4.4" />
    </Svg>
  );
}
