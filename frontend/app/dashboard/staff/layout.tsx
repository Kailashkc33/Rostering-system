"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from '@/components/LogoutButton';

const navItems = [
  { name: 'Upcoming Shifts', href: '/dashboard/staff/shifts' },
  { name: 'Clock In/Out', href: '/dashboard/staff/clock' },
  { name: 'Work Hours', href: '/dashboard/staff/hours' },
  { name: 'Personal Profile', href: '/dashboard/staff/profile' },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile toggle button: only show when sidebar is closed */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 focus:outline-none md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Show sidebar"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex-col min-h-screen pt-0 md:pt-8">
        <h2 className="text-xl font-bold mb-8">Staff Dashboard</h2>
        <nav className="flex flex-col gap-4 w-full">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg font-medium transition-colors duration-150 w-full text-left ${
                pathname === item.href
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-orange-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay background */}
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col min-h-full h-full pt-16 md:pt-0">
            {/* Close (cross) button, only visible when sidebar is open */}
            <button
              className="absolute top-4 right-4 p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-8">Staff Dashboard</h2>
            <nav className="flex flex-col gap-4 w-full">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors duration-150 w-full text-left ${
                    pathname === item.href
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-orange-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <LogoutButton />
          </aside>
        </div>
      )}
      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-950 transition-all duration-200 pt-16 md:pt-8">{children}</main>
    </div>
  );
} 