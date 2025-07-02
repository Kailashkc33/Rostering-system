'use client';
import { useEffect, useState } from 'react';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
  staff?: { id: string; name: string; email: string };
}

interface Roster {
  id: string;
  weekStart: string;
  status: string;
  shifts: Shift[];
}

export default function StaffRosters() {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRosters = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in to view your rosters.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/api/rosters/my', {
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Approved Rosters</h1>
      {loading ? (
        <div className="py-8 text-center">Loading...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : rosters.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No approved rosters found.</div>
      ) : (
        <div className="space-y-8">
          {rosters.map((roster) => (
            <div key={roster.id} className="bg-white dark:bg-gray-900 rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-2">
                Week Starting: {new Date(roster.weekStart).toLocaleDateString()}
              </h2>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Start</th>
                    <th className="px-2 py-1 text-left">End</th>
                    <th className="px-2 py-1 text-left">Role</th>
                    <th className="px-2 py-1 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.shifts.map((shift) => (
                    <tr key={shift.id} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-2 py-1">{shift.date ? new Date(shift.date).toLocaleDateString() : ''}</td>
                      <td className="px-2 py-1">{shift.startTime ? new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                      <td className="px-2 py-1">{shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                      <td className="px-2 py-1">{shift.role || ''}</td>
                      <td className="px-2 py-1">{shift.notes || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 