import React, { useState, useEffect } from 'react';
import { Wallet, Play, Loader2, Calendar, X, Eye, CheckCircle, ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react';
import { payrollApi } from '../api/payrollApi';
import { usePermission } from '../hooks/usePermission';
import { format } from 'date-fns';
import { parseUTC } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const Payroll = () => {
  const [runs, setRuns] = useState([]);
  const [myPayroll, setMyPayroll] = useState([]);
  const [expandedPayroll, setExpandedPayroll] = useState({});
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runDetails, setRunDetails] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const { can, user } = usePermission();

  const isManager = can('payroll_view_all');
  const isEmployee = can('payroll_view_own') && !isManager;
  const canViewOwn = can('payroll_view_own');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      if (isEmployee) {
        const { data } = await payrollApi.myPayroll();
        setMyPayroll(data.items || data.data || []);
      } else {
        const { data } = await payrollApi.listRuns();
        setRuns(data.data || data || []);
        if (canViewOwn) {
          const { data: myData } = await payrollApi.myPayroll();
          setMyPayroll(myData.items || myData.data || []);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const handlePreview = async () => {
    if (!periodStart || !periodEnd) { toast.error('Select period dates'); return; }
    try {
      const { data } = await payrollApi.preview({ period_start: periodStart, period_end: periodEnd });
      setPreview(data.data || data || []);
    } catch {}
  };

  const handleCreateRun = async () => {
    if (!periodStart || !periodEnd) { toast.error('Select period dates'); return; }
    setCreating(true);
    try {
      const { data } = await payrollApi.createRun({ period_start: periodStart, period_end: periodEnd });
      const runId = data.data?.id || data.id;
      if (runId) {
        await payrollApi.generateItems(runId);
        toast.success('Payroll run created and generated!');
      } else {
        toast.success('Payroll run created!');
      }
      load();
      setPreview([]);
      setPeriodStart('');
      setPeriodEnd('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create payroll run';
      if (err.response?.status === 409 || message.includes('Duplicate')) {
        toast.error('A payroll run already exists for this period. Please choose different dates or edit the existing run.');
      } else {
        toast.error(message);
      }
    } finally { setCreating(false); }
  };

  const handleViewDetails = async (run) => {
    setSelectedRun(run);
    setShowDetailsModal(true);
    try {
      const { data } = await payrollApi.getRunDetails(run.id);
      setRunDetails(data);
    } catch (err) {
      toast.error('Failed to load payroll details');
      setRunDetails(null);
    }
  };

  const handleFinalize = () => {
    if (!selectedRun) return;
    setShowFinalizeModal(true);
  };

  const executeFinalize = async () => {
    setShowFinalizeModal(false);
    setFinalizing(true);
    try {
      await payrollApi.finalizeRun(selectedRun.id);
      toast.success('Payroll finalized successfully!');
      setShowDetailsModal(false);
      load();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to finalize payroll';
      toast.error(message);
    } finally { setFinalizing(false); }
  };

  const handleDownloadSlipPDF = (slip) => {
    if (!slip) return;
    const empName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';
    const periodStart = slip.period_start ? format(parseUTC(slip.period_start), 'MMMM d, yyyy') : '';
    const periodEnd = slip.period_end ? format(parseUTC(slip.period_end), 'MMMM d, yyyy') : '';
    const deductions = [
      slip.bir_deduction > 0 ? { label: 'BIR Withholding Tax', amount: Number(slip.bir_deduction) } : null,
      slip.sss_deduction > 0 ? { label: 'SSS Contribution', amount: Number(slip.sss_deduction) } : null,
      slip.philhealth_deduction > 0 ? { label: 'PhilHealth', amount: Number(slip.philhealth_deduction) } : null,
      slip.late_deduction > 0 ? { label: 'Late Deduction', amount: Number(slip.late_deduction) } : null,
    ].filter(Boolean);
    const deductionRows = deductions.map(d =>
      `<tr><td style="padding:7px 0;color:#555;font-size:13px;">${d.label}</td><td style="padding:7px 0;text-align:right;color:#dc2626;font-size:13px;">-₱${d.amount.toLocaleString('en-PH', {minimumFractionDigits:2})}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payslip</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#1a1a1a;padding:40px 48px;max-width:600px;margin:0 auto;}
    .top{border-bottom:3px solid #CC0000;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;}
    .top h1{font-size:24px;color:#CC0000;font-weight:800;}.top .sub{font-size:12px;color:#888;margin-top:2px;}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${slip.run_status==='finalized'?'#dcfce7':'#fef9c3'};color:${slip.run_status==='finalized'?'#16a34a':'#ca8a04'};}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
    .info-box{padding:12px 14px;border-radius:8px;border:1px solid #e5e7eb;}
    .info-box .lbl{font-size:10px;text-transform:uppercase;color:#999;letter-spacing:.5px;margin-bottom:3px;}
    .info-box .val{font-size:14px;font-weight:600;color:#1a1a1a;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:.5px;padding:8px 0 4px;border-bottom:1px solid #e5e7eb;margin-bottom:4px;}
    .net{background:#f9fafb;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border:2px solid #CC0000;margin-top:8px;}
    .net .lbl{font-size:13px;font-weight:700;color:#CC0000;}.net .val{font-size:22px;font-weight:800;color:#CC0000;}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#aaa;}
    @media print{body{padding:20px 28px;}}</style></head><body>
    <div class="top"><div><h1>PAYSLIP</h1><div class="sub">Pay Period: ${periodStart} — ${periodEnd}</div></div><span class="badge">${(slip.run_status||'draft').toUpperCase()}</span></div>
    <div class="info">
      <div class="info-box"><div class="lbl">Employee</div><div class="val">${empName}</div></div>
      <div class="info-box"><div class="lbl">Days Present</div><div class="val">${slip.days_present||0} day(s)</div></div>
      <div class="info-box"><div class="lbl">Daily Rate</div><div class="val">₱${Number(slip.daily_rate||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
      <div class="info-box"><div class="lbl">Run #</div><div class="val">${slip.payroll_run_id||'—'}</div></div>
    </div>
    <div class="section-title">Earnings</div>
    <table><tr><td style="padding:7px 0;font-size:13px;">Basic Pay (${slip.days_present||0} days × ₱${Number(slip.daily_rate||0).toLocaleString('en-PH',{minimumFractionDigits:2})})</td><td style="text-align:right;font-weight:600;font-size:13px;">₱${Number(slip.gross_pay||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr></table>
    ${deductions.length>0?`<div class="section-title">Deductions</div><table>${deductionRows}<tr style="border-top:1px solid #e5e7eb;"><td style="padding:7px 0;font-weight:600;font-size:13px;">Total Deductions</td><td style="text-align:right;font-weight:700;color:#dc2626;font-size:13px;">-₱${Number(slip.total_deductions||slip.deductions||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr></table>`:''}
    <div class="net"><div class="lbl">NET PAY</div><div class="val">₱${Number(slip.net_pay||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
    <div class="footer"><div>Generated from Bar Manager System</div><div>Printed: ${format(new Date(),'MMM d, yyyy h:mm a')}</div></div>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const executeCancelRun = async () => {
    setShowCancelModal(false);
    setCancelling(true);
    try {
      await payrollApi.cancelRun(selectedRun.id);
      toast.success('Payroll run cancelled');
      setShowDetailsModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel payroll');
    } finally { setCancelling(false); }
  };

  const handleDownloadPDF = () => {
    if (!runDetails || !selectedRun) return;
    const items = runDetails.items || [];
    const periodStart = selectedRun.period_start ? format(parseUTC(selectedRun.period_start), 'MMM d, yyyy') : '';
    const periodEnd = selectedRun.period_end ? format(parseUTC(selectedRun.period_end), 'MMM d, yyyy') : '';
    const totalNet = items.reduce((s, i) => s + Number(i.net_pay || 0), 0);
    const totalGross = items.reduce((s, i) => s + Number(i.gross_pay || 0), 0);
    const totalDeductions = items.reduce((s, i) => s + Number(i.total_deductions || i.deductions || 0), 0);

    const rows = items.map((item, idx) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${item.first_name || ''} ${item.last_name || ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.days_present || 0}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₱${Number(item.daily_rate || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">₱${Number(item.gross_pay || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;">${item.bir_deduction > 0 ? '₱' + Number(item.bir_deduction).toLocaleString() : '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;">${item.sss_deduction > 0 ? '₱' + Number(item.sss_deduction).toLocaleString() : '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;">${item.philhealth_deduction > 0 ? '₱' + Number(item.philhealth_deduction).toLocaleString() : '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;">₱${Number(item.total_deductions || item.deductions || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#16a34a;">₱${Number(item.net_pay || 0).toLocaleString()}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payroll Report #${selectedRun.id}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:#fff; color:#1a1a1a; padding:40px; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #CC0000; }
      .header h1 { font-size:28px; color:#CC0000; margin-bottom:4px; }
      .header .subtitle { font-size:13px; color:#666; }
      .badge { display:inline-block; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; background:#dcfce7; color:#16a34a; }
      .summary { display:flex; gap:16px; margin-bottom:24px; }
      .summary-card { flex:1; padding:16px; border-radius:10px; border:1px solid #e5e7eb; }
      .summary-card .label { font-size:11px; text-transform:uppercase; color:#888; letter-spacing:0.5px; margin-bottom:4px; }
      .summary-card .value { font-size:22px; font-weight:700; }
      .summary-card .value.red { color:#CC0000; }
      table { width:100%; border-collapse:collapse; font-size:13px; }
      thead th { background:#f8f8f8; padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; color:#666; letter-spacing:0.5px; border-bottom:2px solid #CC0000; }
      .totals td { padding:12px; font-weight:700; border-top:2px solid #1a1a1a; background:#f9fafb; }
      .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:11px; color:#999; }
      @media print { body { padding:20px; } }
    </style></head><body>
    <div class="header">
      <div>
        <h1>Payroll Report</h1>
        <div class="subtitle">Run #${selectedRun.id} &bull; Period: ${periodStart} — ${periodEnd}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge">FINALIZED</div>
        <div style="font-size:12px;color:#888;margin-top:6px;">${runDetails.run?.finalized_at ? format(parseUTC(runDetails.run.finalized_at), 'MMM d, yyyy h:mm a') : ''}</div>
      </div>
    </div>
    <div class="summary">
      <div class="summary-card"><div class="label">Employees</div><div class="value">${items.length}</div></div>
      <div class="summary-card"><div class="label">Total Gross</div><div class="value">₱${totalGross.toLocaleString()}</div></div>
      <div class="summary-card"><div class="label">Total Deductions</div><div class="value" style="color:#dc2626;">₱${totalDeductions.toLocaleString()}</div></div>
      <div class="summary-card"><div class="label">Total Net Pay</div><div class="value red">₱${totalNet.toLocaleString()}</div></div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Employee</th><th style="text-align:center;">Days</th><th style="text-align:right;">Daily Rate</th>
        <th style="text-align:right;">Gross Pay</th><th style="text-align:right;">BIR</th><th style="text-align:right;">SSS</th>
        <th style="text-align:right;">PhilHealth</th><th style="text-align:right;">Total Ded.</th><th style="text-align:right;">Net Pay</th>
      </tr></thead>
      <tbody>${rows}
        <tr class="totals">
          <td colspan="4" style="text-align:right;">TOTALS</td>
          <td style="text-align:right;">₱${totalGross.toLocaleString()}</td>
          <td colspan="3"></td>
          <td style="text-align:right;color:#dc2626;">₱${totalDeductions.toLocaleString()}</td>
          <td style="text-align:right;color:#16a34a;">₱${totalNet.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      <div>Generated from Bar Manager System</div>
      <div>Printed: ${format(new Date(), 'MMM d, yyyy h:mm a')}</div>
    </div>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  if (loading) return <LoadingSpinner />;

  // Employee view - show only their own payroll
  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161616' }}>
            <h4 className="font-semibold text-white">My Payroll History</h4>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>Click any row to view full payslip details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><tr>
                <th className="table-header">Period</th>
                <th className="table-header">Days Present</th>
                <th className="table-header">Daily Rate</th>
                <th className="table-header">Gross Pay</th>
                <th className="table-header">Deductions</th>
                <th className="table-header">Net Pay</th>
                <th className="table-header">Status</th>
              </tr></thead>
              <tbody>
                {myPayroll.map((p) => (
                  <tr key={p.id} className="transition-colors cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={() => { setSelectedSlip(p); setShowSlipModal(true); }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="table-cell">
                      {p.period_start && format(parseUTC(p.period_start), 'MMM d')} – {p.period_end && format(parseUTC(p.period_end), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell text-center">{p.days_present || 0}</td>
                    <td className="table-cell text-center">₱{Number(p.daily_rate || 0).toLocaleString()}</td>
                    <td className="table-cell text-center font-medium">₱{Number(p.gross_pay || 0).toLocaleString()}</td>
                    <td className="table-cell text-center" style={{ color: '#ff6666' }}>₱{Number(p.total_deductions || p.deductions || 0).toLocaleString()}</td>
                    <td className="table-cell text-center font-bold" style={{ color: '#4ade80' }}>₱{Number(p.net_pay || 0).toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={p.run_status === 'finalized' ? 'badge-success' : 'badge-warning'}>{p.run_status || 'draft'}</span>
                    </td>
                  </tr>
                ))}
                {myPayroll.length === 0 && <tr><td colSpan="7" className="text-center py-8" style={{ color: '#555' }}>No payroll records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payslip Detail Modal */}
        {showSlipModal && selectedSlip && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSlipModal(false)}>
            <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161616' }}>
                <div>
                  <h3 className="font-bold text-white">Payslip Details</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                    {selectedSlip.period_start && format(parseUTC(selectedSlip.period_start), 'MMM d')} – {selectedSlip.period_end && format(parseUTC(selectedSlip.period_end), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownloadSlipPDF(selectedSlip)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(204,0,0,0.15)', color: '#ff6666', border: '1px solid rgba(204,0,0,0.3)' }}>
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                  <button onClick={() => setShowSlipModal(false)} className="p-1.5 rounded-lg" style={{ color: '#666' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }}
                  ><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</span>
                  <span className={selectedSlip.run_status === 'finalized' ? 'badge-success' : 'badge-warning'}>{selectedSlip.run_status || 'draft'}</span>
                </div>
                {/* Earnings */}
                <div className="rounded-xl p-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666' }}>Earnings</div>
                  <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: '#ccc' }}>Days Present</span>
                    <span className="text-sm font-medium text-white">{selectedSlip.days_present || 0} day(s)</span>
                  </div>
                  <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: '#ccc' }}>Daily Rate</span>
                    <span className="text-sm font-medium text-white">₱{Number(selectedSlip.daily_rate || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-white">Gross Pay</span>
                    <span className="text-sm font-bold text-white">₱{Number(selectedSlip.gross_pay || 0).toLocaleString()}</span>
                  </div>
                </div>
                {/* Deductions */}
                {(selectedSlip.bir_deduction > 0 || selectedSlip.sss_deduction > 0 || selectedSlip.philhealth_deduction > 0 || selectedSlip.late_deduction > 0) && (
                  <div className="rounded-xl p-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666' }}>Deductions</div>
                    {selectedSlip.bir_deduction > 0 && (
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="text-sm" style={{ color: '#ccc' }}>BIR Withholding Tax</span>
                        <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.bir_deduction).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedSlip.sss_deduction > 0 && (
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="text-sm" style={{ color: '#ccc' }}>SSS Contribution</span>
                        <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.sss_deduction).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedSlip.philhealth_deduction > 0 && (
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="text-sm" style={{ color: '#ccc' }}>PhilHealth</span>
                        <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.philhealth_deduction).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedSlip.late_deduction > 0 && (
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="text-sm" style={{ color: '#ccc' }}>Late Deduction</span>
                        <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.late_deduction).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-semibold text-white">Total Deductions</span>
                      <span className="text-sm font-bold" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.total_deductions || selectedSlip.deductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {/* Net Pay */}
                <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(74,222,128,0.08)', border: '2px solid rgba(74,222,128,0.25)' }}>
                  <span className="text-base font-bold text-white">NET PAY</span>
                  <span className="text-2xl font-extrabold" style={{ color: '#4ade80' }}>₱{Number(selectedSlip.net_pay || 0).toLocaleString()}</span>
                </div>
                {selectedSlip.deduction_items && selectedSlip.deduction_items.length > 0 && (
                  <div className="text-xs space-y-1" style={{ color: '#666' }}>
                    <div className="font-semibold mb-1" style={{ color: '#888' }}>Computation Notes:</div>
                    {selectedSlip.deduction_items.map((item, idx) => (
                      <div key={idx}><span className="font-medium" style={{ color: '#888' }}>{item.deduction_label}:</span> {item.computation_basis}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Manager view - full payroll management
  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" style={{ color: '#CC0000' }} /> Payroll Period</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div><label className="label">Period Start</label><input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="input-field" /></div>
          <div><label className="label">Period End</label><input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="input-field" /></div>
          <button onClick={handlePreview} className="btn-secondary">Preview</button>
          {can('payroll_create') && (
            <button onClick={handleCreateRun} disabled={creating} className="btn-primary flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Payroll
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161616' }}><h4 className="font-semibold text-white">Payroll Preview</h4></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Daily Rate</th>
                <th className="table-header">Days Present</th>
                <th className="table-header">Gross Pay</th>
              </tr></thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="table-cell font-medium text-white">{p.first_name} {p.last_name}</td>
                    <td className="table-cell">₱{Number(p.daily_rate || 0).toLocaleString()}</td>
                    <td className="table-cell">{p.days_present || 0}</td>
                    <td className="table-cell font-bold" style={{ color: '#CC0000' }}>₱{Number(p.gross_pay || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past Runs */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161616' }}><h4 className="font-semibold text-white">Payroll History</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><tr>
              <th className="table-header">ID</th>
              <th className="table-header">Period</th>
              <th className="table-header">Status</th>
              <th className="table-header">Created</th>
              <th className="table-header text-right">Actions</th>
            </tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onClick={() => handleViewDetails(r)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="table-cell font-medium">#{r.id}</td>
                  <td className="table-cell">
                    {r.period_start && format(parseUTC(r.period_start), 'MMM d')} - {r.period_end && format(parseUTC(r.period_end), 'MMM d, yyyy')}
                  </td>
                  <td className="table-cell">
                    <span className={r.status === 'finalized' ? 'badge-success' : 'badge-warning'}>{r.status}</span>
                  </td>
                  <td className="table-cell">{r.created_at ? format(parseUTC(r.created_at), 'MMM d, yyyy') : '—'}</td>
                  <td className="table-cell text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleViewDetails(r); }} className="p-1.5 rounded-lg transition-colors" style={{ color: '#CC0000' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && <tr><td colSpan="5" className="text-center py-8" style={{ color: '#555' }}>No payroll runs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll Details Modal */}
      {showDetailsModal && selectedRun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111111' }}>
              <div>
                <h3 className="font-bold text-white">Payroll Run #{selectedRun.id}</h3>
                <p className="text-sm" style={{ color: '#888' }}>
                  {selectedRun.period_start && format(parseUTC(selectedRun.period_start), 'MMM d')} - {selectedRun.period_end && format(parseUTC(selectedRun.period_end), 'MMM d, yyyy')}
                </p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}><X className="w-5 h-5" /></button>
            </div>

            {runDetails ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg p-4" style={{ background: '#161616' }}>
                    <p className="text-xs uppercase" style={{ color: '#666' }}>Status</p>
                    <p className="text-lg font-bold text-white capitalize">{runDetails.run?.status}</p>
                  </div>
                  <div className="rounded-lg p-4" style={{ background: '#161616' }}>
                    <p className="text-xs uppercase" style={{ color: '#666' }}>Employees</p>
                    <p className="text-lg font-bold text-white">{runDetails.items?.length || 0}</p>
                  </div>
                  <div className="rounded-lg p-4" style={{ background: 'rgba(204,0,0,0.08)' }}>
                    <p className="text-xs uppercase" style={{ color: '#CC0000' }}>Total Amount</p>
                    <p className="text-lg font-bold" style={{ color: '#CC0000' }}>
                      ₱{(runDetails.items || []).reduce((sum, item) => sum + Number(item.net_pay || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <table className="w-full min-w-max">
                    <thead style={{ background: '#161616' }}>
                      <tr>
                        <th className="table-header text-left whitespace-nowrap">Employee</th>
                        <th className="table-header whitespace-nowrap">Daily Rate</th>
                        <th className="table-header whitespace-nowrap">Days</th>
                        <th className="table-header whitespace-nowrap">Gross Pay</th>
                        <th className="table-header whitespace-nowrap">BIR</th>
                        <th className="table-header whitespace-nowrap">SSS</th>
                        <th className="table-header whitespace-nowrap">PhilHealth</th>
                        <th className="table-header whitespace-nowrap">Late</th>
                        <th className="table-header whitespace-nowrap">Total Deductions</th>
                        <th className="table-header whitespace-nowrap">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(runDetails.items || []).map((item) => (
                        <tr key={item.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td className="table-cell">
                            <div>
                              <p className="font-medium text-white">{item.first_name} {item.last_name}</p>
                              <p className="text-xs" style={{ color: '#666' }}>{item.email}</p>
                            </div>
                          </td>
                          <td className="table-cell text-center">₱{Number(item.daily_rate || 0).toLocaleString()}</td>
                          <td className="table-cell text-center">{item.days_present || 0}</td>
                          <td className="table-cell text-center font-medium">₱{Number(item.gross_pay || 0).toLocaleString()}</td>
                          <td className="table-cell text-center text-xs" style={{ color: '#ff6666' }}>
                            {item.bir_deduction > 0 ? `₱${Number(item.bir_deduction).toLocaleString()}` : '—'}
                          </td>
                          <td className="table-cell text-center text-xs" style={{ color: '#ff6666' }}>
                            {item.sss_deduction > 0 ? `₱${Number(item.sss_deduction).toLocaleString()}` : '—'}
                          </td>
                          <td className="table-cell text-center text-xs" style={{ color: '#ff6666' }}>
                            {item.philhealth_deduction > 0 ? `₱${Number(item.philhealth_deduction).toLocaleString()}` : '—'}
                          </td>
                          <td className="table-cell text-center text-xs" style={{ color: '#ff6666' }}>
                            {item.late_deduction > 0 ? `₱${Number(item.late_deduction).toLocaleString()}` : '—'}
                          </td>
                          <td className="table-cell text-center font-medium" style={{ color: '#ff6666' }}>₱{Number(item.total_deductions || item.deductions || 0).toLocaleString()}</td>
                          <td className="table-cell text-center font-bold" style={{ color: '#4ade80' }}>₱{Number(item.net_pay || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {runDetails.run?.status === 'draft' && can('payroll_create') && (
                  <div className="flex justify-between gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => setShowCancelModal(true)} disabled={cancelling} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: 'rgba(239,68,68,0.1)', color: '#ff6666', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Cancel Run
                    </button>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDetailsModal(false)} className="btn-secondary">Close</button>
                      <button onClick={handleFinalize} disabled={finalizing} className="btn-primary flex items-center gap-2">
                        {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Finalize Payroll
                      </button>
                    </div>
                  </div>
                )}

                {runDetails.run?.status === 'finalized' && (
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2" style={{ color: '#4ade80' }}>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Payroll Finalized on {runDetails.run.finalized_at && format(new Date(runDetails.run.finalized_at), 'MMM d, yyyy')}</span>
                    </div>
                    <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download Payroll
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#CC0000' }} />
              </div>
            )}
          </div>
        </div>
      )}
      {/* My Payroll section for staff who also have manager permissions */}
      {canViewOwn && myPayroll.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161616' }}>
            <h4 className="font-semibold text-white">My Payroll</h4>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>Click any row to view full payslip details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><tr>
                <th className="table-header">Period</th>
                <th className="table-header">Days Present</th>
                <th className="table-header">Daily Rate</th>
                <th className="table-header">Gross Pay</th>
                <th className="table-header">Deductions</th>
                <th className="table-header">Net Pay</th>
                <th className="table-header">Status</th>
              </tr></thead>
              <tbody>
                {myPayroll.map((p) => (
                  <tr key={p.id} className="transition-colors cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={() => { setSelectedSlip(p); setShowSlipModal(true); }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="table-cell">
                      {p.period_start && format(parseUTC(p.period_start), 'MMM d')} – {p.period_end && format(parseUTC(p.period_end), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell text-center">{p.days_present || 0}</td>
                    <td className="table-cell text-center">₱{Number(p.daily_rate || 0).toLocaleString()}</td>
                    <td className="table-cell text-center font-medium">₱{Number(p.gross_pay || 0).toLocaleString()}</td>
                    <td className="table-cell text-center" style={{ color: '#ff6666' }}>₱{Number(p.total_deductions || p.deductions || 0).toLocaleString()}</td>
                    <td className="table-cell text-center font-bold" style={{ color: '#4ade80' }}>₱{Number(p.net_pay || 0).toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={p.run_status === 'finalized' ? 'badge-success' : 'badge-warning'}>{p.run_status || 'draft'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Detail Modal (shared for manager My Payroll section) */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSlipModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161616' }}>
              <div>
                <h3 className="font-bold text-white">Payslip Details</h3>
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                  {selectedSlip.period_start && format(new Date(selectedSlip.period_start), 'MMM d')} – {selectedSlip.period_end && format(new Date(selectedSlip.period_end), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadSlipPDF(selectedSlip)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(204,0,0,0.15)', color: '#ff6666', border: '1px solid rgba(204,0,0,0.3)' }}>
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button onClick={() => setShowSlipModal(false)} className="p-1.5 rounded-lg" style={{ color: '#666' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }}
                ><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</span>
                <span className={selectedSlip.run_status === 'finalized' ? 'badge-success' : 'badge-warning'}>{selectedSlip.run_status || 'draft'}</span>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666' }}>Earnings</div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#ccc' }}>Days Present</span>
                  <span className="text-sm font-medium text-white">{selectedSlip.days_present || 0} day(s)</span>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#ccc' }}>Daily Rate</span>
                  <span className="text-sm font-medium text-white">₱{Number(selectedSlip.daily_rate || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-semibold text-white">Gross Pay</span>
                  <span className="text-sm font-bold text-white">₱{Number(selectedSlip.gross_pay || 0).toLocaleString()}</span>
                </div>
              </div>
              {(selectedSlip.bir_deduction > 0 || selectedSlip.sss_deduction > 0 || selectedSlip.philhealth_deduction > 0 || selectedSlip.late_deduction > 0) && (
                <div className="rounded-xl p-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#666' }}>Deductions</div>
                  {selectedSlip.bir_deduction > 0 && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm" style={{ color: '#ccc' }}>BIR Withholding Tax</span>
                      <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.bir_deduction).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedSlip.sss_deduction > 0 && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm" style={{ color: '#ccc' }}>SSS Contribution</span>
                      <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.sss_deduction).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedSlip.philhealth_deduction > 0 && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm" style={{ color: '#ccc' }}>PhilHealth</span>
                      <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.philhealth_deduction).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedSlip.late_deduction > 0 && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm" style={{ color: '#ccc' }}>Late Deduction</span>
                      <span className="text-sm font-medium" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.late_deduction).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-white">Total Deductions</span>
                    <span className="text-sm font-bold" style={{ color: '#ff6666' }}>-₱{Number(selectedSlip.total_deductions || selectedSlip.deductions || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(74,222,128,0.08)', border: '2px solid rgba(74,222,128,0.25)' }}>
                <span className="text-base font-bold text-white">NET PAY</span>
                <span className="text-2xl font-extrabold" style={{ color: '#4ade80' }}>₱{Number(selectedSlip.net_pay || 0).toLocaleString()}</span>
              </div>
              {selectedSlip.deduction_items && selectedSlip.deduction_items.length > 0 && (
                <div className="text-xs space-y-1" style={{ color: '#666' }}>
                  <div className="font-semibold mb-1" style={{ color: '#888' }}>Computation Notes:</div>
                  {selectedSlip.deduction_items.map((item, idx) => (
                    <div key={idx}><span className="font-medium" style={{ color: '#888' }}>{item.deduction_label}:</span> {item.computation_basis}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        onConfirm={executeFinalize}
        title="Finalize Payroll?"
        message="This payroll run will be finalized and cannot be undone. All employee payslips will be locked."
        confirmText="Finalize"
        type="warning"
      />
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={executeCancelRun}
        title="Cancel Payroll Run?"
        message="This will permanently delete this draft payroll run and all its items. This action cannot be undone."
        confirmText="Cancel Run"
        type="danger"
      />
    </div>
  );
};

export default Payroll;
