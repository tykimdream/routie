'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CompassIcon } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';

interface AppHeaderProps {
  title?: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function AppHeader({ title, backHref, rightAction }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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

        <div className="flex items-center gap-2">
          {rightAction && <div>{rightAction}</div>}

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                {user.name?.charAt(0).toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[12px] shadow-lg border border-sand-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-sand-100">
                    <p className="text-sm font-semibold text-sand-800 truncate">
                      {user.name || '여행자'}
                    </p>
                    <p className="text-xs text-sand-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
