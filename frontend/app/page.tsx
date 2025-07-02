'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-100 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-[#FF6B35] dark:text-[#FFD166]">GrillTalk</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-orange-500" />}
          </Button>
          <Link href="/login" passHref>
            <Button className="bg-[#FF6B35] hover:bg-orange-600 text-white">Login</Button>
          </Link>
          <Link href="/register" passHref>
            <Button className="bg-[#FFD166] hover:bg-yellow-500 text-black">Register</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h2 className="text-4xl font-bold mb-4 text-[#FF6B35] dark:text-[#FFD166]">Simplify Rostering & Time Tracking</h2>
        <p className="text-lg max-w-xl mb-6">
          GrillTalk helps restaurant admins manage staff schedules, track hours, and calculate pay – all in one place.
        </p>
        <div className="flex gap-4">
          <Link href="/register" passHref>
            <Button size="lg" className="bg-[#FF6B35] hover:bg-orange-600 text-white">Get Started</Button>
          </Link>
          <Link href="/login" passHref>
            <Button size="lg" className="bg-white text-[#FF6B35] border border-orange-500 hover:bg-orange-100 dark:bg-gray-800 dark:text-[#FFD166] dark:border-[#FFD166] dark:hover:bg-gray-700">
              Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-orange-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white dark:bg-gray-700 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-[#FF6B35] dark:text-[#FFD166]">Auto Breaks</h3>
            <p className="text-sm">Automatically calculates breaks based on shift length (30 or 60 minutes).</p>
          </div>
          <div className="bg-white dark:bg-gray-700 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-[#FF6B35] dark:text-[#FFD166]">Live Clock-in Only (conflict demo)</h3>
            <p className="text-sm">Staff can clock in/out from secure, verified devices or locations.</p>
          </div>
          <div className="bg-white dark:bg-gray-700 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-[#FF6B35] dark:text-[#FFD166]">Pay Summary</h3>
            <p className="text-sm">View weekly work hours and auto-calculated wages per staff.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} GrillTalk. All rights reserved.
      </footer>
    </main>
  );
}
