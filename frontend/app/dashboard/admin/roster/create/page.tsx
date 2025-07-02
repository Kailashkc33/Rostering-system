'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar } from '../../../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover';
import { Button } from '../../../../../components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { createPortal } from 'react-dom';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Staff = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Shift = {
  start: string;
  end: string;
};

// PortalDropdown component
function PortalDropdown({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// Modal component
function TimePickerModal({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: string; onChange: (val: string) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 relative min-w-[320px]">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <TimePicker
          onChange={onChange}
          value={value}
          disableClock={false}
          clearIcon={null}
          clockIcon={null}
          format="HH:mm"
        />
      </div>
    </div>
  );
}

export default function RosterBoardPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roster, setRoster] = useState<Record<number, Record<string, Shift>>>({});
  const [validationErrors, setValidationErrors] = useState<{ staffId: number; day: string }[]>([]);
  const [formError, setFormError] = useState('');
  const [weekStart, setWeekStart] = useState<string>("");
  const [weekStartDate, setWeekStartDate] = useState<Date | undefined>(undefined);
  const [weekStartError, setWeekStartError] = useState('');
  const [openTimePicker, setOpenTimePicker] = useState<{ staffId: number; day: string; field: 'start' | 'end' } | null>(null);
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number; height: number }>({ top: 0, left: 0, height: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPicker, setModalPicker] = useState<{ staffId: number; day: string; field: 'start' | 'end' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    fetch('http://localhost:3000/api/staff', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const staff = data.staff || [];
        setStaffList(staff);

        const initialRoster: Record<number, Record<string, Shift>> = {};
        staff.forEach((s) => {
          initialRoster[s.id] = {};
          daysOfWeek.forEach((day) => {
            initialRoster[s.id][day] = { start: '', end: '' };
          });
        });
        setRoster(initialRoster);
      });
  }, []);

  const handleChange = (staffId: number, day: string, field: 'start' | 'end', value: string) => {
    setRoster((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [day]: {
          ...prev[staffId][day],
          [field]: value,
        },
      },
    }));
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setFormError('');
    setWeekStartError('');

    // Validate week start date
    if (!weekStartDate) {
      setWeekStartError('Please select a week start date.');
      return;
    }
    const weekStartISO = format(weekStartDate, 'yyyy-MM-dd');

    // Collect invalid cells
    const errors: { staffId: number; day: string }[] = [];
    staffList.forEach((staff) => {
      daysOfWeek.forEach((day) => {
        const shift = roster[staff.id]?.[day];
        if (shift) {
          const { start, end } = shift;
          if (start && end && start >= end) {
            errors.push({ staffId: staff.id, day });
          }
        }
      });
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setFormError('Please ensure all shift start times are before end times.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      // 1. Create the roster
      const res = await fetch('http://localhost:3000/api/rosters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weekStart: weekStartISO }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create roster');
      const rosterId = data.roster.id;
      // 2. Create all shifts
      const shiftPromises = [];
      staffList.forEach((staff) => {
        daysOfWeek.forEach((day) => {
          const shift = roster[staff.id]?.[day];
          if (shift && shift.start && shift.end) {
            shiftPromises.push(
              fetch(`http://localhost:3000/api/rosters/${rosterId}/shifts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  staffId: staff.id,
                  date: format(
                    new Date(weekStartDate.getTime() + daysOfWeek.indexOf(day) * 24 * 60 * 60 * 1000),
                    'yyyy-MM-dd'
                  ),
                  startTime: `${weekStartISO}T${shift.start}`,
                  endTime: `${weekStartISO}T${shift.end}`,
                  role: staff.role,
                  notes: '',
                }),
              })
            );
          }
        });
      });
      const shiftResults = await Promise.all(shiftPromises);
      const shiftErrors = [];
      for (let i = 0; i < shiftResults.length; i++) {
        if (!shiftResults[i].ok) {
          const errData = await shiftResults[i].json();
          shiftErrors.push(errData.error || 'Failed to create shift');
        }
      }
      if (shiftErrors.length > 0) {
        showToast('error', 'Some shifts failed to save.');
        setSaving(false);
        return;
      }
      showToast('success', 'Roster created successfully!');
      setTimeout(() => router.push('/dashboard/admin/roster'), 1200);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create roster');
      setSaving(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Weekly Roster Board</h2>
      {/* Top flex container for week start date picker */}
      <div className="w-full max-w-6xl flex items-center justify-start mb-4">
        <div className="flex flex-col items-start">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="weekStart">
            Week Start Date <span className="text-red-500">*</span>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-60 justify-start text-left font-normal",
                  !weekStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {weekStartDate ? format(weekStartDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={weekStartDate}
                onSelect={(date) => {
                  setWeekStartDate(date ?? undefined);
                  setWeekStart(date ? format(date, 'yyyy-MM-dd') : "");
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {weekStartError && <span className="text-red-500 text-xs mt-1">{weekStartError}</span>}
        </div>
      </div>
      <form 
        onSubmit={handleSubmit} 
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // Try to move to the next input if possible
            const form = e.currentTarget;
            const elements = Array.from(form.querySelectorAll('input, select, button, textarea'));
            const index = elements.indexOf(document.activeElement as HTMLElement);
            if (index > -1 && index < elements.length - 1) {
              (elements[index + 1] as HTMLElement).focus();
            }
          }
        }}
        className="w-full max-w-6xl"
      >
        {formError && (
          <div className="mb-4 text-red-600 text-center font-semibold">{formError}</div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-700">
            <thead>
              <tr>
                <th className="p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-left sticky left-0 z-10 bg-white dark:bg-gray-900">Staff</th>
                <th colSpan={daysOfWeek.length} className="p-0">
                  <div className="flex min-w-[700px] md:min-w-[900px] lg:min-w-[1100px] flex-nowrap">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex-1 min-w-[120px] p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-center font-semibold">
                        {day}
                      </div>
                    ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td className="p-2 border-b border-gray-200 dark:border-gray-700 font-semibold sticky left-0 z-10 bg-white dark:bg-gray-900">{staff.name}</td>
                  <td colSpan={daysOfWeek.length} className="p-0">
                    <div className="flex min-w-[700px] md:min-w-[900px] lg:min-w-[1100px] flex-nowrap">
                      {daysOfWeek.map((day) => {
                        const isInvalid = validationErrors.some(
                          (err) => err.staffId === staff.id && err.day === day
                        );
                        return (
                          <div
                            key={day}
                            className={`flex-1 min-w-[120px] p-2 border-b border-gray-200 dark:border-gray-700 ${isInvalid ? 'bg-red-100 dark:bg-red-900' : ''}`}
                          >
                            <div className="flex flex-col gap-1">
                              {['start', 'end'].map((field) => (
                                <div key={field} className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={roster[staff.id]?.[day]?.[field as 'start' | 'end'] || ''}
                                    onChange={e => handleChange(staff.id, day, field as 'start' | 'end', e.target.value)}
                                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 w-32"
                                    aria-label={`Shift ${field}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-gradient-to-r from-red-400 via-red-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:from-red-500 hover:to-orange-600 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Roster'}
        </button>
      </form>
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-semibold text-white transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
