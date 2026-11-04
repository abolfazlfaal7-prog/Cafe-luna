import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import AdminAuthForm from '@/components/admin/AdminAuthForm';
import AdminDashboard from '@/components/admin/AdminDashboard';

type Phase =
  | { kind: 'checking' }
  | { kind: 'error' }
  | { kind: 'setup' }
  | { kind: 'login' }
  | { kind: 'authenticated'; password: string };

export default function AdminPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .status()
      .then((configured) => {
        if (!cancelled) setPhase({ kind: configured ? 'login' : 'setup' });
      })
      .catch((error) => {
        console.error('admin status check failed', error);
        if (!cancelled) setPhase({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const handleAuthSubmit = async (password: string) => {
    if (phase.kind === 'setup') {
      await adminApi.setup(password);
    } else {
      await adminApi.login(password);
    }
    setPhase({ kind: 'authenticated', password });
  };

  if (phase.kind === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <Loader2 className="h-6 w-6 animate-spin text-forest-700" aria-label="در حال بارگذاری" />
      </div>
    );
  }

  if (phase.kind === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100 px-6 text-center">
        <p className="font-bold text-forest-900">اتصال به پنل مدیریت برقرار نشد.</p>
        <button
          type="button"
          onClick={() => {
            setPhase({ kind: 'checking' });
            setAttempt((n) => n + 1);
          }}
          className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (phase.kind === 'setup' || phase.kind === 'login') {
    return <AdminAuthForm mode={phase.kind} onSubmit={handleAuthSubmit} />;
  }

  return (
    <AdminDashboard
      password={phase.password}
      onLogout={() => setPhase({ kind: 'login' })}
    />
  );
}
