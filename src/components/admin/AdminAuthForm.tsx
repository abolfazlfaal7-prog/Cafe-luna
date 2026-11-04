import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import LunaLogo from '@/components/brand/LunaLogo';

type AdminAuthFormProps = {
  mode: 'setup' | 'login';
  onSubmit: (password: string) => Promise<void>;
};

const MIN_PASSWORD_LENGTH = 6;

export default function AdminAuthForm({ mode, onSubmit }: AdminAuthFormProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSetup = mode === 'setup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`رمز عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.`);
      return;
    }
    if (isSetup && password !== confirmation) {
      setError('تکرار رمز عبور با رمز عبور یکسان نیست.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ورود انجام نشد. لطفاً دوباره تلاش کنید.');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-cream-100 px-4 py-3 text-forest-900 ring-1 ring-forest-900/10 outline-none transition placeholder:text-stone-500 focus:ring-2 focus:ring-caramel-500';

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md animate-scale-in rounded-3xl bg-cream-50 p-8 shadow-xl shadow-forest-900/10 ring-1 ring-forest-900/5 sm:p-10">
        <LunaLogo variant="inline" className="justify-center" />
        <div className="mt-8 flex items-center gap-2 text-forest-900">
          <Lock className="h-4 w-4 text-caramel-600" aria-hidden="true" />
          <h1 className="text-xl font-bold">{isSetup ? 'تنظیم رمز عبور مدیریت' : 'ورود به پنل مدیریت'}</h1>
        </div>
        <p className="mt-2 text-sm leading-[1.7] text-stone-600">
          {isSetup
            ? 'این اولین ورود است. رمز عبوری انتخاب کنید که فقط شما آن را بدانید.'
            : 'برای مدیریت منو، رمز عبور خود را وارد کنید.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-forest-800">رمز عبور</span>
            <div className="relative">
              <input
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                className={`${inputClass} pe-12 text-left`}
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'}
                className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-stone-600 transition hover:bg-forest-900/5"
              >
                {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </label>

          {isSetup && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-forest-800">تکرار رمز عبور</span>
              <input
                type={visible ? 'text' : 'password'}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                className={`${inputClass} text-left`}
                dir="ltr"
                required
              />
            </label>
          )}

          {error && (
            <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-xl bg-forest-900 px-4 py-3.5 font-bold text-cream-50 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'در حال بررسی...' : isSetup ? 'ذخیره و ورود' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}
