import { useAuth } from '../context/AuthContext';
import { BooBoo } from './ui/mascots';

export function AuthErrorScreen() {
  const { retryAuth } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <BooBoo size={120} />
          <span className="absolute -top-1 -right-3 text-2xl" aria-hidden="true">💧</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Moo... we can't reach the barn</h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Check your connection and try again — your data is safe.</p>
        <button
          type="button"
          onClick={retryAuth}
          className="mt-6 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white whitespace-nowrap shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
