import React, { useState } from 'react';
import { Save, Loader2, User, Mail, Phone, Calendar, Key } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { getUploadUrl } from '../api/apiClient';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('info');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) return null;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      const response = await apiClient.post('/owner/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden flex-shrink-0" style={{ background: '#CC0000' }}>
          {user.profile_picture ? (
            <img src={getUploadUrl(user.profile_picture)} alt="" className="w-full h-full object-cover" />
          ) : (
            `${user.first_name?.[0]}${user.last_name?.[0]}`
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{user.first_name} {user.last_name}</h2>
          <p className="capitalize" style={{ color: '#888' }}>{user.role?.replace('_', ' ')}</p>
          <p className="text-sm mt-1" style={{ color: '#666' }}>{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1 w-fit" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setTab('info')} className="px-4 py-2 rounded-md text-sm font-medium transition-colors" style={tab === 'info' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>Information</button>
        <button onClick={() => setTab('security')} className="px-4 py-2 rounded-md text-sm font-medium transition-colors" style={tab === 'security' ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>Security</button>
      </div>

      {tab === 'info' && (
        <div className="card">
          <h3 className="font-bold text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#161616' }}>
              <User className="w-5 h-5" style={{ color: '#555' }} />
              <div>
                <p className="text-xs" style={{ color: '#666' }}>Full Name</p>
                <p className="text-sm font-medium text-white">{user.first_name} {user.last_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#161616' }}>
              <Mail className="w-5 h-5" style={{ color: '#555' }} />
              <div>
                <p className="text-xs" style={{ color: '#666' }}>Email</p>
                <p className="text-sm font-medium text-white">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#161616' }}>
              <Phone className="w-5 h-5" style={{ color: '#555' }} />
              <div>
                <p className="text-xs" style={{ color: '#666' }}>Phone</p>
                <p className="text-sm font-medium text-white">{user.phone_number || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#161616' }}>
              <Calendar className="w-5 h-5" style={{ color: '#555' }} />
              <div>
                <p className="text-xs" style={{ color: '#666' }}>Date of Birth</p>
                <p className="text-sm font-medium text-white">{user.date_of_birth || '—'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg" style={{ background: '#161616' }}>
            <p className="text-xs" style={{ color: '#666' }}>Role</p>
            <p className="text-sm font-medium text-white capitalize">{user.role?.replace('_', ' ')}</p>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(204,0,0,0.1)' }}>
              <Key className="w-5 h-5" style={{ color: '#CC0000' }} />
            </div>
            <div>
              <h3 className="font-bold text-white">Change Password</h3>
              <p className="text-xs" style={{ color: '#666' }}>Update your account password</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password" 
                disabled={changingPassword}
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters" 
                disabled={changingPassword}
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password" 
                disabled={changingPassword}
              />
            </div>
            <button 
              type="submit" 
              disabled={changingPassword} 
              className="btn-primary flex items-center justify-center gap-2"
            >
              {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
