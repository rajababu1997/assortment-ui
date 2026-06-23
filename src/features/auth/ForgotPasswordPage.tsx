import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { forgotPasswordApi } from '@/services/authApi';
import { cn } from '@/utils/cn';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      await forgotPasswordApi(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 404
          ? 'No account found with that email address.'
          : 'Something went wrong. Please try again after some time.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <Link
          to="/sign-in"
          className="inline-flex items-center gap-1.5 text-base text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to sign in
        </Link>

        <h2 className="text-3xl font-bold text-white mb-2">Forgot password?</h2>
        <p className="text-md text-slate-400 mb-8">Enter your email address and we&rsquo;ll send you a reset link.</p>

        {success ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-base">Check your email</p>
              <p className="text-base mt-0.5">We&rsquo;ve sent a password reset link to your inbox.</p>
            </div>
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
              <div>
                <label htmlFor="email" className="block text-base font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-lg border bg-white/[0.05] text-white text-md',
                    'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors',
                    errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-purple-500/50'
                  )}
                />
                {errors.email && <p className="mt-1.5 text-base text-red-400">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-4 rounded-lg text-md font-semibold transition-all duration-200',
                  'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                  'hover:from-purple-700 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Send reset link
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
