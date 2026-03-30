import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Upload, X, Loader2, Package, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { dssApi } from '../api/dssApi';
import { getUploadUrl } from '../api/apiClient';
import { usePermission } from '../hooks/usePermission';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const dssBadgeConfig = {
  critical: { label: 'Low Stock',    bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  warning:  { label: 'Not Selling',  bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  positive: { label: 'Top Seller',   bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  outstock: { label: 'Out of Stock', bg: 'rgba(239,68,68,0.1)',   color: '#ff6666', border: 'rgba(239,68,68,0.25)' },
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '', stock_qty: '', reorder_level: '', cost_price: '' });
  const { can } = usePermission();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [dssRecs, setDssRecs] = useState([]);
  const [tooltipId, setTooltipId] = useState(null);

  useEffect(() => { load(); loadDss(); }, []);

  const loadDss = async () => {
    try {
      const { data } = await dssApi.getRecommendations();
      setDssRecs(data.recommendations || []);
    } catch (_) {}
  };

  const getDssBadge = (itemName) => {
    if (!itemName) return null;
    const name = itemName.toLowerCase();
    const match = dssRecs.find(r =>
      r.message?.toLowerCase().includes(name) || r.title?.toLowerCase().includes(name)
    );
    if (!match) return null;
    if (match.title === 'Out of Stock on Menu') return { ...dssBadgeConfig.outstock, message: match.message };
    if (match.severity === 'critical') return { ...dssBadgeConfig.critical, message: match.message };
    if (match.type === 'menu' && match.severity === 'positive') return { ...dssBadgeConfig.positive, message: match.message };
    if (match.severity === 'warning') return { ...dssBadgeConfig.warning, message: match.message };
    return null;
  };

  const load = async () => {
    try {
      const { data } = await inventoryApi.list();
      setItems(data.data || data || []);
    } catch {} finally { setLoading(false); }
  };

  const filtered = items.filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', unit: 'Piece', stock_qty: '', reorder_level: '', cost_price: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, unit: item.unit || 'Piece', stock_qty: item.stock_qty, reorder_level: item.reorder_level || '', cost_price: item.cost_price || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, stock_qty: Number(form.stock_qty), reorder_level: Number(form.reorder_level) || 0, cost_price: Number(form.cost_price) || 0 };
      if (editing) {
        await inventoryApi.update(editing.id, payload);
        toast.success('Item updated!');
      } else {
        await inventoryApi.create(payload);
        toast.success('Item created!');
      }
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      await inventoryApi.deactivate(confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      toast.success('Item deactivated');
      load();
    } catch (err) {
      const message = err.response?.data?.message || 'This item is currently used in the system and cannot be deleted';
      toast.error(message);
    }
  };

  const handleImageUpload = (item) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('image', file);
      await inventoryApi.uploadImage(item.id, fd);
      toast.success('Image uploaded!');
      load();
    };
    input.click();
  };

  const statusColor = (s) => {
    if (s === 'critical') return 'badge-danger';
    if (s === 'low') return 'badge-warning';
    return 'badge-success';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:w-72" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-4 h-4" style={{ color: '#555' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..." className="bg-transparent text-sm outline-none flex-1 text-white placeholder-gray-600" />
        </div>
        {can('menu_update') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card py-4">
          <p className="text-xs" style={{ color: '#888' }}>Total Items</p>
          <p className="text-xl font-bold text-white">{items.length}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs" style={{ color: '#888' }}>Normal Stock</p>
          <p className="text-xl font-bold" style={{ color: '#4ade80' }}>{items.filter(i => i.stock_status === 'normal').length}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs" style={{ color: '#888' }}>Low Stock</p>
          <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>{items.filter(i => i.stock_status === 'low').length}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs" style={{ color: '#888' }}>Critical</p>
          <p className="text-xl font-bold" style={{ color: '#ff6666' }}>{items.filter(i => i.stock_status === 'critical').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Reorder Level</th>
                <th className="table-header">Cost Price</th>
                <th className="table-header">Status</th>
                {can('menu_update') && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" style={{ background: '#222' }} onClick={() => can('menu_update') && handleImageUpload(item)}>
                        {item.image_path ? (
                          <img src={getUploadUrl(item.image_path)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4" style={{ color: '#555' }} /></div>
                        )}
                      </div>
                      <span className="font-medium text-white">{item.name}</span>
                      {(() => {
                        const badge = getDssBadge(item.name);
                        if (!badge) return null;
                        return (
                          <div className="relative inline-block">
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-help"
                              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                              onMouseEnter={() => setTooltipId(item.id)}
                              onMouseLeave={() => setTooltipId(null)}
                            >
                              {badge.label}
                            </span>
                            {tooltipId === item.id && (
                              <div className="absolute left-0 top-6 z-50 w-56 rounded-lg p-2.5 text-xs shadow-xl pointer-events-none"
                                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc' }}>
                                {badge.message}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="table-cell">{item.unit || '—'}</td>
                  <td className="table-cell font-semibold">{Math.round(Number(item.stock_qty || 0))} {item.unit || ''}</td>
                  <td className="table-cell">{item.reorder_level || '—'}</td>
                  <td className="table-cell">{item.cost_price ? `₱${Number(item.cost_price).toLocaleString()}` : '—'}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(item.stock_status)}`}>
                      {item.stock_status}
                    </span>
                  </td>
                  {can('menu_update') && (
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
                        ><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; e.currentTarget.style.color = '#ff6666'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
                        ><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center py-8" style={{ color: '#555' }}>No inventory items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">{editing ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
              ><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unit of Measurement *</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field" required>
                    <option value="Bottle">Bottle</option>
                    <option value="Bucket">Bucket</option>
                    <option value="Case (12 bottles)">Case (12 bottles)</option>
                    <option value="Glass">Glass</option>
                    <option value="Liter">Liter</option>
                    <option value="Kilogram">Kilogram</option>
                    <option value="Piece">Piece</option>
                  </select>
                </div>
                <div><label className="label">Stock Qty *</label><input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} className="input-field" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Reorder Level</label><input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} className="input-field" /></div>
                <div><label className="label">Cost Price</label><input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="input-field" /></div>
              </div>
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
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Deactivate Item?"
        message="This inventory item will be deactivated. You can reactivate it later."
        confirmText="Deactivate"
        type="warning"
      />
    </div>
  );
};

export default Inventory;
