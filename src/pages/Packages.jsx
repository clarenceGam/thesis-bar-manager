import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Loader2, Package as PackageIcon, Minus } from 'lucide-react';
import { packageApi } from '../api/packageApi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    inclusions: [{ item_name: '', quantity: 1 }] 
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await packageApi.list();
      setPackages(data.data || data || []);
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ 
      name: '', 
      description: '', 
      price: '', 
      inclusions: [{ item_name: '', quantity: 1 }] 
    });
    setShowModal(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({ 
      name: pkg.name, 
      description: pkg.description || '', 
      price: pkg.price || '', 
      inclusions: pkg.inclusions && pkg.inclusions.length > 0 
        ? pkg.inclusions.map(inc => ({ item_name: inc.item_name, quantity: inc.quantity }))
        : [{ item_name: '', quantity: 1 }]
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        inclusions: form.inclusions.filter(inc => inc.item_name.trim())
      };
      
      if (editing) {
        await packageApi.update(editing.id, payload);
        toast.success('Package updated!');
      } else {
        await packageApi.create(payload);
        toast.success('Package created!');
      }
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleToggle = async (pkg) => {
    try { 
      await packageApi.update(pkg.id, { is_active: !pkg.is_active }); 
      toast.success('Status toggled'); 
      load(); 
    } catch {}
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      await packageApi.remove(confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      toast.success('Package deleted');
      load();
    } catch {}
  };

  const addInclusion = () => {
    setForm({ ...form, inclusions: [...form.inclusions, { item_name: '', quantity: 1 }] });
  };

  const removeInclusion = (index) => {
    const newInclusions = form.inclusions.filter((_, i) => i !== index);
    setForm({ ...form, inclusions: newInclusions.length > 0 ? newInclusions : [{ item_name: '', quantity: 1 }] });
  };

  const updateInclusion = (index, field, value) => {
    const newInclusions = [...form.inclusions];
    newInclusions[index][field] = value;
    setForm({ ...form, inclusions: newInclusions });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Packages</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage your bar packages with inclusions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="card transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-white">{pkg.name}</h4>
                {pkg.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#888' }}>{pkg.description}</p>}
              </div>
              <span className={pkg.is_active ? 'badge-success' : 'badge-gray'}>{pkg.is_active ? 'Active' : 'Inactive'}</span>
            </div>

            <div className="mb-3">
              <span className="text-2xl font-extrabold" style={{ color: '#CC0000' }}>
                ₱{Number(pkg.price || 0).toLocaleString()}
              </span>
            </div>

            {pkg.inclusions && pkg.inclusions.length > 0 && (
              <div className="mb-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#888' }}>Inclusions:</p>
                <ul className="space-y-1">
                  {pkg.inclusions.map((inc, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2" style={{ color: '#ccc' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#CC0000' }} />
                      <span>{inc.quantity}x {inc.item_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-1 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => handleToggle(pkg)} className="p-1 rounded transition-colors">
                {pkg.is_active ? <ToggleRight className="w-4 h-4" style={{ color: '#4ade80' }} /> : <ToggleLeft className="w-4 h-4" style={{ color: '#555' }} />}
              </button>
              <button onClick={() => openEdit(pkg)} className="p-1 rounded transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#CC0000'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(pkg.id)} className="p-1 rounded transition-colors" style={{ color: '#ff6666' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {packages.length === 0 && (
          <div className="col-span-full text-center py-12" style={{ color: '#555' }}>
            No packages yet. Create your first package to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111111' }}>
              <h3 className="font-bold text-white">{editing ? 'Edit Package' : 'Create Package'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Package Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required placeholder="e.g. VIP Package, Birthday Bundle" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" placeholder="Describe what this package offers..." />
              </div>
              <div>
                <label className="label">Price (₱) *</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" required placeholder="0.00" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Package Inclusions</label>
                  <button type="button" onClick={addInclusion} className="btn-secondary btn-sm flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" /> Add Inclusion
                  </button>
                </div>
                <div className="space-y-2">
                  {form.inclusions.map((inc, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            value={inc.item_name} 
                            onChange={(e) => updateInclusion(index, 'item_name', e.target.value)} 
                            className="input-field" 
                            placeholder="e.g. 1 bottle, pulutan, table" 
                          />
                        </div>
                        <div>
                          <input 
                            type="number" 
                            min="1" 
                            value={inc.quantity} 
                            onChange={(e) => updateInclusion(index, 'quantity', e.target.value)} 
                            className="input-field" 
                            placeholder="Qty" 
                          />
                        </div>
                      </div>
                      {form.inclusions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeInclusion(index)} 
                          className="p-2 rounded transition-colors flex-shrink-0" 
                          style={{ color: '#ff6666' }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: '#555' }}>Add items included in this package (e.g., bottles, food, table reservation, free entrance)</p>
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
        title="Delete Package?"
        message="This package will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Packages;
