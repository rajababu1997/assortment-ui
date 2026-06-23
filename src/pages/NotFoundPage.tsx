import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4 text-center">
      <h1 className="text-5xl font-bold text-primary">404</h1>
      <p className="mt-2 text-lg">Page not found</p>
      <Link to="/" className="mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-contrast hover:opacity-90">
        Go home
      </Link>
    </div>
  );
}
