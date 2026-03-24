import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Upload, X, Loader2, Grid3x3 } from 'lucide-react';
import { tableApi } from '../api/tableApi';
import { getUploadUrl } from '../api/apiClient';
import { usePermission } from '../hooks/usePermission';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ table_number: '', capacity: '', price: '' });
  const todayStr = new Date().toISOString().split('T')[0];
  const [statusDate, setStatusDate] = useState(todayStr);
  const [statusData, setStatusData] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, table: null });
  const { can } = usePermission();

  useEffect(() => { load(); }, []);
  useEffect(() => { loadStatus(); }, [statusDate]);

  const load = async () => {
    try {
      const { data } = await tableApi.list();
      setTables(data.data || data || []);
    } catch {} finally { setLoading(false); }
  };

  const loadStatus = async () => {
    try {
      const { data } = await tableApi.getStatus(statusDate);
      setStatusData(data.tables || data.data?.tables || []);
    } catch { setStatusData([]); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ table_number: '', capacity: '', price: '' });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ table_number: t.table_number, capacity: t.capacity, price: t.price || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { table_number: form.table_number, capacity: Number(form.capacity), price: Number(form.price) || 0 };
      if (editing) {
        await tableApi.update(editing.id, payload);
        toast.success('Table updated!');
      } else {
        await tableApi.create(payload);
        toast.success('Table created!');
      }
      setShowModal(false);
      load();
      loadStatus();
    } catch {} finally { setSaving(false); }
  };

  const handleImageUpload = (table) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('image', file);
      await tableApi.uploadImage(table.id, fd);
      toast.success('Table image uploaded!');
      load();
    };
    input.click();
  };

  const toggleActive = (table) => {
    setConfirmModal({ isOpen: true, table });
  };

  const executeToggle = async () => {
    const table = confirmModal.table;
    if (!table) return;
    try {
      await tableApi.update(table.id, { is_active: table.is_active ? 0 : 1 });
      toast.success(table.is_active ? 'Table deactivated' : 'Table activated');
      setConfirmModal({ isOpen: false, table: null });
      load();
      loadStatus();
    } catch {
      toast.error('Failed to update table');
    }
  };

  const handleManualStatusChange = async (table, nextStatus) => {
    try {
      await tableApi.update(table.id, {
        manual_status: nextStatus,
        is_active: nextStatus === 'unavailable' ? 0 : 1,
      });
      toast.success(`Table ${table.table_number} set to ${nextStatus}`);
      load();
      loadStatus();
    } catch {
      toast.error('Failed to update table status');
    }
  };

  const statusBorderColor = (s) => {
    if (s === 'unavailable') return 'rgba(107,114,128,0.4)';
    if (s === 'occupied') return 'rgba(204,0,0,0.5)';
    if (s === 'reserved') return 'rgba(245,158,11,0.5)';
    return 'rgba(34,197,94,0.5)';
  };

  const statusBadge = (s) => {
    if (s === 'unavailable') return 'badge-gray';
    if (s === 'occupied') return 'badge-danger';
    if (s === 'reserved') return 'badge-warning';
    return 'badge-success';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" style={{ color: '#888' }}>Status Date:</label>
          <input type="date" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} className="input-field w-auto" />
        </div>
        {can('table_update') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Table
          </button>
        )}
      </div>

      {/* Status Legend */}
      <div className="flex gap-4">
        {[
          { label: 'Available',   color: '#4ade80' },
          { label: 'Reserved',   color: '#fbbf24' },
          { label: 'Unavailable', color: '#6b7280' },
          { label: 'Occupied',   color: '#ff6666' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: l.color }} /> {l.label}
          </div>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {(statusData.length > 0 ? statusData : tables).map((table) => (
          <div key={table.id} className="card p-0 overflow-hidden transition-all duration-200"
            style={{ borderColor: statusBorderColor(table.status || 'available'), borderWidth: '1px' }}
          >
            <div className="h-28 relative group" style={{ background: '#1a1a1a' }}>
              {table.image_path ? (
                <img src={getUploadUrl(table.image_path)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Grid3x3 className="w-8 h-8" style={{ color: '#333' }} />
                </div>
              )}
              {can('table_update') && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleImageUpload(table)} className="p-2 rounded-lg" style={{ background: '#CC0000', color: '#fff' }}><Upload className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(table)} className="p-2 rounded-lg" style={{ background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}><Edit2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Table {table.table_number}</h4>
                <span className={`${statusBadge(table.status || 'available')}`}>
                  {table.status || 'available'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs" style={{ color: '#666' }}>
                <span>Capacity: {table.capacity}</span>
                {table.price > 0 && <span className="font-semibold" style={{ color: '#CC0000' }}>₱{Number(table.price).toLocaleString()}</span>}
              </div>
              {can('table_update') && (
                <div className="mt-2">
                  <label className="text-[10px] block mb-1" style={{ color: '#555' }}>Manual Status</label>
                  {table.status === 'reserved' && (table.manual_status || 'available') !== 'reserved' && statusDate > todayStr ? (
                    <div className="w-full rounded-md px-2 py-1.5 text-xs flex items-center gap-1.5"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                      <span>Reserved (future booking)</span>
                    </div>
                  ) : (
                    <select
                      value={table.manual_status || (table.is_active ? 'available' : 'unavailable')}
                      onChange={(e) => handleManualStatusChange(table, e.target.value)}
                      className="w-full rounded-md px-2 py-1 text-xs text-white outline-none"
                      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  )}
                </div>
              )}
              {can('table_update') && (
                <button onClick={() => toggleActive(table)} className="mt-2 text-xs w-full py-1 rounded transition-colors" style={{ color: table.is_active ? '#ff6666' : '#4ade80' }}>
                  {table.is_active ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">No tables found.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">{editing ? 'Edit Table' : 'Add Table'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
              ><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Table Number *</label><input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} className="input-field" required /></div>
              <div><label className="label">Capacity *</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" required /></div>
              <div><label className="label">Price</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, table: null })}
        onConfirm={executeToggle}
        title={confirmModal.table?.is_active ? 'Deactivate Table?' : 'Activate Table?'}
        message={confirmModal.table?.is_active 
          ? `Table ${confirmModal.table?.table_number} will be deactivated and unavailable for reservations.`
          : `Table ${confirmModal.table?.table_number} will be activated and available for reservations.`
        }
        type={confirmModal.table?.is_active ? 'warning' : 'info'}
        confirmText={confirmModal.table?.is_active ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
};

export default Tables;
