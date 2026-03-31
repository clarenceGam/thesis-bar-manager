import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, RotateCcw, Key, ToggleLeft, ToggleRight, X, Loader2, Shield } from 'lucide-react';
import { staffApi } from '../api/staffApi';
import { usePermission } from '../hooks/usePermission';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const Staff = () => {
  const [users, setUsers] = useState([]);
  const [archived, setArchived] = useState([]);
  const [staffTypes, setStaffTypes] = useState([]);
  const [supportsStaffType, setSupportsStaffType] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, staff: null });
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone_number: '', role: 'staff', staff_type: '' });
  const [permTarget, setPermTarget] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const { can, isOwner } = usePermission();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const canManagePerms = can('staff_edit_permissions');
      const [usersRes, rolesRes, permsRes, metaRes] = await Promise.all([
        staffApi.list(),
        canManagePerms ? staffApi.getRoles().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        canManagePerms ? staffApi.getPermissions().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        staffApi.getMeta().catch(() => ({ data: { data: { staff_types: [], supports_staff_type: false } } })),
      ]);
      setUsers(usersRes.data.data || usersRes.data || []);
      setRoles(rolesRes.data.data || rolesRes.data || []);
      setPermissions(permsRes.data.data || permsRes.data || []);
      const meta = metaRes.data.data || metaRes.data || {};
      setStaffTypes(Array.isArray(meta.staff_types) ? meta.staff_types : []);
      setSupportsStaffType(Boolean(meta.supports_staff_type));
      try { const archRes = await staffApi.listArchived(); setArchived(archRes.data.data || archRes.data || []); } catch { setArchived([]); }
    } catch {} finally { setLoading(false); }
  };

  const filtered = (tab === 'active' ? users : archived).filter((u) => {
    if (!isOwner && u.role === 'bar_owner') return false;
    return `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ first_name: '', last_name: '', email: '', password: '', phone_number: '', role: 'staff', staff_type: '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, password: '', phone_number: u.phone_number || '', role: u.role, staff_type: u.staff_type || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { first_name: form.first_name, last_name: form.last_name, email: form.email, phone_number: form.phone_number, role: form.role, staff_type: form.staff_type || null };
        await staffApi.update(editing.id, payload);
        toast.success('User updated!');
      } else {
        await staffApi.create({ ...form, staff_type: form.staff_type || null });
        toast.success('User created!');
      }
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const staffTypeOptions = Array.from(new Set([...(staffTypes || []), ...(form.staff_type ? [form.staff_type] : [])]));
  const showStaffTypeField = true;
  const showStaffTypeColumn = supportsStaffType || users.some((u) => u.staff_type) || archived.some((u) => u.staff_type);

  const handleToggle = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'toggle',
      staff: users.find(u => u.id === id),
      title: users.find(u => u.id === id).is_active ? 'Deactivate Staff?' : 'Activate Staff?',
      message: users.find(u => u.id === id).is_active 
        ? `${users.find(u => u.id === id).first_name} ${users.find(u => u.id === id).last_name} will be deactivated and unable to access the system.`
        : `${users.find(u => u.id === id).first_name} ${users.find(u => u.id === id).last_name} will be activated and able to access the system.`,
      type: users.find(u => u.id === id).is_active ? 'warning' : 'info'
    });
  };

  const executeToggle = async () => {
    if (!confirmModal.staff) return;
    try {
      await staffApi.update(confirmModal.staff.id, { is_active: confirmModal.staff.is_active ? 0 : 1 });
      toast.success(confirmModal.staff.is_active ? 'Staff deactivated' : 'Staff activated');
      setConfirmModal({ isOpen: false, action: null, staff: null });
      load();
    } catch {
      toast.error('Failed to update staff');
    }
  };

  const handleConfirm = () => {
    if (confirmModal.action === 'delete') executeDelete();
    else if (confirmModal.action === 'toggle') executeToggle();
    else if (confirmModal.action === 'archive') executeArchive();
  };

  const handleArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'archive',
      staff: users.find(u => u.id === id),
      title: 'Archive Staff Member?',
      message: 'This staff member will be archived and lose access to the system.',
      type: 'warning'
    });
  };

  const executeArchive = async () => {
    if (!confirmModal.staff) return;
    try { await staffApi.archive(confirmModal.staff.id); toast.success('User archived'); setConfirmModal({ isOpen: false, action: null, staff: null }); load(); } catch {}
  };

  const handleRestore = async (id) => {
    try { await staffApi.restore(id); toast.success('User restored'); load(); } catch {}
  };

  const handleDelete = (staff) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      staff,
      title: 'Delete Staff Member?',
      message: `Are you sure you want to delete ${staff.first_name} ${staff.last_name}? This action cannot be undone.`,
      type: 'danger'
    });
  };

  const executeDelete = async () => {
    if (!confirmModal.staff) return;
    try {
      await staffApi.delete(confirmModal.staff.id);
      toast.success('Staff deleted');
      setConfirmModal({ isOpen: false, action: null, staff: null });
      load();
    } catch {
      toast.error('Failed to delete staff');
    }
  };

  const openPermissions = async (u) => {
    setPermTarget(u);
    try {
      const { data } = await staffApi.getUserPermissions(u.id);
      const permIds = (data.data || data || []).map((p) => p.id);
      setUserPerms(permIds);
    } catch { setUserPerms([]); }
    setShowPermModal(true);
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await staffApi.updateUserPermissions(permTarget.id, userPerms);
      toast.success('Permissions updated!');
      setShowPermModal(false);
    } catch {} finally { setSaving(false); }
  };

  const togglePerm = (pid) => {
    setUserPerms((prev) => prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]);
  };

  // Permission presets based on role
  const permissionPresets = {
    employee: [
      'attendance_view_own',
      'leave_apply', 'leave_view_own',
      'documents_view_own', 'reservation_view', 'reservation_create',
      'menu_view', 'table_view', 'events_view', 'payroll_view_own'
    ],
    hr: [
      // Staff Management
      'staff_view', 'staff_create', 'staff_update',
      // Attendance Management
      'attendance_view_own', 'attendance_view_all', 'attendance_create',
      // Leave Management
      'leave_view_own', 'leave_apply', 'leave_view_all', 'leave_approve',
      // Payroll Management
      'payroll_view_own', 'payroll_view_all', 'payroll_create',
      // Deduction Settings
      'deduction_settings_view', 'deduction_settings_manage',
      // Document Management
      'documents_view_own', 'documents_view_all', 'documents_send', 'documents_manage'
    ],
    manager: [
      'staff_view', 'staff_create', 'staff_update', 'staff_deactivate', 'staff_reset_password',
      'attendance_view_own', 'attendance_view_all', 'attendance_create',
      'leave_apply', 'leave_view_own', 'leave_view_all', 'leave_approve',
      'payroll_view_own', 'payroll_view_all', 'payroll_create',
      'deduction_settings_view', 'deduction_settings_manage',
      'documents_view_own', 'documents_view_all', 'documents_send', 'documents_manage',
      'menu_view', 'menu_create', 'menu_update', 'menu_delete',
      'reservation_view', 'reservation_manage', 'reservation_create',
      'events_view', 'events_create', 'events_update', 'events_delete',
      'events_comment_manage', 'events_comment_reply',
      'table_view', 'table_update',
      'financials_view', 'analytics_bar_view',
      'reviews_view', 'reviews_reply',
      'ban_view', 'ban_branch', 'ban_lift',
      'logs_view', 'bar_details_view'
    ]
  };

  const applyPreset = (presetName) => {
    if (presetName === 'all') {
      setUserPerms(permissions.map(p => p.id));
      toast.success('All permissions selected');
      return;
    }
    if (presetName === 'clear') {
      setUserPerms([]);
      toast.success('All permissions cleared');
      return;
    }
    const presetCodes = permissionPresets[presetName];
    if (!presetCodes) return;
    const presetIds = permissions
      .filter(p => presetCodes.includes(p.name))
      .map(p => p.id);
    setUserPerms(presetIds);
    toast.success(`${presetName.charAt(0).toUpperCase() + presetName.slice(1)} preset applied`);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await staffApi.resetPassword(resetTarget.id, newPassword);
      toast.success('Password reset!');
      setShowResetModal(false);
      setNewPassword('');
    } catch {} finally { setSaving(false); }
  };

  const roleColor = (r) => {
    const map = { bar_owner: 'badge-danger', manager: 'badge-info', hr: 'badge-purple', staff: 'badge-gray', cashier: 'badge-success' };
    return map[r] || 'badge-gray';
  };

  const toRoleLabel = (role) => {
    const map = {
      bar_owner: 'Bar Owner',
      manager: 'Manager',
      hr: 'HR',
      staff: 'Staff',
      cashier: 'Cashier',
    };
    return map[role] || role;
  };

  const toPermissionLabel = (perm) => {
    if (perm?.display_name) return perm.display_name;
    return String(perm?.name || perm?.code || '')
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:w-64" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search className="w-4 h-4" style={{ color: '#555' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="bg-transparent text-sm outline-none flex-1 text-white placeholder-gray-600" />
          </div>
          <div className="flex rounded-lg p-1" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setTab('active')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" style={tab === 'active' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>Active</button>
            <button onClick={() => setTab('archived')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" style={tab === 'archived' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>Archived</button>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Staff</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                {showStaffTypeColumn && <th className="table-header">Staff Type</th>}
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'rgba(204,0,0,0.3)' }}>
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <span className="font-medium text-white">{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td className="table-cell" style={{ color: '#888' }}>{u.email}</td>
                  <td className="table-cell"><span className={roleColor(u.role)}>{toRoleLabel(u.role)}</span></td>
                  {showStaffTypeColumn && <td className="table-cell" style={{ color: '#ccc' }}>{u.staff_type || '—'}</td>}
                  <td className="table-cell">
                    <span className={u.is_active ? 'badge-success' : 'badge-gray'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      {tab === 'active' ? (
                        <>
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }} title="Edit"><Edit2 className="w-4 h-4" /></button>
                          {can('staff_edit_permissions') && <button onClick={() => openPermissions(u)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#CC0000'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }} title="Permissions"><Shield className="w-4 h-4" /></button>}
                          <button onClick={() => { setResetTarget(u); setNewPassword(''); setShowResetModal(true); }} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }} title="Reset Password"><Key className="w-4 h-4" /></button>
                          <button onClick={() => handleToggle(u.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }} title="Toggle Active">
                            {u.is_active ? <ToggleRight className="w-4 h-4" style={{ color: '#4ade80' }} /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleArchive(u.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6666'; e.currentTarget.style.background = 'rgba(204,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }} title="Archive"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleRestore(u.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#4ade80' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }} title="Restore"><RotateCcw className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ff6666' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }} title="Delete Permanently"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={showStaffTypeColumn ? 6 : 5} className="text-center py-8" style={{ color: '#555' }}>No staff found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">{editing ? 'Edit Staff' : 'Add Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name *</label><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input-field" autoComplete="off" required /></div>
                <div><label className="label">Last Name *</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input-field" autoComplete="off" required /></div>
              </div>
              <div><label className="label">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" autoComplete="off" required /></div>
              {!editing && <div><label className="label">Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" autoComplete="new-password" required minLength={6} /></div>}
              <div><label className="label">Phone</label><input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="input-field" autoComplete="off" /></div>
              <div>
                <label className="label">Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                  <option value="staff">Staff</option>
                  <option value="hr">HR</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              {showStaffTypeField && (
                <div>
                  <label className="label">Staff Type Label</label>
                  <select value={form.staff_type || ''} onChange={(e) => setForm({ ...form, staff_type: e.target.value })} className="input-field" disabled={staffTypeOptions.length === 0}>
                    <option value="">{staffTypeOptions.length === 0 ? 'No staff types saved in Bar Management yet' : 'Select staff type...'}</option>
                    {staffTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              )}
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

      {/* Permissions Modal */}
      {showPermModal && permTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPermModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111111' }}>
              <h3 className="font-bold text-white">Permissions: {permTarget.first_name} {permTarget.last_name}</h3>
              <button onClick={() => setShowPermModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-4" style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#888' }}>Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                {[{key:'employee',label:'Employee',color:'#555'},{key:'hr',label:'HR',color:'#4ade80'},{key:'manager',label:'Manager',color:'#60a5fa'},{key:'all',label:'All',color:'#CC0000'},{key:'clear',label:'Clear',color:'#ff6666'}].map(({key,label,color}) => (
                  <button key={key} onClick={() => applyPreset(key)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', color, border: `1px solid ${color}33` }}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-1">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-3 py-1.5 cursor-pointer rounded px-2 transition-colors" style={{ borderRadius: '6px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <input type="checkbox" checked={userPerms.includes(p.id)} onChange={() => togglePerm(p.id)} className="w-4 h-4 rounded" style={{ accentColor: '#CC0000' }} />
                  <div>
                    <span className="text-sm font-medium text-white">{toPermissionLabel(p)}</span>
                    {(p.friendly_description || p.description) && (
                      <p className="text-xs" style={{ color: '#666' }}>{p.friendly_description || p.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 sticky bottom-0 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#111111' }}>
              <button onClick={() => setShowPermModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={savePermissions} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowResetModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: '#888' }}>Reset password for <strong className="text-white">{resetTarget.first_name} {resetTarget.last_name}</strong></p>
              <div><label className="label">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" autoComplete="new-password" minLength={6} /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowResetModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleResetPassword} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, staff: null })}
        onConfirm={handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.action === 'delete' ? 'Delete' : confirmModal.action === 'toggle' ? (confirmModal.staff?.is_active ? 'Deactivate' : 'Activate') : 'Confirm'}
      />
    </div>
  );
};

export default Staff;
