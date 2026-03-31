import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Bell, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const Settings = () => {
  const { user } = useAuthStore();
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'https://api.thepartygoers.fun');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Account Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary-500" />
          <h3 className="font-bold text-white">Account Settings</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#161616' }}>
            <div>
              <p className="text-sm font-medium text-white">Account Status</p>
              <p className="text-xs" style={{ color: '#888' }}>Your account is currently active</p>
            </div>
            <span className={user?.is_active ? 'badge-success' : 'badge-danger'}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#161616' }}>
            <div>
              <p className="text-sm font-medium text-white">Role</p>
              <p className="text-xs" style={{ color: '#888' }}>Your current role in the system</p>
            </div>
            <span className="badge-info capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#161616' }}>
            <div>
              <p className="text-sm font-medium text-white">Bar ID</p>
              <p className="text-xs" style={{ color: '#888' }}>Your assigned bar/branch</p>
            </div>
            <span className="text-sm font-medium" style={{ color: '#ccc' }}>#{user?.bar_id || '—'}</span>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-white">API Configuration</h3>
        </div>
        <div>
          <label className="label">Backend API URL</label>
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="input-field" readOnly />
          <p className="text-xs mt-1" style={{ color: '#555' }}>Set via VITE_API_URL environment variable</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-white">Notification Preferences</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Reservation Notifications', desc: 'Get notified for new reservations' },
            { label: 'Order Notifications', desc: 'Get notified for POS orders' },
            { label: 'Staff Alerts', desc: 'Get notified for staff activities' },
            { label: 'Low Stock Alerts', desc: 'Get notified when stock is low' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#161616' }}>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs" style={{ color: '#888' }}>{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 rounded-full peer transition-all" style={{ background: '#333' }}
                  data-checked="true"
                ></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-white">About</h3>
        </div>
        <div className="space-y-1 text-sm" style={{ color: '#888' }}>
          <p><strong>App:</strong> The Party Goers PH — Bar Owner Portal</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Timezone:</strong> Asia/Manila (PHT)</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
