"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ViewStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not found");
        const res = await fetch("http://localhost:3000/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStaff(data.staff);
        } else {
          setError(data.error || "Failed to fetch staff");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch staff");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <ProtectedRoute allowedRole="ADMIN">
      <div className="max-w-3xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Staff Members</h1>
          <span className="text-gray-600 dark:text-gray-300">
            Total: <b>{staff.length}</b>
          </span>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No staff found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900 rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="px-4 py-2">{member.name}</td>
                    <td className="px-4 py-2">{member.email}</td>
                    <td className="px-4 py-2">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 