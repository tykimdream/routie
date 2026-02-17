'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RouteIcon, CompassIcon, PlusIcon } from '@/components/icons';

const navItems = [
  { href: '/trips', label: '홈', icon: CompassIcon },
  { href: '/trips/new', label: '새 여행', icon: PlusIcon, isAction: true },
  { href: '/routes', label: '경로', icon: RouteIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-sand-200 sm:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 -mt-5"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-primary-500">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary-500'
                  : 'text-sand-400 hover:text-sand-600'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area bottom padding for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
