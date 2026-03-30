import React, { useState, useRef, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Upload, X, FileText, CheckCircle } from 'lucide-react';
import FileDropZone from '../components/FileDropZone';
import OCRDocumentScanner from '../components/OCRDocumentScanner';
import useAuthStore from '../stores/authStore';
import { authApi } from '../api/authApi';
import logoImg from '../../logo.png';
import { CAVITE_CITIES, getBarangaysForCity } from '../utils/caviteLocations';

const STEPS = ['Owner Account', 'Bar Details', 'Documents', 'Confirm'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BAR_TYPE_OPTIONS = ['Restobar', 'Bar', 'Comedy Bar', 'KTV', 'Club'];

const TIMES = (() => {
  const list = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      list.push(`${hour}:${m === 0 ? '00' : '30'} ${ampm}`);
    }
  }
  return list;
})();

// ─── Reusable dark input ───
const DarkInput = ({ label, error, ...props }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>
      {label}
    </label>
    <input
      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'}`, fontFamily: "'DM Sans', Inter, sans-serif" }}
      onFocus={(e) => { e.target.style.borderColor = 'rgba(204,0,0,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,0,0,0.08)'; }}
      onBlur={(e) => { e.target.style.borderColor = error ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
    {error && <p className="mt-1 text-xs" style={{ color: '#ff6666', fontFamily: "'DM Sans', Inter, sans-serif" }}>{error}</p>}
  </div>
);

const DarkSelect = ({ label, error, children, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>
        {label}
      </label>
    )}
    <select
      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'}`, fontFamily: "'DM Sans', Inter, sans-serif" }}
      onFocus={(e) => { e.target.style.borderColor = 'rgba(204,0,0,0.5)'; }}
      onBlur={(e) => { e.target.style.borderColor = error ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'; }}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs" style={{ color: '#ff6666', fontFamily: "'DM Sans', Inter, sans-serif" }}>{error}</p>}
  </div>
);

const DarkTextarea = ({ label, error, ...props }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>
      {label}
    </label>
    <textarea
      rows={3}
      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200 resize-none"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'}`, fontFamily: "'DM Sans', Inter, sans-serif" }}
      onFocus={(e) => { e.target.style.borderColor = 'rgba(204,0,0,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,0,0,0.08)'; }}
      onBlur={(e) => { e.target.style.borderColor = error ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
    {error && <p className="mt-1 text-xs" style={{ color: '#ff6666', fontFamily: "'DM Sans', Inter, sans-serif" }}>{error}</p>}
  </div>
);

// ─── Step indicator ───
const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: done ? '#CC0000' : active ? 'rgba(204,0,0,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${done || active ? '#CC0000' : 'rgba(255,255,255,0.1)'}`,
                color: done || active ? '#fff' : '#555',
                fontFamily: "'DM Sans', Inter, sans-serif",
              }}
            >
              {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: active ? '#CC0000' : done ? '#888' : '#444', fontFamily: "'DM Sans', Inter, sans-serif" }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="h-[1.5px] w-12 sm:w-20 mx-2 mb-5 transition-all duration-300"
              style={{ background: i < current ? '#CC0000' : 'rgba(255,255,255,0.08)' }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main component ───
const Register = () => {
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2
  const [barName, setBarName] = useState('');
  const [barAddress, setBarAddress] = useState('');
  const [barCity, setBarCity] = useState('');
  const [barBarangay, setBarBarangay] = useState('');
  const [barDesc, setBarDesc] = useState('');
  const [barTypes, setBarTypes] = useState([]);
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashName, setGcashName] = useState('');
  const [operatingHours, setOperatingHours] = useState([{ day: 'Monday', open: '', close: '' }]);

  // Step 3
  const [birFile, setBirFile] = useState(null);
  const [permitFile, setPermitFile] = useState(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState(null);
  
  // OCR extracted data
  const [birNumber, setBirNumber] = useState('');
  const [birExpiry, setBirExpiry] = useState('');
  const [permitNumber, setPermitNumber] = useState('');
  const [permitExpiry, setPermitExpiry] = useState('');

  // Field errors
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validateStep1 = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email is required';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!barName.trim()) e.barName = 'Bar name is required';
    if (!barAddress.trim()) e.barAddress = 'Bar address is required';
    if (!barCity) e.barCity = 'City is required';
    if (!barBarangay) e.barBarangay = 'Barangay is required';
    if (!gcashNumber.trim()) e.gcashNumber = 'GCash number is required for payouts';
    else if (!/^09\d{9}$/.test(gcashNumber.trim())) e.gcashNumber = 'Must be a valid 09XXXXXXXXX number';
    if (!gcashName.trim()) e.gcashName = 'GCash account name is required';
    const hasValidHours = operatingHours.some(h => h.day && h.open && h.close);
    if (!hasValidHours) e.operatingHours = 'Add at least one operating day with open and close times';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!birFile) e.birFile = 'BIR Certificate is required';
    if (!permitFile) e.permitFile = 'Business Permit is required';
    if (!selfieWithIdFile) e.selfieWithIdFile = 'Photo holding your ID is required';
    const maxSize = 5 * 1024 * 1024;
    if (birFile && birFile.size > maxSize) e.birFile = 'File must be under 5 MB';
    if (permitFile && permitFile.size > maxSize) e.permitFile = 'File must be under 5 MB';
    if (selfieWithIdFile && selfieWithIdFile.size > maxSize) e.selfieWithIdFile = 'File must be under 5 MB';
    if (selfieWithIdFile && !/image\/(jpeg|png)/.test(selfieWithIdFile.type)) e.selfieWithIdFile = 'Only JPG and PNG images are allowed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    setGlobalError('');
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    if (step === 2 && !validateStep3()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setSubmitting(true);
    setGlobalError('');
    try {
      const fd = new FormData();
      fd.append('first_name', firstName.trim());
      if (middleName.trim()) fd.append('middle_name', middleName.trim());
      fd.append('last_name', lastName.trim());
      fd.append('email', email.trim().toLowerCase());
      fd.append('password', password);
      fd.append('phone_number', phone.trim());
      const hoursStr = operatingHours
        .filter(h => h.day && h.open && h.close)
        .map(h => `${h.day}: ${h.open} – ${h.close}`)
        .join(', ');
      fd.append('bar_name', barName.trim());
      fd.append('bar_address', barAddress.trim());
      fd.append('bar_city', barCity);
      fd.append('bar_barangay', barBarangay);
      fd.append('bar_description', barDesc.trim());
      fd.append('bar_types', JSON.stringify(barTypes));
      fd.append('opening_time', hoursStr);
      fd.append('closing_time', '');
      fd.append('gcash_number', gcashNumber.trim());
      fd.append('gcash_name', gcashName.trim());
      fd.append('bir_certificate', birFile);
      fd.append('business_permit', permitFile);
      fd.append('selfie_with_id', selfieWithIdFile);
      // Add permit expiry date if extracted from OCR
      if (permitExpiry) {
        fd.append('permit_expiry_date', permitExpiry);
      }

      await authApi.registerBarOwner(fd);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ───
  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#0A0A0A', backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(204,0,0,0.1) 0%, transparent 60%)' }}
      >
        <div className="w-full max-w-md text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.3)', boxShadow: '0 0 30px rgba(204,0,0,0.15)' }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: '#CC0000' }} />
          </div>
          <h2
            className="text-white mb-4"
            style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            CHECK YOUR EMAIL
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#888', fontFamily: "'DM Sans', Inter, sans-serif" }}>
            Your registration has been submitted. Please verify your email address to continue. After verifying, your account will show <strong style={{ color: '#ccc' }}>Pending Admin Approval</strong> and we will notify you once approved.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-300"
            style={{ background: '#CC0000', boxShadow: '0 0 25px rgba(204,0,0,0.35)', fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: '#0A0A0A',
        backgroundImage: 'radial-gradient(ellipse at 60% 10%, rgba(204,0,0,0.08) 0%, transparent 60%)',
      }}
    >
      {/* Grain overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px',
        }}
      />

      <div className="relative w-full max-w-xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logoImg} alt="The Party Goers PH" className="w-16 h-16 object-contain" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-white"
            style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', letterSpacing: '0.05em' }}
          >
            REGISTER YOUR BAR
          </h1>
          <p style={{ color: '#666', fontSize: '0.875rem', fontFamily: "'DM Sans', Inter, sans-serif" }}>
            Join the Platform Bar System
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 60px rgba(204,0,0,0.06), 0 30px 60px rgba(0,0,0,0.5)',
          }}
        >
          <StepIndicator current={step} />

          <div
            className="mb-6 text-sm rounded-xl px-4 py-3"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: '#fbbf24', fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            <span className="font-semibold">IMPORTANT:</span> Illegal bars, adult entertainment establishments, and bars without complete business permits are NOT accepted on this platform. Submitting false information will result in rejection.
          </div>

          {globalError && (
            <div
              className="mb-6 text-sm rounded-lg px-4 py-3"
              style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.3)', color: '#ff6666', fontFamily: "'DM Sans', Inter, sans-serif" }}
            >
              {globalError}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* ─── STEP 1: Owner Account ─── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <DarkInput label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" error={errors.firstName} />
                  <DarkInput label="Middle Name (Optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Santos" />
                  <DarkInput label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="dela Cruz" error={errors.lastName} />
                </div>
                <DarkInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} />
                <DarkInput label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XXXXXXXXX" />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.password ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'}`, fontFamily: "'DM Sans', Inter, sans-serif" }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(204,0,0,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,0,0,0.08)'; }}
                      onBlur={(e) => { e.target.style.borderColor = errors.password ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs" style={{ color: '#ff6666', fontFamily: "'DM Sans', Inter, sans-serif" }}>{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.confirmPassword ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'}`, fontFamily: "'DM Sans', Inter, sans-serif" }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(204,0,0,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,0,0,0.08)'; }}
                      onBlur={(e) => { e.target.style.borderColor = errors.confirmPassword ? 'rgba(204,0,0,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs" style={{ color: '#ff6666', fontFamily: "'DM Sans', Inter, sans-serif" }}>{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* ─── STEP 2: Bar Details ─── */}
            {step === 1 && (
              <div className="space-y-4">
                <DarkInput label="Bar Name" value={barName} onChange={(e) => setBarName(e.target.value)} placeholder="e.g. Eclipse Bar" error={errors.barName} />
                <DarkInput label="Bar Address" value={barAddress} onChange={(e) => setBarAddress(e.target.value)} placeholder="Street / Building / Unit" error={errors.barAddress} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DarkSelect
                    label="City"
                    value={barCity}
                    onChange={(e) => {
                      setBarCity(e.target.value);
                      setBarBarangay('');
                      setErrors((prev) => ({ ...prev, barCity: undefined, barBarangay: undefined }));
                    }}
                    error={errors.barCity}
                  >
                    <option value="">Select city...</option>
                    {CAVITE_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </DarkSelect>

                  <DarkSelect
                    label="Barangay"
                    value={barBarangay}
                    onChange={(e) => { setBarBarangay(e.target.value); setErrors((prev) => ({ ...prev, barBarangay: undefined })); }}
                    disabled={!barCity}
                    error={errors.barBarangay}
                  >
                    <option value="">{barCity ? 'Select barangay...' : 'Select city first...'}</option>
                    {getBarangaysForCity(barCity).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </DarkSelect>
                </div>

                <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(204,0,0,0.06)', border: '1px solid rgba(204,0,0,0.12)', color: '#888', fontFamily: "'DM Sans', Inter, sans-serif" }}>
                  Platform available in Cavite only
                </div>

                <DarkTextarea label="Bar Description" value={barDesc} onChange={(e) => setBarDesc(e.target.value)} placeholder="Describe your bar briefly..." />

                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    Bar Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BAR_TYPE_OPTIONS.map((opt) => {
                      const checked = barTypes.includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer select-none transition-colors"
                          style={{
                            background: checked ? 'rgba(204,0,0,0.10)' : 'rgba(255,255,255,0.03)',
                            border: checked ? '1px solid rgba(204,0,0,0.35)' : '1px solid rgba(255,255,255,0.06)',
                            color: checked ? '#fff' : '#bbb',
                            fontFamily: "'DM Sans', Inter, sans-serif"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setBarTypes((prev) => checked ? prev.filter((x) => x !== opt) : [...prev, opt]);
                            }}
                            className="accent-[#CC0000]"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Operating Hours */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#666', fontFamily: "'DM Sans', Inter, sans-serif" }}>
                      Operating Hours <span style={{ color: '#CC0000' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOperatingHours(prev => [...prev, { day: '', open: '', close: '' }])}
                      className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                      style={{ background: 'rgba(204,0,0,0.1)', color: '#CC0000', border: '1px solid rgba(204,0,0,0.2)' }}
                    >+ Add Day</button>
                  </div>
                  {errors.operatingHours && <p className="text-xs mb-2" style={{ color: '#ff6666' }}>{errors.operatingHours}</p>}
                  <div className="space-y-2">
                    {operatingHours.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                        <DarkSelect
                          value={row.day}
                          onChange={(e) => setOperatingHours(prev => prev.map((r, idx) => idx === i ? { ...r, day: e.target.value } : r))}
                        >
                          <option value="">Day...</option>
                          {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                        </DarkSelect>
                        <DarkSelect
                          value={row.open}
                          onChange={(e) => setOperatingHours(prev => prev.map((r, idx) => idx === i ? { ...r, open: e.target.value } : r))}
                        >
                          <option value="">Opens...</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </DarkSelect>
                        <DarkSelect
                          value={row.close}
                          onChange={(e) => setOperatingHours(prev => prev.map((r, idx) => idx === i ? { ...r, close: e.target.value } : r))}
                        >
                          <option value="">Closes...</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </DarkSelect>
                        {operatingHours.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setOperatingHours(prev => prev.filter((_, idx) => idx !== i))}
                            className="w-9 h-[46px] rounded-xl flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(204,0,0,0.08)', color: '#ff6666', border: '1px solid rgba(204,0,0,0.15)' }}
                          ><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* GCash — Required */}
                <div className="pt-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#CC0000', fontFamily: "'DM Sans', Inter, sans-serif" }}>GCash Details</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(204,0,0,0.1)', color: '#CC0000', border: '1px solid rgba(204,0,0,0.2)' }}>Required for Payouts</span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: '#555', fontFamily: "'DM Sans', Inter, sans-serif" }}>GCash details are required so we can process your payouts.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <DarkInput label="GCash Number *" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="09XXXXXXXXX" error={errors.gcashNumber} />
                    <DarkInput label="GCash Account Name *" value={gcashName} onChange={(e) => setGcashName(e.target.value)} placeholder="Registered name" error={errors.gcashName} />
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Documents ─── */}
            {step === 2 && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-4 mb-2"
                  style={{ background: 'rgba(204,0,0,0.04)', border: '1px solid rgba(204,0,0,0.12)' }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: '#888', fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    Upload your <strong style={{ color: '#ccc' }}>BIR Certificate</strong>, <strong style={{ color: '#ccc' }}>Business Permit</strong>, and a <strong style={{ color: '#ccc' }}>photo holding your ID</strong>. All are required.
                  </p>
                </div>
                <OCRDocumentScanner
                  label="BIR Certificate"
                  accept=".jpg,.jpeg,.png,.pdf"
                  file={birFile}
                  onFile={(f) => { setBirFile(f); setErrors((e) => ({ ...e, birFile: undefined })); }}
                  onRemove={() => { setBirFile(null); setBirNumber(''); setBirExpiry(''); }}
                  onOCRExtract={(data) => {
                    if (data.permitNumber) setBirNumber(data.permitNumber);
                    if (data.expiryDate) setBirExpiry(data.expiryDate);
                  }}
                  error={errors.birFile}
                  documentType="bir"
                />
                {birFile && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">BIR Number (Extracted)</label>
                      <input
                        type="text"
                        value={birNumber}
                        onChange={(e) => setBirNumber(e.target.value)}
                        placeholder="Verify/correct if needed"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Expiry Date (Extracted)</label>
                      <input
                        type="text"
                        value={birExpiry}
                        onChange={(e) => setBirExpiry(e.target.value)}
                        placeholder="Verify/correct if needed"
                        className="input-field"
                      />
                    </div>
                  </div>
                )}
                <OCRDocumentScanner
                  label="Business Permit"
                  accept=".jpg,.jpeg,.png,.pdf"
                  file={permitFile}
                  onFile={(f) => { setPermitFile(f); setErrors((e) => ({ ...e, permitFile: undefined })); }}
                  onRemove={() => { setPermitFile(null); setPermitNumber(''); setPermitExpiry(''); }}
                  onOCRExtract={(data) => {
                    if (data.permitNumber) setPermitNumber(data.permitNumber);
                    if (data.expiryDate) setPermitExpiry(data.expiryDate);
                  }}
                  error={errors.permitFile}
                  documentType="permit"
                />
                {permitFile && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Permit Number (Extracted)</label>
                      <input
                        type="text"
                        value={permitNumber}
                        onChange={(e) => setPermitNumber(e.target.value)}
                        placeholder="Verify/correct if needed"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Expiry Date (Extracted)</label>
                      <input
                        type="text"
                        value={permitExpiry}
                        onChange={(e) => setPermitExpiry(e.target.value)}
                        placeholder="Verify/correct if needed"
                        className="input-field"
                      />
                    </div>
                  </div>
                )}
                <FileDropZone
                  label="Photo holding your ID"
                  helpText="Take a clear photo of yourself holding your valid government ID. This is required for identity verification."
                  hintText="JPG or PNG — max 5 MB"
                  accept=".jpg,.jpeg,.png"
                  file={selfieWithIdFile}
                  onFile={(f) => { setSelfieWithIdFile(f); setErrors((e) => ({ ...e, selfieWithIdFile: undefined })); }}
                  onRemove={() => setSelfieWithIdFile(null)}
                  error={errors.selfieWithIdFile}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(204,0,0,0.06)', border: '1px solid rgba(204,0,0,0.18)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#CC0000', fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    You entered this email:
                  </p>
                  <p className="text-base font-semibold text-white" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    {email || '—'}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: '#888', fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    Make sure this is correct before submitting.
                  </p>
                </div>
              </div>
            )}

            {/* ─── Navigation buttons ─── */}
            <div className={`flex gap-3 mt-8 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#aaa', fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 disabled:opacity-60"
                style={{
                  background: '#CC0000',
                  boxShadow: '0 0 20px rgba(204,0,0,0.3)',
                  fontFamily: "'DM Sans', Inter, sans-serif",
                  maxWidth: step === 0 ? '160px' : undefined,
                }}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : step === 3 ? (
                  'Confirm & Submit'
                ) : (
                  'Continue →'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm mt-6" style={{ color: '#555', fontFamily: "'DM Sans', Inter, sans-serif" }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#CC0000' }}>
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
