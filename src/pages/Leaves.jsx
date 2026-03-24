import React, { useState, useEffect } from 'react';
import { Plus, Check, X as XIcon, Loader2, CalendarOff, Eye } from 'lucide-react';
import { leaveApi } from '../api/leaveApi';
import { usePermission } from '../hooks/usePermission';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LEAVE_TYPES = ['vacation', 'sick', 'emergency', 'maternity', 'paternity', 'special'];
const statusColors = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-gray' };

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leave_type: 'vacation', start_date: '', end_date: '', reason: '' });
  const { can } = usePermission();

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = can('leave_approve') ? await leaveApi.list(params) : await leaveApi.myLeaves();
      setLeaves(data.data || data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leaveApi.apply(form);
      toast.success('Leave request submitted!');
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleDecide = async (id, action) => {
    try {
      await leaveApi.decide(id, action);
      toast.success(`Leave ${action}d!`);
      load();
    } catch {}
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); }} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={filter === f ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {can('leave_apply') && (
          <button onClick={() => { setForm({ leave_type: 'vacation', start_date: '', end_date: '', reason: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><tr>
              {can('leave_approve') && <th className="table-header">Employee</th>}
              <th className="table-header">Type</th>
              <th className="table-header">Start</th>
              <th className="table-header">End</th>
              <th className="table-header">Days</th>
              <th className="table-header">Reason</th>
              <th className="table-header">Status</th>
              <th className="table-header text-right">View</th>
              {can('leave_approve') && <th className="table-header text-right">Actions</th>}
            </tr></thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {can('leave_approve') && <td className="table-cell font-medium">{l.first_name ? `${l.first_name} ${l.last_name}` : `#${l.employee_user_id}`}</td>}
                  <td className="table-cell"><span className="badge-info">{l.leave_type}</span></td>
                  <td className="table-cell">{l.start_date ? format(new Date(l.start_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="table-cell">{l.end_date ? format(new Date(l.end_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="table-cell">{l.days || calculateDays(l.start_date, l.end_date) || '—'}</td>
                  <td className="table-cell max-w-[200px] truncate" style={{ color: '#888' }}>{l.reason || '—'}</td>
                  <td className="table-cell"><span className={statusColors[l.status] || 'badge-gray'}>{l.status}</span></td>
                  <td className="table-cell text-right">
                    <button onClick={() => setDetailModal(l)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#CC0000' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                  {can('leave_approve') && (
                    <td className="table-cell text-right">
                      {l.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleDecide(l.id, 'approve')} className="p-1.5 rounded-lg transition-colors" style={{ color: '#4ade80' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          ><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleDecide(l.id, 'reject')} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ff6666' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          ><XIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {leaves.length === 0 && <tr><td colSpan="9" className="text-center py-8" style={{ color: '#555' }}>No leave requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">Apply for Leave</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
              ><XIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div>
                <label className="label">Leave Type</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="input-field">
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start Date *</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" required /></div>
                <div><label className="label">End Date *</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" required /></div>
              </div>
              <div><label className="label">Reason</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field h-20 resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailModal(null)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">Leave Request Details</h3>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
              ><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {can('leave_approve') && detailModal.first_name && (
                <div>
                  <label className="label">Employee</label>
                  <p className="text-white font-medium">{detailModal.first_name} {detailModal.last_name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Leave Type</label>
                  <p className="text-white font-medium capitalize">{detailModal.leave_type}</p>
                </div>
                <div>
                  <label className="label">Status</label>
                  <p><span className={statusColors[detailModal.status] || 'badge-gray'}>{detailModal.status}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <p className="text-white font-medium">{detailModal.start_date ? format(new Date(detailModal.start_date), 'MMM d, yyyy') : '—'}</p>
                </div>
                <div>
                  <label className="label">End Date</label>
                  <p className="text-white font-medium">{detailModal.end_date ? format(new Date(detailModal.end_date), 'MMM d, yyyy') : '—'}</p>
                </div>
              </div>
              <div>
                <label className="label">Total Days</label>
                <p className="text-white font-medium">{detailModal.days || calculateDays(detailModal.start_date, detailModal.end_date)} days</p>
              </div>
              <div>
                <label className="label">Reason</label>
                <p style={{ color: '#888' }}>{detailModal.reason || 'No reason provided'}</p>
              </div>
              {can('leave_approve') && detailModal.status === 'pending' && (
                <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => { handleDecide(detailModal.id, 'approve'); setDetailModal(null); }} className="flex-1 btn-primary flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => { handleDecide(detailModal.id, 'reject'); setDetailModal(null); }} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                    <XIcon className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
