import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">Page not found</p>
      <Link to="/" className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
        Go home
      </Link>
    </div>
  );
}
