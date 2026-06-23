import { useAppSelector } from '@/hooks/useAppSelector';

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <dt className="text-on-secondary">Username</dt>
          <dd className="col-span-2">{user.userName}</dd>
          <dt className="text-on-secondary">Email</dt>
          <dd className="col-span-2">{user.email ?? '—'}</dd>
          <dt className="text-on-secondary">First name</dt>
          <dd className="col-span-2">{user.firstName ?? '—'}</dd>
          <dt className="text-on-secondary">Last name</dt>
          <dd className="col-span-2">{user.lastName ?? '—'}</dd>
          <dt className="text-on-secondary">Role</dt>
          <dd className="col-span-2">{user.role ?? '—'}</dd>
        </dl>
      </div>
    </div>
  );
}
