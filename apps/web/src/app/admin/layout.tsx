import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/admin/AdminShell';
import { AuthProvider } from '@/admin/AuthProvider';

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

// Segment séparé du site public : ce code n'est jamais chargé par un visiteur (§7).
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
