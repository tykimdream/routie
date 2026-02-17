'use client';

import Link from 'next/link';
import { CompassIcon } from '@/components/icons';

interface AppHeaderProps {
  title?: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function AppHeader({ title, backHref, rightAction }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-sand-200/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 transition-colors text-sand-600"
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          ) : (
            <Link href="/trips" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[6px] flex items-center justify-center">
                <CompassIcon size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold text-sand-800">Routie</span>
            </Link>
          )}
          {title && (
            <h1 className="text-base font-semibold text-sand-800">{title}</h1>
          )}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}
