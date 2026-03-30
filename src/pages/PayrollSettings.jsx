import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, Info } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const PayrollSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    sss_rate: 4.50,
    philhealth_rate: 3.00,
    pagibig_rate: 2.00,
    withholding_tax_rate: 0.00,
    minimum_wage: 610.00,
    updated_at: null
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/hr/payroll/settings');
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load payroll settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await apiClient.put('/hr/payroll/settings', {
        sss_rate: Number(settings.sss_rate),
        philhealth_rate: Number(settings.philhealth_rate),
        pagibig_rate: Number(settings.pagibig_rate),
        withholding_tax_rate: Number(settings.withholding_tax_rate),
        minimum_wage: Number(settings.minimum_wage)
      });
      
      if (data.success) {
        toast.success('Payroll settings updated successfully!');
        loadSettings(); // Reload to get updated timestamp
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Payroll Settings</h2>
        <p className="text-sm mt-1" style={{ color: '#888' }}>
          Configure payroll rates and deductions for your bar
        </p>
      </div>

      {/* Info Alert */}
      <div className="card" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0" style={{ color: '#60a5fa' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#93c5fd' }}>Important Notice</p>
            <p className="text-sm mt-1" style={{ color: '#bfdbfe' }}>
              Update these rates yearly based on current government regulations. These values will be used when computing employee payroll.
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {settings.updated_at && (
        <div className="text-sm" style={{ color: '#666' }}>
          Last updated: {format(new Date(settings.updated_at), 'MMM d, yyyy • h:mm a')}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Government Contributions</h3>
          
          <div className="space-y-4">
            {/* SSS Rate */}
            <div>
              <label className="label">
                SSS Contribution Rate (%)
                <span className="text-xs ml-2" style={{ color: '#666' }}>
                  {settings.updated_at ? `Last updated: ${format(new Date(settings.updated_at), 'MMM d, yyyy')}` : 'Not yet configured'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.sss_rate}
                onChange={(e) => handleChange('sss_rate', e.target.value)}
                className="input-field"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Social Security System contribution rate
              </p>
            </div>

            {/* PhilHealth Rate */}
            <div>
              <label className="label">
                PhilHealth Contribution Rate (%)
                <span className="text-xs ml-2" style={{ color: '#666' }}>
                  {settings.updated_at ? `Last updated: ${format(new Date(settings.updated_at), 'MMM d, yyyy')}` : 'Not yet configured'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.philhealth_rate}
                onChange={(e) => handleChange('philhealth_rate', e.target.value)}
                className="input-field"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Philippine Health Insurance Corporation contribution rate
              </p>
            </div>

            {/* Pag-IBIG Rate */}
            <div>
              <label className="label">
                Pag-IBIG Contribution Rate (%)
                <span className="text-xs ml-2" style={{ color: '#666' }}>
                  {settings.updated_at ? `Last updated: ${format(new Date(settings.updated_at), 'MMM d, yyyy')}` : 'Not yet configured'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.pagibig_rate}
                onChange={(e) => handleChange('pagibig_rate', e.target.value)}
                className="input-field"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Home Development Mutual Fund contribution rate
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Tax & Wage Settings</h3>
          
          <div className="space-y-4">
            {/* Withholding Tax Rate */}
            <div>
              <label className="label">
                Withholding Tax Rate (%)
                <span className="text-xs ml-2" style={{ color: '#666' }}>
                  {settings.updated_at ? `Last updated: ${format(new Date(settings.updated_at), 'MMM d, yyyy')}` : 'Not yet configured'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.withholding_tax_rate}
                onChange={(e) => handleChange('withholding_tax_rate', e.target.value)}
                className="input-field"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Bureau of Internal Revenue withholding tax rate
              </p>
            </div>

            {/* Minimum Wage */}
            <div>
              <label className="label">
                Minimum Wage (₱ per day)
                <span className="text-xs ml-2" style={{ color: '#666' }}>
                  {settings.updated_at ? `Last updated: ${format(new Date(settings.updated_at), 'MMM d, yyyy')}` : 'Not yet configured'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.minimum_wage}
                onChange={(e) => handleChange('minimum_wage', e.target.value)}
                className="input-field"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Regional minimum wage per day
              </p>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="card" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#fcd34d' }}>Before Updating</p>
              <p className="text-sm mt-1" style={{ color: '#fde68a' }}>
                Changes to these rates will affect future payroll calculations. Existing payroll runs will not be affected.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PayrollSettings;
