import AdminResetPanel from '@/components/AdminResetPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontrol · Alma2086',
  robots: 'noindex, nofollow',
};

export default function AdminResetPage() {
  return <AdminResetPanel />;
}
