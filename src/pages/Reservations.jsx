import React, { useState, useEffect, useCallback } from 'react';
import { Search, Check, X as XIcon, Ban, CalendarCheck, Clock, Users, Hash, CreditCard, Package, User, MapPin, FileText, Loader2 } from 'lucide-react';
import { reservationApi } from '../api/reservationApi';
import { usePermission } from '../hooks/usePermission';
import { format } from 'date-fns';
import { parseUTC } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

const statusColors = {
  pending:   'badge-warning',
  approved:  'badge-success',
  confirmed: 'badge-success',
  rejected:  'badge-danger',
  cancelled: 'badge-gray',
};

const ReservationDetail = ({ detail, onClose }) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="px-5 py-4 flex items-center justify-between rounded-xl" style={{ background: 'linear-gradient(135deg, #1a0000, #0a0a1a)' }}>
      <div>
        <p className="text-xs font-medium" style={{ color: '#CC0000' }}>Transaction</p>
        <p className="text-lg font-bold text-white">#{detail.transaction_number || '—'}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={statusColors[detail.status] || 'badge-gray'}>{detail.status}</span>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#666' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}>
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>

    <div className="space-y-4">
      {/* Customer + Reservation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: '#CC0000' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Customer</span>
          </div>
          <p className="text-sm font-medium text-white">
            {detail.first_name ? `${detail.first_name} ${detail.last_name}` : (detail.guest_name || 'Guest')}
          </p>
          {(detail.email || detail.guest_email) && <p className="text-xs" style={{ color: '#666' }}>{detail.email || detail.guest_email}</p>}
          {(detail.phone_number || detail.guest_phone) && <p className="text-xs" style={{ color: '#666' }}>{detail.phone_number || detail.guest_phone}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: '#CC0000' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Reservation</span>
          </div>
          <p className="text-sm text-white">
            <span className="font-medium">Table {detail.table_number || detail.table_id}</span>
            {detail.capacity && <span style={{ color: '#666' }}> (cap: {detail.capacity})</span>}
          </p>
          {detail.table_price != null && Number(detail.table_price) > 0 && (
            <p className="text-xs" style={{ color: '#aaa' }}>Table rate: <span className="font-medium text-white">₱{Number(detail.table_price).toLocaleString()}</span></p>
          )}
          {detail.deposit_amount != null && Number(detail.deposit_amount) > 0 && (
            <p className="text-xs" style={{ color: '#aaa' }}>Deposit paid: <span className="font-medium" style={{ color: '#4ade80' }}>₱{Number(detail.deposit_amount).toLocaleString()}</span></p>
          )}
          <p className="text-xs" style={{ color: '#ccc' }}>
            {detail.reservation_date ? format(parseUTC(detail.reservation_date), 'MMM d, yyyy') : '—'}
            {detail.reservation_time ? ` at ${detail.reservation_time}` : ''}
          </p>
          <p className="text-xs" style={{ color: '#666' }}>{detail.party_size} guest{detail.party_size !== 1 ? 's' : ''}</p>
          {detail.occasion && <p className="text-xs" style={{ color: '#666' }}>Occasion: {detail.occasion}</p>}
        </div>
      </div>

      {/* Items Ordered */}
      {detail.items && detail.items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4" style={{ color: '#CC0000' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Items Ordered</span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th className="text-left text-xs font-medium px-3 py-2" style={{ color: '#888' }}>Item</th>
                  <th className="text-center text-xs font-medium px-3 py-2" style={{ color: '#888' }}>Qty</th>
                  <th className="text-right text-xs font-medium px-3 py-2" style={{ color: '#888' }}>Price</th>
                  <th className="text-right text-xs font-medium px-3 py-2" style={{ color: '#888' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2 text-sm text-white">{item.menu_name}</td>
                    <td className="px-3 py-2 text-sm text-center" style={{ color: '#ccc' }}>x{item.quantity}</td>
                    <td className="px-3 py-2 text-sm text-right" style={{ color: '#888' }}>₱{Number(item.unit_price).toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-white">₱{Number(item.line_total).toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td colSpan="3" className="px-3 py-2 text-sm font-semibold text-right" style={{ color: '#888' }}>Total</td>
                  <td className="px-3 py-2 text-sm font-bold text-right" style={{ color: '#CC0000' }}>₱{Number(detail.total_amount || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment */}
      {detail.payment && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4" style={{ color: '#CC0000' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Payment</span>
          </div>
          <div className="rounded-lg px-4 py-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#888' }}>Method</span>
              <span className="text-sm font-medium text-white capitalize">{detail.payment.payment_method || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#888' }}>Amount</span>
              <span className="text-sm font-medium text-white">₱{Number(detail.payment.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#888' }}>Status</span>
              <span className="text-sm font-medium" style={{ color: detail.payment.status === 'paid' ? '#4ade80' : '#fbbf24' }}>{detail.payment.status}</span>
            </div>
            {detail.payment.paid_at && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: '#888' }}>Paid at</span>
                <span className="text-sm" style={{ color: '#ccc' }}>{format(parseUTC(detail.payment.paid_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {detail.payment.reference_id && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: '#888' }}>Ref</span>
                <span className="text-xs font-mono" style={{ color: '#666' }}>{detail.payment.reference_id}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {detail.notes && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4" style={{ color: '#CC0000' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Notes</span>
          </div>
          <p className="text-sm" style={{ color: '#aaa' }}>{detail.notes}</p>
        </div>
      )}
    </div>
  </div>
);

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { can } = usePermission();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, action: null });
  const [txnSearch, setTxnSearch] = useState('');
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnDetail, setTxnDetail] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rowLoading, setRowLoading] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await reservationApi.list();
      setReservations(data.data || data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAction = (id, action) => {
    setConfirmModal({ isOpen: true, id, action });
  };

  const executeAction = async () => {
    const { id, action } = confirmModal;
    try {
      if (action === 'approved') await reservationApi.approve(id);
      else if (action === 'rejected') await reservationApi.reject(id);
      else await reservationApi.cancel(id);
      toast.success('Reservation updated');
      setConfirmModal({ isOpen: false, id: null, action: null });
      load();
    } catch { toast.error('Failed to update reservation'); }
  };

  const fetchDetail = useCallback(async (txn) => {
    if (!txn) return null;
    const { data } = await reservationApi.lookup(txn);
    return data.data || data;
  }, []);

  const handleLookup = async () => {
    const q = txnSearch.trim();
    if (!q) return toast.error('Enter a transaction number');
    try {
      setTxnLoading(true);
      const detail = await fetchDetail(q);
      setTxnDetail(detail);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Reservation not found';
      toast.error(msg);
      setTxnDetail(null);
    } finally {
      setTxnLoading(false);
    }
  };

  const handleRowClick = async (r) => {
    if (!r.transaction_number) {
      toast.error('No transaction number for this reservation');
      return;
    }
    try {
      setRowLoading(r.id);
      const detail = await fetchDetail(r.transaction_number);
      setSelectedReservation(detail);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not load reservation details';
      toast.error(msg);
    } finally {
      setRowLoading(null);
    }
  };

  const filtered = reservations.filter((r) => {
    const matchSearch = (r.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.guest_email || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const stats = {
    total: reservations.length,
    today: reservations.filter(r => {
      try { return r.reservation_date?.split('T')[0] === todayStr; } catch { return false; }
    }).length,
    paid: reservations.filter(r => r.payment_status === 'paid').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card py-4"><p className="text-xs" style={{ color: '#888' }}>Total</p><p className="text-xl font-bold text-white">{stats.total}</p></div>
        <div className="card py-4"><p className="text-xs" style={{ color: '#888' }}>Today</p><p className="text-xl font-bold" style={{ color: '#CC0000' }}>{stats.today}</p></div>
        <div className="card py-4"><p className="text-xs" style={{ color: '#888' }}>Paid</p><p className="text-xl font-bold" style={{ color: '#4ade80' }}>{stats.paid}</p></div>
        <div className="card py-4"><p className="text-xs" style={{ color: '#888' }}>Cancelled</p><p className="text-xl font-bold" style={{ color: '#666' }}>{stats.cancelled}</p></div>
      </div>

      {/* Transaction Lookup */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4" style={{ color: '#CC0000' }} />
          <h3 className="text-sm font-semibold text-white">Transaction Lookup</h3>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 sm:max-w-md" style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search className="w-4 h-4" style={{ color: '#555' }} />
            <input
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="Enter transaction number (e.g. RES-20260322-XXXXXX)"
              className="bg-transparent text-sm outline-none flex-1 text-white placeholder-gray-600"
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={txnLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: '#CC0000' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#a00'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#CC0000'; }}
          >
            {txnLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Transaction Detail */}
        {txnDetail && (
          <div className="mt-4 rounded-xl overflow-hidden p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}>
            <ReservationDetail detail={txnDetail} onClose={() => setTxnDetail(null)} />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 sm:max-w-xs" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-4 h-4" style={{ color: '#555' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest..." className="bg-transparent text-sm outline-none flex-1 text-white placeholder-gray-600" />
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={filter === f ? { background: '#CC0000', color: '#fff' } : { color: '#888' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <tr>
                <th className="table-header">Guest</th>
                <th className="table-header">Date & Time</th>
                <th className="table-header">Party Size</th>
                <th className="table-header">Table</th>
                <th className="table-header">Status</th>
                <th className="table-header">Payment</th>
                {can('RESERVATION_MANAGE') && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onClick={() => handleRowClick(r)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {rowLoading === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: '#CC0000' }} />}
                      <div>
                        <p className="font-medium text-white">{r.guest_name || 'N/A'}</p>
                        <p className="text-xs" style={{ color: '#666' }}>{r.guest_email || r.guest_phone || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" style={{ color: '#555' }} />
                      <span>{r.reservation_date ? format(parseUTC(r.reservation_date), 'MMM d, yyyy') : '—'}</span>
                    </div>
                    {r.reservation_time && (
                      <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: '#666' }}>
                        <Clock className="w-3 h-3" /> {r.reservation_time}
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1" style={{ color: '#ccc' }}><Users className="w-3.5 h-3.5" style={{ color: '#555' }} /> {r.party_size || '—'}</div>
                  </td>
                  <td className="table-cell">{r.table_number ? `#${r.table_number}` : (r.table_id ? `#${r.table_id}` : '—')}</td>
                  <td className="table-cell">
                    <span className={statusColors[r.status] || 'badge-gray'}>{r.status}</span>
                    {r.status === 'cancelled' && r.payment_status === 'paid' && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: '#f59e0b' }}>⚠ Refund needed</p>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-medium" style={{ color: r.payment_status === 'paid' ? '#4ade80' : '#666' }}>
                      {r.payment_status || '—'}
                    </span>
                    {r.deposit_amount > 0 && <p className="text-xs" style={{ color: '#666' }}>₱{Number(r.deposit_amount).toLocaleString()}</p>}
                  </td>
                  {can('RESERVATION_MANAGE') && (
                    <td className="table-cell text-right">
                      {r.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'approved'); }} className="p-1.5 rounded-lg transition-colors" style={{ color: '#4ade80' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            title="Approve"><Check className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'rejected'); }} className="p-1.5 rounded-lg transition-colors" style={{ color: '#ff6666' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            title="Reject"><XIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'cancelled'); }} className="p-1.5 rounded-lg transition-colors" style={{ color: '#666' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
                          title="Cancel">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center py-8" style={{ color: '#555' }}>No reservations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Row Click Detail Modal */}
      {selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setSelectedReservation(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden overflow-y-auto"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <ReservationDetail detail={selectedReservation} onClose={() => setSelectedReservation(null)} />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, action: null })}
        onConfirm={executeAction}
        title={
          confirmModal.action === 'approved' ? 'Approve Reservation?' :
          confirmModal.action === 'rejected' ? 'Reject Reservation?' : 'Cancel Reservation?'
        }
        message={
          confirmModal.action === 'approved' ? 'This reservation will be approved and the customer will be notified.' :
          confirmModal.action === 'rejected' ? 'This reservation will be rejected and the customer will be notified.' :
          'This reservation will be cancelled.'
        }
        confirmText={
          confirmModal.action === 'approved' ? 'Approve' :
          confirmModal.action === 'rejected' ? 'Reject' : 'Cancel'
        }
        type={confirmModal.action === 'approved' ? 'info' : 'danger'}
      />
    </div>
  );
};

export default Reservations;
