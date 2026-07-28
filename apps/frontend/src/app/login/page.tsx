'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@stellarpay.dev');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = `demo.${btoa(`${email}:${password}`)}.token`;
    login(token, {
      id: 'demo-user',
      email,
      name: 'Demo User',
      role: 'admin',
    });

    router.replace('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/50">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">StellarPay</p>
          <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-neutral-400">Access the dashboard with a demo session.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-neutral-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-neutral-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none ring-0"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
