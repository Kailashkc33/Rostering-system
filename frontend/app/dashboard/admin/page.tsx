import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminDashboardHome() {
  return (
    <ProtectedRoute allowedRole="ADMIN">
      <div>
        <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">Use the navigation on the left to manage the restaurant, staff, and payroll.</p>
        <p className="text-gray-500 dark:text-gray-400">Select a section to get started.</p>
      </div>
    </ProtectedRoute>
  );
} 