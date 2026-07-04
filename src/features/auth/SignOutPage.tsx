import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { signOut } from '@/store/slices/authSlice';
import { environment } from '@/config/environment';

export default function SignOutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const appTitle = environment.appTitle ?? 'Assortment';

  useEffect(() => {
    (async () => {
      await dispatch(signOut());
      navigate('/sign-in', { replace: true });
    })();
  }, [dispatch, navigate]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: '#f8fafc' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white px-10 py-12 text-center shadow-sm"
        style={{ borderColor: '#e5e7eb' }}
      >
        <div className="flex items-center justify-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              boxShadow: '0 0 10px rgba(96,165,250,0.35)',
            }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: '#64748b' }}
          >
            {appTitle}
          </span>
        </div>

        <h1
          className="mt-8 text-xl font-semibold"
          style={{ color: '#0f172a' }}
        >
          Signing you out
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: '#64748b' }}
        >
          Closing your session securely. You'll be redirected in a moment.
        </p>

        <div
          className="mt-8 h-[3px] overflow-hidden rounded-full"
          style={{ background: '#eef2f7' }}
        >
          <div className="signout-progress h-full" />
        </div>

        <p
          className="mt-8 text-[11px]"
          style={{ color: '#94a3b8' }}
        >
          For your safety, please close this window if you're on a shared device.
        </p>
      </div>

      <style>{`
        @keyframes signoutSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .signout-progress {
          width: 40%;
          background: linear-gradient(90deg, transparent, #60a5fa, #a78bfa, transparent);
          animation: signoutSlide 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
