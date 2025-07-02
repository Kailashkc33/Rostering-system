'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const [serverError, setServerError] = useState('');
  const router = useRouter();

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'ADMIN') {
          router.replace('/dashboard/admin');
        } else if (payload.role === 'STAFF') {
          router.replace('/dashboard/staff');
        }
      } catch {
        // Invalid token, do nothing
      }
    }
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Store JWT in localStorage (for demo; use httpOnly cookies for production)
        localStorage.setItem('token', result.token);
        // Redirect based on role
        if (result.user.role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else if (result.user.role === 'STAFF') {
          router.push('/dashboard/staff');
        } else {
          router.push('/dashboard'); // fallback
        }
      } else {
        setServerError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setServerError('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {serverError && <p className="text-red-500 text-center mb-4">{serverError}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Email
          </label>
          <input
            {...register('email')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-900 leading-tight focus:outline-none focus:shadow-outline"
            type="email"
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Password
          </label>
          <input
            {...register('password')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-900 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            placeholder="********"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="flex justify-end mb-4">
          <Link href="/forgot-password" className="text-sm text-orange-600 hover:underline dark:text-orange-400">
            Forgot Password?
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-red-400 via-red-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:from-red-500 hover:to-orange-600 hover:scale-105 transition-all duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Logging in...
            </span>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </main>
  );
} 