import { AppHeader } from '@/components/layout/app-header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppHeader />
      <main className="pb-20 sm:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
