import { Link } from 'react-router-dom';
import { LogoMark } from './Icons';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Polaris — home">
      <span className="text-[var(--gold)]">
        <LogoMark className="h-9 w-9 drop-shadow-[0_0_12px_rgba(227,201,155,0.35)]" />
      </span>
      <span className={compact ? 'hidden sm:block' : 'block'}>
        <span className="block font-serif text-[27px] leading-none tracking-[0.02em] text-[var(--text)]">
          Polaris
        </span>
        <span className="mt-1 block font-serif text-[12.5px] leading-none text-[var(--muted)]">
          Same sky. New thoughts.
        </span>
      </span>
    </Link>
  );
}
