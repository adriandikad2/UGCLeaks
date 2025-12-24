'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { hasAccess } from '@/lib/auth';
import { ToastContainer, useToast } from '@/app/Toast';

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Check if user has editor access - only redirect once
    if (!hasAccess('editor') && !redirectedRef.current) {
      redirectedRef.current = true;
      addToast('You do not have permission to access the schedule dashboard', 'error');
      router.push('/');
    }
  }, [router, addToast]);

  if (!hasAccess('editor')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {children}
    </>
  );
}
