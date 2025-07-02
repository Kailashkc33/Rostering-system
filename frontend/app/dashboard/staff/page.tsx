import ProtectedRoute from '@/components/ProtectedRoute';

export default function StaffDashboardHome() {
  return (
    <ProtectedRoute allowedRole="STAFF">
      <div>
        <h1 className="text-3xl font-bold mb-4">Welcome to the Staff Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">Use the navigation on the left to view your shifts, clock in/out, and see your work hours.</p>
        <p className="text-gray-500 dark:text-gray-400">Select a section to get started.</p>
      </div>
    </ProtectedRoute>
  );
} 