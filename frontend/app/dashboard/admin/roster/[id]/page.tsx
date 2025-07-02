"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

type ShiftEdit = {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  notes?: string;
  [key: string]: any;
};

const STATUS_OPTIONS = ["DRAFT", "APPROVED", "ARCHIVED"];

export default function RosterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [shiftEdits, setShiftEdits] = useState<ShiftEdit>({ staffId: '', date: '', startTime: '', endTime: '', role: '', notes: '' });
  const [adding, setAdding] = useState(false);
  const [newShift, setNewShift] = useState({ staffId: "", date: "", startTime: "", endTime: "", role: "", notes: "" });
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    const fetchRoster = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/rosters/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setRoster(data.roster);
          setStatus(data.roster.status);
          setWeekStart(data.roster.weekStart?.slice(0, 10));
        } else {
          setError(data.error || "Failed to fetch roster");
        }
      } catch (err) {
        setError("Failed to fetch roster");
      } finally {
        setLoading(false);
      }
    };
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setStaffList(data.staff);
      } catch {}
    };
    if (id) {
      fetchRoster();
      fetchStaff();
    }
  }, [id]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/rosters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, weekStart }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoster((prev) => ({ ...prev, status, weekStart }));
        showToast("success", "Roster updated successfully!");
      } else {
        showToast("error", data.error || "Failed to update roster");
      }
    } catch (err) {
      showToast("error", "Failed to update roster");
    } finally {
      setSaving(false);
    }
  };

  const handleEditShift = (shift) => {
    setEditingShiftId(shift.id);
    setShiftEdits({ ...shift });
  };

  const handleShiftEditChange = (field, value) => {
    setShiftEdits((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveShift = async () => {
    // Validate required fields
    if (!shiftEdits.date || !shiftEdits.startTime || !shiftEdits.endTime) {
      showToast("error", "Date, start time, and end time are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Combine date and time into ISO strings
      // If startTime is already in HH:mm, combine with date
      const startISO = new Date(`${shiftEdits.date}T${shiftEdits.startTime}`).toISOString();
      const endISO = new Date(`${shiftEdits.date}T${shiftEdits.endTime}`).toISOString();
      // Prepare payload
      const payload = {
        ...shiftEdits,
        startTime: startISO,
        endTime: endISO,
      };
      const res = await fetch(`http://localhost:3000/api/shifts/${editingShiftId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setRoster((prev) => ({
          ...prev,
          shifts: prev.shifts.map((s) => (s.id === editingShiftId ? data.shift : s)),
        }));
        showToast("success", "Shift updated!");
        setEditingShiftId(null);
      } else {
        showToast("error", data.error || "Failed to update shift");
      }
    } catch (err) {
      showToast("error", "Failed to update shift");
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm("Delete this shift?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/shifts/${shiftId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRoster((prev) => ({ ...prev, shifts: prev.shifts.filter((s) => s.id !== shiftId) }));
        showToast("success", "Shift deleted");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to delete shift");
      }
    } catch (err) {
      showToast("error", "Failed to delete shift");
    }
  };

  const handleAddShift = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/rosters/${id}/shifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newShift),
      });
      const data = await res.json();
      if (res.ok) {
        setRoster((prev) => ({ ...prev, shifts: [...prev.shifts, data.shift] }));
        showToast("success", "Shift added!");
        setAdding(false);
        setNewShift({ staffId: "", date: "", startTime: "", endTime: "", role: "", notes: "" });
      } else {
        showToast("error", data.error || "Failed to add shift");
      }
    } catch (err) {
      showToast("error", "Failed to add shift");
    }
  };

  return (
    <ProtectedRoute allowedRole="ADMIN">
      <div className="max-w-3xl mx-auto mt-8">
        <Button variant="ghost" onClick={() => router.back()}>&larr; Back</Button>
        <h1 className="text-2xl font-bold mb-4">Roster Details</h1>
        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : !roster ? (
          <div className="py-8 text-center text-gray-500">Roster not found.</div>
        ) : (
          <>
            <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded shadow mb-8">
              <div>
                <label className="block font-medium mb-1">Week Start</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Created By</label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded">
                  {roster.createdBy?.name || roster.createdBy?.email}
                </div>
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </form>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Shifts</h2>
              <Button onClick={() => setAdding(true)}>Add Shift</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-900 rounded shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Staff</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Start Time</th>
                    <th className="px-4 py-2 text-left">End Time</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.shifts?.map((shift) => (
                    <tr key={shift.id} className="border-t border-gray-200 dark:border-gray-800">
                      {editingShiftId === shift.id ? (
                        <>
                          <td className="px-4 py-2">
                            <select value={shiftEdits.staffId} onChange={e => handleShiftEditChange('staffId', e.target.value)} className="border rounded px-2 py-1 w-full">
                              <option value="">Select</option>
                              {staffList.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2"><input type="date" value={shiftEdits.date?.slice(0,10) || ''} onChange={e => handleShiftEditChange('date', e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="px-4 py-2"><input type="time" value={shiftEdits.startTime?.slice(11,16) || ''} onChange={e => handleShiftEditChange('startTime', e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="px-4 py-2"><input type="time" value={shiftEdits.endTime?.slice(11,16) || ''} onChange={e => handleShiftEditChange('endTime', e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="px-4 py-2"><input type="text" value={shiftEdits.role || ''} onChange={e => handleShiftEditChange('role', e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="px-4 py-2 flex gap-2">
                            <Button size="sm" onClick={handleSaveShift}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingShiftId(null)}>Cancel</Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2">{shift.staff?.name || shift.staff?.email}</td>
                          <td className="px-4 py-2">{shift.date ? new Date(shift.date).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-2">{shift.startTime ? new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                          <td className="px-4 py-2">{shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                          <td className="px-4 py-2">{shift.role}</td>
                          <td className="px-4 py-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditShift(shift)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteShift(shift.id)}>Delete</Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {adding && (
                    <tr>
                      <td className="px-4 py-2">
                        <select value={newShift.staffId} onChange={e => setNewShift(s => ({ ...s, staffId: e.target.value }))} className="border rounded px-2 py-1 w-full">
                          <option value="">Select</option>
                          {staffList.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input type="date" value={newShift.date} onChange={e => setNewShift(s => ({ ...s, date: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                      <td className="px-4 py-2"><input type="time" value={newShift.startTime} onChange={e => setNewShift(s => ({ ...s, startTime: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                      <td className="px-4 py-2"><input type="time" value={newShift.endTime} onChange={e => setNewShift(s => ({ ...s, endTime: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                      <td className="px-4 py-2"><input type="text" value={newShift.role} onChange={e => setNewShift(s => ({ ...s, role: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                      <td className="px-4 py-2 flex gap-2">
                        <Button size="sm" onClick={handleAddShift}>Add</Button>
                        <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-semibold text-white transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 