'use client';

export const dynamic = 'force-dynamic';

import { ToastContainer, useToast } from '@/app/Toast';

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toasts, removeToast } = useToast();

  return (
    <div className="relative min-h-screen">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {children}
    </div>
  );
}