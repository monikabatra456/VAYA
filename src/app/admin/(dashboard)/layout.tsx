import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/server';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata: Metadata = {
  title: 'VAYA Admin Panel',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();

  if (!auth.authenticated) {
    redirect('/admin/login');
  }

  return (
    <AdminLayoutClient userEmail={auth.user?.email || 'admin@vaya.travel'}>
      {children}
    </AdminLayoutClient>
  );
}
