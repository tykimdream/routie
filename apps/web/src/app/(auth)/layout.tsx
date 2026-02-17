'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CompassIcon } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/trips');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Minimal header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[8px] flex items-center justify-center">
            <CompassIcon size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-sand-800">Routie</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        {children}
      </main>

      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-secondary-100 rounded-full opacity-20 blur-3xl" />
      </div>
    </div>
  );
}
