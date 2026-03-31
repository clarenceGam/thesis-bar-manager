import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { inventoryRequestApi } from '../api/inventoryRequestApi';
import { usePermission } from '../hooks/usePermission';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const InventoryRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ item_name: '', quantity_needed: '', unit: 'Piece', reason: '', cost_price: '', reorder_level: '' });
  const { can, isOwner } = usePermission();
  const [activeTab, setActiveTab] = useState(() => isOwner ? 'all' : 'my');
  const [statusFilter, setStatusFilter] = useState(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null, rejectionNote: '' });
  const [processing, setProcessing] = useState(null);

  useEffect(() => { load(); }, [activeTab, statusFilter]);

  const load = async () => {
    try {
      setLoading(true);
      if (activeTab === 'my' || !isOwner) {
        const { data } = await inventoryRequestApi.myRequests();
        setRequests(data.data || data || []);
      } else {
        const { data } = await inventoryRequestApi.list(statusFilter);
        setRequests(data.data || data || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ item_name: '', quantity_needed: '', unit: 'Piece', reason: '', cost_price: '', reorder_level: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryRequestApi.submit({
        item_name: form.item_name,
        quantity_needed: Number(form.quantity_needed),
        unit: form.unit,
        reason: form.reason,
        cost_price: Number(form.cost_price) || null,
        reorder_level: Number(form.reorder_level) || null
      });
      toast.success('Request submitted!');
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await inventoryRequestApi.approve(id);
      toast.success('Request approved!');
      load();
    } catch {} finally { setProcessing(null); }
  };

  const openRejectModal = (id) => {
    setRejectModal({ isOpen: true, id, rejectionNote: '' });
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    setProcessing(rejectModal.id);
    try {
      await inventoryRequestApi.reject(rejectModal.id, rejectModal.rejectionNote);
      toast.success('Request rejected');
      setRejectModal({ isOpen: false, id: null, rejectionNote: '' });
      load();
    } catch {} finally { setProcessing(null); }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') return { icon: <Clock className="w-3.5 h-3.5" />, class: 'badge-warning', label: 'Pending' };
    if (status === 'approved') return { icon: <CheckCircle className="w-3.5 h-3.5" />, class: 'badge-success', label: 'Approved' };
    if (status === 'rejected') return { icon: <XCircle className="w-3.5 h-3.5" />, class: 'badge-danger', label: 'Rejected' };
    return { icon: null, class: 'badge-gray', label: status };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Inventory Requests</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            {isOwner ? 'Manage inventory requests from staff' : 'Submit and track your inventory requests'}
          </p>
        </div>
        {!isOwner && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Request
          </button>
        )}
      </div>

      {/* Tabs (Owner only sees All Requests) */}
      {isOwner && (
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 rounded-lg font-medium text-sm bg-red-900/30 text-white border border-red-800/50">
            All Requests
          </span>
        </div>
      )}

      {/* Status Filter (when viewing all) */}
      {isOwner && activeTab === 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#888' }}>Filter:</span>
          {[
            { value: null, label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ].map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-red-900/30 text-white border border-red-800/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {requests.map((req) => {
          const badge = getStatusBadge(req.status);
          return (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{req.item_name}</h4>
                    <span className={`${badge.class} flex items-center gap-1 text-xs`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#888' }}>
                    Quantity: <span className="font-semibold text-white">{req.quantity_needed} {req.unit}</span>
                  </p>
                  {req.reason && (
                    <p className="text-sm mt-1" style={{ color: '#888' }}>
                      Reason: <span style={{ color: '#ccc' }}>{req.reason}</span>
                    </p>
                  )}
                  {activeTab === 'all' && (
                    <p className="text-xs mt-2" style={{ color: '#666' }}>
                      Requested by: {req.requester_first_name} {req.requester_last_name}
                    </p>
                  )}
                  {req.reviewed_at && (
                    <p className="text-xs mt-1" style={{ color: '#666' }}>
                      Reviewed by: {req.reviewer_first_name} {req.reviewer_last_name} on {format(new Date(req.reviewed_at), 'MMM d, yyyy')}
                    </p>
                  )}
                  {req.rejection_note && (
                    <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>Rejection Note:</p>
                      <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>{req.rejection_note}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs" style={{ color: '#555' }}>{format(new Date(req.created_at), 'MMM d, yyyy')}</span>
                  {isOwner && activeTab === 'all' && req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processing === req.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(req.id)}
                        disabled={processing === req.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="card text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#555' }} />
            <p style={{ color: '#888' }}>No requests found.</p>
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">New Inventory Request</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
              ><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Item Name *</label>
                <input 
                  value={form.item_name} 
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })} 
                  className="input-field" 
                  required 
                  placeholder="e.g., San Miguel Beer, Napkins"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity Needed *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={form.quantity_needed} 
                    onChange={(e) => setForm({ ...form, quantity_needed: e.target.value })} 
                    className="input-field" 
                    required 
                  />
                </div>
                <div>
                  <label className="label">Unit *</label>
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cost Price (per unit)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={form.cost_price} 
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })} 
                    className="input-field" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">Reorder Level</label>
                  <input 
                    type="number" 
                    min="0"
                    value={form.reorder_level} 
                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} 
                    className="input-field" 
                    placeholder="Min stock before reorder"
                  />
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea 
                  value={form.reason} 
                  onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                  className="input-field h-20 resize-none" 
                  placeholder="Why is this item needed?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectModal({ isOpen: false, id: null, rejectionNote: '' })}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">Reject Request</h3>
              <button onClick={() => setRejectModal({ isOpen: false, id: null, rejectionNote: '' })} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
              ><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Rejection Note (Optional)</label>
                <textarea 
                  value={rejectModal.rejectionNote} 
                  onChange={(e) => setRejectModal({ ...rejectModal, rejectionNote: e.target.value })} 
                  className="input-field h-20 resize-none" 
                  placeholder="Explain why this request is being rejected..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRejectModal({ isOpen: false, id: null, rejectionNote: '' })} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReject} disabled={processing} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{ background: '#ef4444' }}>
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />} Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryRequests;
