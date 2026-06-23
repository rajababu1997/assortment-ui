import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { resetPasswordApi } from '@/services/authApi';
import { mustMatch, passwordSchema } from '@/utils/validators';
import { cn } from '@/utils/cn';

const schema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine(mustMatch('password', 'passwordConfirm'));

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);
    try {
      await resetPasswordApi(data.password);
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again after some time.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Reset password</h2>
        <p className="text-md text-slate-400 mb-8">
          Choose a new password for your account.
        </p>

        {success ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-base">Password reset successfully</p>
                <p className="text-base mt-0.5">
                  You can now sign in with your new password.
                </p>
              </div>
            </div>
            <Link
              to="/sign-in"
              className={cn(
                'block w-full text-center py-4 rounded-lg text-md font-semibold transition-all duration-200',
                'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                'hover:from-purple-700 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25',
              )}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-red-500/10 text-red-400 text-base border border-red-500/20">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {/* New password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-base font-medium text-slate-300 mb-2"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    {...register('password')}
                    className={cn(
                      'w-full px-4 py-3.5 pr-11 rounded-lg border bg-white/[0.05] text-white text-md',
                      'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors',
                      errors.password
                        ? 'border-red-500/50'
                        : 'border-white/10 focus:border-purple-500/50',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-base text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-base font-medium text-slate-300 mb-2"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="passwordConfirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    {...register('passwordConfirm')}
                    className={cn(
                      'w-full px-4 py-3.5 pr-11 rounded-lg border bg-white/[0.05] text-white text-md',
                      'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors',
                      errors.passwordConfirm
                        ? 'border-red-500/50'
                        : 'border-white/10 focus:border-purple-500/50',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="mt-1.5 text-base text-red-400">
                    {errors.passwordConfirm.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-4 rounded-lg text-md font-semibold transition-all duration-200',
                  'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                  'hover:from-purple-700 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                )}
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Reset password
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
