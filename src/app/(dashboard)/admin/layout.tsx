'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { airtableUser } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (airtableUser && airtableUser.fields.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [airtableUser, router]);

  if (!airtableUser || airtableUser.fields.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
} 