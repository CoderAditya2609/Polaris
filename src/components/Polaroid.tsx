import { useEffect, useState, type CSSProperties } from 'react';
import { useData } from '../context/DataContext';
import { formatShortDate } from '../lib/date';
import { CameraIcon, TrashIcon } from './Icons';

export function PhotoThumb({ date, className = '' }: { date: string; className?: string }) {
  const { getPhotoUrl } = useData();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    void getPhotoUrl(date).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [date, getPhotoUrl]);

  if (!src) return <div className={`animate-pulse bg-[#1a1622] ${className}`} />;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`object-cover ${className}`}
      draggable={false}
    />
  );
}

interface PolaroidCardProps {
  date: string;
  hasPhoto: boolean;
  src: string | null;
  onAdd: () => void;
  onRemove: () => void;
}

export function PolaroidCard({ date, hasPhoto, src, onAdd, onRemove }: PolaroidCardProps) {
  return (
    <div className="polaroid group w-[240px] shrink-0 -rotate-[4deg] sm:w-[268px]">
      <div
        className="polaroid-photo cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={hasPhoto ? "Replace today's photo" : "Add today's photo"}
        onClick={onAdd}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onAdd();
          }
        }}
      >
        {src ? (
          <img
            src={src}
            alt="Today's polaroid"
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : hasPhoto ? (
          <div className="h-full w-full animate-pulse bg-[#1c1824]" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-[#b3a58f]">
            <CameraIcon className="h-9 w-9 opacity-80" />
            <span className="text-[13px] tracking-wide">Add today&rsquo;s photo</span>
          </div>
        )}

        {hasPhoto ? (
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/70 via-black/0 to-transparent p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              title="Replace photo"
              aria-label="Replace photo"
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur transition-colors hover:bg-black/65"
            >
              <CameraIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Remove photo"
              aria-label="Remove photo"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur transition-colors hover:bg-black/65"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="polaroid-date">{formatShortDate(date)}</span>
        {hasPhoto ? (
          <span className="font-serif text-[12px] italic text-[#8a7a63]">one a day</span>
        ) : null}
      </div>
    </div>
  );
}

export function PolaroidNote() {
  return (
    <div className="hidden select-none items-start gap-1 pt-16 sm:flex">
      <svg
        viewBox="0 0 88 46"
        className="mt-1 h-11 w-20 text-[var(--gold)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M82 38C58 42 34 35 19 17" />
        <path d="m17 16 8 2.4M17 16l1.4 8" />
      </svg>
      <p className="whitespace-nowrap font-hand text-[26px] leading-[1.15] text-[var(--gold)]">
        One photo.
        <br />
        Every day.
      </p>
    </div>
  );
}

export function WallPolaroid({
  date,
  tilt,
  onOpen,
}: {
  date: string;
  tilt: number;
  onOpen: () => void;
}) {
  const { getPhotoUrl } = useData();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getPhotoUrl(date).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [date, getPhotoUrl]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="polaroid tilted w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
      aria-label={`Open entry for ${formatShortDate(date)}`}
    >
      <div className="polaroid-photo">
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-[#1c1824]" />
        )}
      </div>
      <div className="mt-3 flex items-end justify-between px-1">
        <span className="polaroid-date">{formatShortDate(date)}</span>
      </div>
    </button>
  );
}
