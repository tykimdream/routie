import { AppHeader } from '@/components/layout/app-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--background)]">
        <AppHeader />
        <main className="pb-20 sm:pb-0">{children}</main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
