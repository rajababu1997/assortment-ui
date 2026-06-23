import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { signOut } from '@/store/slices/authSlice';

export default function SignOutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await dispatch(signOut());
      navigate('/sign-in', { replace: true });
    })();
  }, [dispatch, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-on-secondary">Signing out…</p>
    </div>
  );
}
