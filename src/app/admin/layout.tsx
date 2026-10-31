import { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'VAYA Admin Panel',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="vaya-admin min-h-screen">{children}</div>;
}
