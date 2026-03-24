import React, { useState, useEffect } from 'react';
import { Clock, Search, Plus, Edit2, X, Loader2, LogIn, LogOut } from 'lucide-react';
import { attendanceApi } from '../api/attendanceApi';
import { staffApi } from '../api/staffApi';
import { usePermission } from '../hooks/usePermission';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const formatTime = (t) => {
  if (!t) return '—';
  const parts = String(t).split(':');
  if (parts.length < 2) return t;
  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_user_id: '', work_date: '', time_in: '', time_out: '' });
  const { can, isOwner, isHR } = usePermission();

  const getDefaultRange = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: format(from, 'yyyy-MM-dd'),
      to: format(now, 'yyyy-MM-dd'),
    };
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const defaults = getDefaultRange();
      const params = {
        from: dateFrom || defaults.from,
        to: dateTo || defaults.to,
      };

      if (can('attendance_view_all')) {
        const { data } = await attendanceApi.hrList(params);
        setRecords(data.data || data || []);
      }

      const { data: myData } = await attendanceApi.getMyAttendance(params);
      setMyRecords(myData.data || myData || []);

      if (can('attendance_view_all')) {
        try {
          const { data: empData } = await staffApi.list();
          setEmployees(empData.data || empData || []);
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  const handleClockIn = async () => {
    try {
      await attendanceApi.clockInOut('clock_in');
      toast.success('Clocked in!');
      load();
    } catch {}
  };

  const handleClockOut = async () => {
    try {
      await attendanceApi.clockInOut('clock_out');
      toast.success('Clocked out!');
      load();
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await attendanceApi.hrCreate(form);
      toast.success('Attendance record created!');
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const displayRecords = tab === 'my' ? myRecords : records;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Clock In/Out - For users with attendance_view_own permission */}
      {can('attendance_view_own') && (
        <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(204,0,0,0.12)' }}>
              <Clock className="w-6 h-6" style={{ color: '#CC0000' }} />
            </div>
            <div>
              <p className="font-bold text-white">Quick Clock</p>
              <p className="text-xs" style={{ color: '#888' }}>{format(new Date(), 'EEEE, MMMM d, yyyy - h:mm a')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleClockIn} className="btn-primary flex items-center gap-2"><LogIn className="w-4 h-4" /> Clock In</button>
            <button onClick={handleClockOut} className="btn-secondary flex items-center gap-2"><LogOut className="w-4 h-4" /> Clock Out</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="flex rounded-lg p-1" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
            {can('attendance_view_all') && <button onClick={() => setTab('all')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" style={tab === 'all' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>All Staff</button>}
            <button onClick={() => setTab('my')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" style={tab === 'my' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>My Attendance</button>
          </div>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto text-xs" placeholder="From" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto text-xs" placeholder="To" />
          <button onClick={load} className="btn-secondary text-xs">Filter</button>
        </div>
        {can('attendance_view_all') && (
          <button onClick={() => { setForm({ employee_user_id: '', work_date: '', time_in: '', time_out: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <tr>
                {tab === 'all' && <th className="table-header">Employee</th>}
                <th className="table-header">Date</th>
                <th className="table-header">Time In</th>
                <th className="table-header">Time Out</th>
                <th className="table-header">Late (min)</th>
                <th className="table-header">Overtime (min)</th>
                <th className="table-header">Source</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((r, i) => (
                <tr key={r.id || i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {tab === 'all' && <td className="table-cell font-medium">{r.first_name ? `${r.first_name} ${r.last_name}` : `User #${r.employee_user_id}`}</td>}
                  <td className="table-cell">{r.work_date ? format(new Date(r.work_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="table-cell">{formatTime(r.time_in)}</td>
                  <td className="table-cell">{formatTime(r.time_out)}</td>
                  <td className="table-cell">{r.minutes_late > 0 ? <span className="font-medium" style={{ color: '#fbbf24' }}>{r.minutes_late}</span> : '0'}</td>
                  <td className="table-cell">{r.minutes_overtime > 0 ? <span className="font-medium" style={{ color: '#4ade80' }}>{r.minutes_overtime}</span> : '0'}</td>
                  <td className="table-cell"><span className="badge-gray">{r.source || 'manual'}</span></td>
                </tr>
              ))}
              {displayRecords.length === 0 && <tr><td colSpan="7" className="text-center py-8" style={{ color: '#555' }}>No attendance records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">Add Attendance Record</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
              ><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Employee *</label>
                <select value={form.employee_user_id} onChange={(e) => setForm({ ...form, employee_user_id: e.target.value })} className="input-field" required>
                  <option value="">Select employee...</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div><label className="label">Work Date *</label><input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Time In</label><input type="time" value={form.time_in} onChange={(e) => setForm({ ...form, time_in: e.target.value })} className="input-field" /></div>
                <div><label className="label">Time Out</label><input type="time" value={form.time_out} onChange={(e) => setForm({ ...form, time_out: e.target.value })} className="input-field" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
