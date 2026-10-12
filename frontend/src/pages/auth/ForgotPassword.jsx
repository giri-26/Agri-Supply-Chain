import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Loader2 } from 'lucide-react';
import { authApi } from '../../api/endpoints';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const { data } = await authApi.forgotPassword(email);
      setMessage(data.message);
      if (data.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white">
            <KeyRound size={22} />
          </div>
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">Reset your password</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your email and we'll generate a reset link.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-xl bg-brand-50 dark:bg-brand-900/30 px-4 py-2.5 text-sm text-brand-700 dark:text-brand-300">
            {message}
          </div>
        )}
        {devToken && (
          <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 break-all">
            LAN mode (no email server): reset token is{' '}
            <Link to={`/reset-password?token=${devToken}`} className="underline font-medium">
              {devToken}
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Send Reset Link
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
