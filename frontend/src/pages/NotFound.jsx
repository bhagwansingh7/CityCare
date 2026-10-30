import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-5xl font-semibold text-blue-600">404</p>
      <p className="text-slate-600">We could not find that page.</p>
      <Link to="/" className="btn-primary">Go to my dashboard</Link>
    </div>
  );
}
