"use client";
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-8 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-150"
    >
      Logout
    </button>
  );
} 