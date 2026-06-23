import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { signIn } from '@/store/slices/authSlice';
import { cn } from '@/utils/cn';
import { getHomePage } from '@/constants/navigation';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);
    try {
      await dispatch(signIn({ username: data.username, password: data.password })).unwrap();
      const queryRedirect = searchParams.get('redirectURL');
      const target = queryRedirect ? decodeURIComponent(queryRedirect) : getHomePage();
      setTimeout(() => navigate(target, { replace: true }), 300);
    } catch (err: unknown) {
      setError(typeof err === 'string' ? err : 'Something went wrong. Please try again after some time.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="mb-1.5 text-2xl font-bold text-white">Sign in to your account</h2>
        <p className="mb-8 text-md text-slate-400">Enter your credentials to continue</p>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-md text-red-400">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-md font-medium text-slate-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              {...register('username')}
              className={cn(
                'h-12 w-full rounded-xl border px-4 text-md text-white',
                'bg-white/[0.06] shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]',
                'transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                errors.username
                  ? 'border-red-500/50'
                  : 'border-white/[0.15] focus:border-blue-400/60 focus:bg-white/[0.08]'
              )}
            />
            {errors.username && <p className="mt-1.5 text-md text-red-400">{errors.username.message}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-md font-medium text-slate-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-md text-blue-400 hover:text-blue-300 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                {...register('password')}
                className={cn(
                  'h-12 w-full rounded-xl border px-4 pr-11 text-md text-white',
                  'bg-white/[0.06] shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]',
                  'transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                  errors.password
                    ? 'border-red-500/50'
                    : 'border-white/[0.15] focus:border-blue-400/60 focus:bg-white/[0.08]'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-md text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-md font-semibold transition-all duration-200',
              isLoading
                ? 'cursor-not-allowed bg-slate-600 opacity-60'
                : 'cursor-pointer bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/40 active:scale-[0.98]'
            )}
            style={{ color: '#FFFFFF', border: 'none' }}
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
