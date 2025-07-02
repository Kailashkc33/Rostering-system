"use client";
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Roster {
  id: string;
  weekStart: string;
  status: string;
  shiftCount: number;
  createdBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function RosterListPage() {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRosters = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token not found');
        }
        const res = await fetch('http://localhost:3000/api/rosters', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setRosters(data.rosters);
        } else {
          setError(data.error || 'Failed to fetch rosters');
        }
      } catch (err) {
        setError('Failed to fetch rosters');
      } finally {
        setLoading(false);
      }
    };
    fetchRosters();
  }, []);

  // Toast handler
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ProtectedRoute allowedRole="ADMIN">
      <div className="max-w-5xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rosters</h1>
          <Button onClick={() => router.push('/dashboard/admin/roster/create')}>Create New Roster</Button>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : rosters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No rosters found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900 rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Week Start</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Shift Count</th>
                  <th className="px-4 py-2 text-left">Created By</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rosters.map((roster) => (
                  <tr key={roster.id} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="px-4 py-2">{new Date(roster.weekStart).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <select
                        value={roster.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          setRosters((prev) => prev.map(r => r.id === roster.id ? { ...r, status: newStatus } : r));
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`http://localhost:3000/api/rosters/${roster.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ status: newStatus }),
                            });
                            if (res.ok) {
                              showToast('success', 'Status updated successfully!');
                            } else {
                              const data = await res.json();
                              showToast('error', data.error || 'Failed to update status');
                            }
                          } catch (err) {
                            showToast('error', 'Failed to update status');
                          }
                        }}
                        className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">{roster.shiftCount}</td>
                    <td className="px-4 py-2">{roster.createdBy?.name || roster.createdBy?.email}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/roster/${roster.id}`)}>View/Edit</Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        if (!window.confirm('Copy this roster to the next week?')) return;
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`http://localhost:3000/api/rosters/${roster.id}/copy`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) {
                            showToast('success', 'Roster copied successfully!');
                            // Refresh the list
                            window.location.reload();
                          } else {
                            const data = await res.json();
                            showToast('error', data.error || 'Failed to copy roster');
                          }
                        } catch (err) {
                          showToast('error', 'Failed to copy roster');
                        }
                      }}>Copy</Button>
                      <Button variant="destructive" size="sm" onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete this roster?')) return;
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`http://localhost:3000/api/rosters/${roster.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) {
                            setRosters(prev => prev.filter(r => r.id !== roster.id));
                            showToast('success', 'Roster deleted successfully!');
                          } else {
                            const data = await res.json();
                            showToast('error', data.error || 'Failed to delete roster');
                          }
                        } catch (err) {
                          showToast('error', 'Failed to delete roster');
                        }
                      }}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Toast notification */}
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-semibold text-white transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 