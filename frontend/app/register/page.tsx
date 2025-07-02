'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RESTAURANT_DOMAIN = process.env.NEXT_PUBLIC_RESTAURANT_DOMAIN || 'mydemo.com';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').refine(
    (val) => val.endsWith(`@${RESTAURANT_DOMAIN}`),
    { message: `Email must be a @${RESTAURANT_DOMAIN} address` }
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),  
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    setSuccess(false);
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        reset();
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setServerError(result.error || 'Registration failed. Please try again.');
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
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {serverError && <p className="text-red-500 text-center mb-4">{serverError}</p>}
        {success && <p className="text-green-600 text-center mb-4">Registration successful! You can now log in.</p>}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Name
          </label>
          <input
            {...register('name')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-900 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Your name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Email
          </label>
          <input
            {...register('email')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-900 leading-tight focus:outline-none focus:shadow-outline"
            type="email"
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
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-900 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            placeholder="********"
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
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
              Registering...
            </span>
          ) : (
            'Register'
          )}
        </Button>
      </form>
    </main>
  );
} 