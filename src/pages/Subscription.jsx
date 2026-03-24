import React, { useState, useEffect } from 'react';
import {
  Crown, Check, X, CreditCard, Loader2, ArrowRight, Shield,
  Zap, Building2, Star, AlertTriangle, ChevronRight, Clock,
} from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';
import { paymentApi } from '../api/paymentApi';
import useAuthStore from '../stores/authStore';
import useBranchStore from '../stores/branchStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PAYMENT_METHODS = [
  { id: 'gcash', label: 'GCash', icon: '💚', desc: 'Pay via GCash e-wallet' },
  { id: 'paymaya', label: 'PayMaya', icon: '💜', desc: 'Pay via PayMaya e-wallet' },
];

const PLAN_ICONS = {
  free: Shield,
  basic: Zap,
  premium: Crown,
};

const PLAN_COLORS = {
  free: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', accent: 'text-gray-600' },
  basic: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', accent: 'text-blue-600' },
  premium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', accent: 'text-amber-600' },
};

const Subscription = () => {
  const { user } = useAuthStore();
  const { fetchBranches } = useBranchStore();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getMySubscription(),
      ]);
      setPlans(plansRes.data.data || plansRes.data || []);
      setMySub(subRes.data.data || subRes.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const currentPlanName = mySub?.subscription?.plan_name || mySub?.tier || 'free';
  const hasPending = !!mySub?.pending_subscription;

  const handleSelectPlan = (plan) => {
    if (plan.name === currentPlanName) return;
    if (hasPending) return; // Already has a pending request
    if (plan.price === 0 || plan.price === '0.00') return;
    setSelectedPlan(plan);
    setPaymentMethod('');
    setPaymentRef('');
    setShowPayment(true);
  };

  const handleSubscribe = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      const { data } = await paymentApi.subscribeWithPayment({
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
      });
      
      if (data.data?.checkout_url) {
        toast.success('Redirecting to payment...');
        // Redirect to PayMongo checkout
        window.location.href = data.data.checkout_url;
      } else {
        toast.success(data.message || 'Subscription created!');
        setShowPayment(false);
        setSelectedPlan(null);
        await loadData();
        await fetchBranches();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await subscriptionApi.cancel();
      toast.success(data.message || 'Subscription cancelled');
      setShowCancel(false);
      await loadData();
      await fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Current Plan Banner */}
      {mySub && (
        <div className="card border-0" style={{ background: 'linear-gradient(135deg, #1a0000, #0a0a1a)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Current Plan</p>
              <h2 className="text-2xl font-bold mt-1">
                {mySub.subscription?.display_name || 'Free'} Plan
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                <span><Building2 className="w-3.5 h-3.5 inline mr-1" />{mySub.usage?.bars || 0} branches</span>
                <span><Star className="w-3.5 h-3.5 inline mr-1" />{mySub.usage?.events || 0} events</span>
                <span><Zap className="w-3.5 h-3.5 inline mr-1" />{mySub.usage?.promotions || 0} promos</span>
              </div>
              {mySub.expires_at && (
                <p className="text-xs text-white/60 mt-2">
                  {mySub.tier !== 'free' ? `Renews ${new Date(mySub.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
                </p>
              )}
            </div>
            {(mySub.tier !== 'free' || hasPending) && (
              <button
                onClick={() => setShowCancel(true)}
                className="self-start px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {hasPending && !mySub.subscription ? 'Cancel Request' : 'Cancel Plan'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Subscription Banner */}
      {hasPending && (
        <div className="card" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <Clock className="w-5 h-5" style={{ color: '#60a5fa' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#60a5fa' }}>Processing Payment</h3>
              <p className="text-sm mt-0.5" style={{ color: '#888' }}>
                Your <strong className="text-white">{mySub.pending_subscription.display_name}</strong> plan upgrade
                (₱{Number(mySub.pending_subscription.price).toLocaleString()}/{mySub.pending_subscription.billing_period})
                is being processed. Your subscription will be activated automatically once payment is confirmed.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#60a5fa' }}>
                <span>Payment: <strong className="capitalize">{mySub.pending_subscription.payment_method}</strong></span>
                <span>Ref: <strong>{mySub.pending_subscription.payment_reference}</strong></span>
                <span>Submitted: {new Date(mySub.pending_subscription.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Choose Your Plan</h3>
        <p className="text-sm mb-4" style={{ color: '#888' }}>Upgrade to add more branches, events, and promotions for your bars.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const colors = PLAN_COLORS[plan.name] || PLAN_COLORS.free;
            const Icon = PLAN_ICONS[plan.name] || Shield;
            const isCurrent = plan.name === currentPlanName;
            const isPendingPlan = hasPending && plan.id === mySub.pending_subscription?.plan_id;
            const isDowngrade = plan.sort_order < (plans.find((p) => p.name === currentPlanName)?.sort_order ?? -1);
            const isFree = Number(plan.price) === 0;

            return (
              <div
                key={plan.id}
                className="relative rounded-2xl p-6 transition-all"
                style={isCurrent
                  ? { border: '2px solid #CC0000', background: 'rgba(204,0,0,0.05)', boxShadow: '0 0 20px rgba(204,0,0,0.1)' }
                  : { border: '1px solid rgba(255,255,255,0.08)', background: '#111111' }
                }
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: '#CC0000', color: '#fff' }}>
                    Current Plan
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(204,0,0,0.12)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#CC0000' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{plan.display_name}</h4>
                    <p className="text-xs" style={{ color: '#666' }}>{plan.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-white">
                    {isFree ? 'Free' : `₱${Number(plan.price).toLocaleString()}`}
                  </span>
                  {!isFree && <span className="text-sm ml-1" style={{ color: '#666' }}>/{plan.billing_period}</span>}
                </div>

                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                    <span><strong className="text-white">{plan.max_bars}</strong> branch{plan.max_bars > 1 ? 'es' : ''}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                    <span>{plan.max_events ? `${plan.max_events} events` : 'Unlimited events'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                    <span>{plan.max_promotions ? `${plan.max_promotions} promotions` : 'Unlimited promotions'}</span>
                  </li>
                  {plan.name === 'premium' && (
                    <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                      <span>Priority support</span>
                    </li>
                  )}
                </ul>

                {isCurrent ? (
                  <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.06)', color: '#555' }}>
                    Current Plan
                  </button>
                ) : isPendingPlan ? (
                  <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                    <Clock className="w-4 h-4" /> Upgrade pending...
                  </button>
                ) : isFree || isDowngrade ? (
                  <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.06)', color: '#555' }}>
                    {isDowngrade ? 'Downgrade' : 'Free Tier'}
                  </button>
                ) : hasPending ? (
                  <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.06)', color: '#555' }}>
                    Upgrade pending...
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ background: '#CC0000', color: '#fff' }}
                  >
                    Upgrade to {plan.display_name} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      {mySub?.subscription && (
        <div className="card">
          <h3 className="font-bold text-white mb-3">Billing Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p style={{ color: '#666' }}>Amount</p>
              <p className="font-semibold text-white">₱{Number(mySub.subscription.amount_paid || 0).toLocaleString()}</p>
            </div>
            <div>
              <p style={{ color: '#666' }}>Payment Method</p>
              <p className="font-semibold text-white capitalize">{mySub.subscription.payment_method || '—'}</p>
            </div>
            <div>
              <p style={{ color: '#666' }}>Started</p>
              <p className="font-semibold text-white">{mySub.subscription.starts_at ? new Date(mySub.subscription.starts_at).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p style={{ color: '#666' }}>Expires</p>
              <p className="font-semibold text-white">{mySub.subscription.expires_at ? new Date(mySub.subscription.expires_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !processing && setShowPayment(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a0000, #0a0a1a)' }}>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Upgrading to</p>
              <h3 className="text-xl font-bold text-white">{selectedPlan.display_name} Plan</h3>
              <p className="text-2xl font-extrabold mt-1 text-white">
                ₱{Number(selectedPlan.price).toLocaleString()}
                <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>/{selectedPlan.billing_period}</span>
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-xl p-4" style={{ background: '#161616' }}>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#666' }}>What you'll get</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                    <Check className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                    Up to {selectedPlan.max_bars} branches
                  </li>
                  <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                    <Check className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                    {selectedPlan.max_events ? `${selectedPlan.max_events} events` : 'Unlimited events'}
                  </li>
                  <li className="flex items-center gap-2 text-sm" style={{ color: '#ccc' }}>
                    <Check className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                    {selectedPlan.max_promotions ? `${selectedPlan.max_promotions} promotions` : 'Unlimited promotions'}
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2 text-white">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl text-left transition-all"
                      style={paymentMethod === pm.id
                        ? { border: '2px solid #CC0000', background: 'rgba(204,0,0,0.08)' }
                        : { border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }
                      }
                    >
                      <span className="text-lg">{pm.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{pm.label}</p>
                        <p className="text-[10px]" style={{ color: '#666' }}>{pm.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#60a5fa' }}>Secure Online Payment</p>
                      <p className="text-xs" style={{ color: '#888' }}>
                        You'll be redirected to {paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'} to complete your payment securely. Your subscription will be activated instantly upon successful payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPayment(false)}
                  disabled={processing}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubscribe}
                  disabled={processing || !paymentMethod}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Proceed to Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !cancelling && setShowCancel(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(204,0,0,0.12)' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#ff6666' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {hasPending && !mySub.subscription ? 'Cancel Upgrade Request?' : 'Cancel Subscription?'}
            </h3>
            {hasPending && !mySub.subscription ? (
              <p className="text-sm mb-5" style={{ color: '#888' }}>Your pending <strong className="text-white">{mySub.pending_subscription?.display_name}</strong> plan request will be cancelled.</p>
            ) : (
              <>
                <p className="text-sm mb-1" style={{ color: '#888' }}>You'll be reverted to the <strong className="text-white">Free plan</strong>.</p>
                <p className="text-sm mb-5" style={{ color: '#888' }}>Extra branches beyond 1 will be <strong className="text-white">locked</strong> and inaccessible until you resubscribe.</p>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} disabled={cancelling} className="btn-secondary flex-1">
                Keep Plan
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                {cancelling ? 'Cancelling...' : 'Cancel Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
