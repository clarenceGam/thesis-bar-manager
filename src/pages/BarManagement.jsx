import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, MapPin, Clock, Loader2 } from 'lucide-react';
import { barApi } from '../api/barApi';
import { getUploadUrl } from '../api/apiClient';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_COORDS = { lat: 14.3500, lng: 120.9200 };

// Cavite province bounding box
const CAVITE_BOUNDS = [[13.90, 120.50], [14.65, 121.25]];

const BarManagement = () => {
  const [bar, setBar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    loadBar();
  }, []);

  const loadBar = async () => {
    try {
      const { data } = await barApi.getDetails();
      const d = data.data || data;
      setBar(d);
      setForm(d);
    } catch { /* handled by interceptor */ } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!res.ok) return null;
      const data = await res.json();
      const { address } = data;
      const city = address.city || address.town || address.village || address.municipality || address.county || '';
      const state = address.state || '';
      
      // Validate that location is in Cavite
      const isCavite = city.toLowerCase().includes('cavite') || state.toLowerCase().includes('cavite');
      
      return {
        full: data.display_name || '',
        city: isCavite ? 'Cavite' : city,
        state: address.state || address.county || '',
        zip: address.postcode || '',
        isCavite,
      };
    } catch {
      return null;
    }
  };

  const getCoords = () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return DEFAULT_COORDS;
  };

  const loadLeaflet = async () => {
    if (window.L) return window.L;

    if (!document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    await new Promise((resolve, reject) => {
      const existing = document.getElementById('leaflet-cdn-js');
      if (existing && window.L) {
        resolve();
        return;
      }
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'leaflet-cdn-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    return window.L;
  };

  useEffect(() => {
    if (!showMapPicker) return;

    let mounted = true;
    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!mounted || !mapContainerRef.current) return;

        const { lat, lng } = getCoords();

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          maxBounds: CAVITE_BOUNDS,
          maxBoundsViscosity: 1.0,
          minZoom: 10,
        }).setView([lat, lng], 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        L.rectangle(CAVITE_BOUNDS, {
          color: '#CC0000', weight: 1.5, fill: false, dashArray: '6 4', opacity: 0.5,
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        const isInsideCavite = (nlat, nlng) => {
          const [[swLat, swLng], [neLat, neLng]] = CAVITE_BOUNDS;
          return nlat >= swLat && nlat <= neLat && nlng >= swLng && nlng <= neLng;
        };

        let lastValidPos = { lat, lng };

        const updateCoords = async (nextLat, nextLng) => {
          if (!isInsideCavite(nextLat, nextLng)) {
            toast.error('Location must be inside Cavite province only.');
            marker.setLatLng([lastValidPos.lat, lastValidPos.lng]);
            return false;
          }
          lastValidPos = { lat: nextLat, lng: nextLng };
          handleChange('latitude', Number(nextLat).toFixed(7));
          handleChange('longitude', Number(nextLng).toFixed(7));
          const geo = await reverseGeocode(nextLat, nextLng);
          if (geo) {
            if (!geo.isCavite) {
              toast.error('This location is not in Cavite. Platform is for Cavite bars only.');
              marker.setLatLng([lastValidPos.lat, lastValidPos.lng]);
              return false;
            }
            handleChange('address', geo.full);
            handleChange('city', 'Cavite');
            handleChange('state', geo.state);
            handleChange('zip_code', geo.zip);
          }
          return true;
        };

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          updateCoords(pos.lat, pos.lng);
        });

        map.on('click', (e) => {
          const { lat: nextLat, lng: nextLng } = e.latlng;
          if (isInsideCavite(nextLat, nextLng)) {
            marker.setLatLng([nextLat, nextLng]);
            updateCoords(nextLat, nextLng);
          } else {
            toast.error('Location must be inside Cavite province only.');
          }
        });

        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 100);
      } catch {
        toast.error('Unable to load map picker.');
      }
    };

    setMapReady(false);
    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      setMapReady(false);
    };
  }, [showMapPicker, mapFullscreen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { name, description, address, city, state, zip_code, phone, contact_number, email, website, category, price_range, latitude, longitude, accept_cash_payment, accept_online_payment, accept_gcash, minimum_reservation_deposit, gcash_number, gcash_account_name } = form;
      const hours = {};
      DAYS.forEach((d) => { hours[`${d}_hours`] = form[`${d}_hours`] || ''; });
      await barApi.updateDetails({ 
        name, description, address, city, state, zip_code, phone, contact_number, email, website, category, price_range, latitude, longitude, 
        accept_cash_payment, accept_online_payment, accept_gcash, minimum_reservation_deposit, 
        gcash_number, gcash_account_name, 
        ...hours 
      });
      toast.success('Bar details updated!');
      loadBar();
    } catch { /* handled */ } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (type === 'image' || type === 'icon') {
      input.accept = 'image/*';
    } else if (type === 'gif') {
      input.accept = '.gif,.mp4,.webm';
    }
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      if (type === 'image') { fd.append('image', file); await barApi.uploadImage(fd); }
      else if (type === 'icon') { fd.append('bar_icon', file); await barApi.uploadIcon(fd); }
      else if (type === 'gif') { fd.append('bar_gif', file); await barApi.uploadVideo(fd); }
      toast.success(`Bar ${type} uploaded!`);
      loadBar();
    };
    input.click();
  };

  const handleSettingsUpdate = async (reservation_mode) => {
    try {
      await barApi.updateSettings({ reservation_mode });
      toast.success('Reservation mode updated!');
    } catch { /* handled */ }
  };

  if (loading) return <LoadingSpinner />;
  if (!bar) return <div className="card"><p style={{ color: '#888' }}>Unable to load bar details.</p></div>;

  return (
    <div className="space-y-6">
      {/* Header with Images */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-xl overflow-hidden relative group" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {bar.image_path ? (
                <img src={getUploadUrl(bar.image_path)} alt="Bar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: '#1a1a1a', color: '#555' }}>No Image</div>
              )}
              <button onClick={() => handleImageUpload('image')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </button>
            </div>
            <button onClick={() => handleImageUpload('icon')} className="mt-2 text-xs w-full text-center" style={{ color: '#CC0000' }}>Upload Logo</button>
            <button onClick={() => handleImageUpload('gif')} className="mt-1 text-xs w-full text-center" style={{ color: '#CC0000' }}>Upload GIF/Video</button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{bar.name}</h2>
            <p className="text-sm mt-1" style={{ color: '#888' }}>{bar.address}, {bar.city}</p>
            <div className="flex gap-2 mt-3">
              <span className={bar.status === 'active' ? 'badge-success' : 'badge-gray'}>{bar.status}</span>
              <span className="badge-gray">{bar.category || 'Bar'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Bar Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Bar Name' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'address', label: 'Address' },
            { key: 'city', label: 'City' },
            { key: 'state', label: 'State' },
            { key: 'zip_code', label: 'Zip Code' },
            { key: 'phone', label: 'Phone' },
            { key: 'contact_number', label: 'Contact Number' },
            { key: 'email', label: 'Email' },
            { key: 'website', label: 'Website' },
            { key: 'category', label: 'Category' },
            { key: 'price_range', label: 'Price Range' },
            { key: 'latitude', label: 'Latitude' },
            { key: 'longitude', label: 'Longitude' },
            { key: 'minimum_reservation_deposit', label: 'Min Reservation Deposit' },
          ].map(({ key, label, type }) => (
            <div key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="label">{label}</label>
              {type === 'textarea' ? (
                <textarea value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)} className="input-field h-20 resize-none" />
              ) : (
                <input value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)} className="input-field" />
              )}
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="label">Location Picker</label>
            <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-sm">
                <p className="font-medium text-white">Use map pin instead of manual coordinates</p>
                <p className="text-xs mt-1" style={{ color: '#888' }}>Pin must be within <span style={{ color: '#CC0000' }}>Cavite province</span>. Click or drag to set Latitude/Longitude automatically.</p>
              </div>
              <button type="button" onClick={() => setShowMapPicker(true)} className="btn-secondary flex items-center gap-2 w-fit">
                <MapPin className="w-4 h-4" /> Open Map Picker
              </button>
            </div>
          </div>
        </div>

        {/* GCash Payout Details */}
        <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            GCash Payout Details
          </h4>
          <p className="text-xs mb-3" style={{ color: '#888' }}>Add your GCash account for receiving payouts from the platform.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">GCash Number *</label>
              <input 
                value={form.gcash_number || ''} 
                onChange={(e) => handleChange('gcash_number', e.target.value)} 
                className="input-field" 
                placeholder="09XXXXXXXXX"
                pattern="09[0-9]{9}"
                maxLength={11}
              />
              <p className="text-xs mt-1" style={{ color: '#555' }}>Format: 09XXXXXXXXX (11 digits)</p>
            </div>
            <div>
              <label className="label">Account Name *</label>
              <input 
                value={form.gcash_account_name || ''} 
                onChange={(e) => handleChange('gcash_account_name', e.target.value)} 
                className="input-field" 
                placeholder="Juan Dela Cruz"
              />
              <p className="text-xs mt-1" style={{ color: '#555' }}>Name registered on GCash</p>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Operating Hours */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: '#CC0000' }} />
          <h3 className="text-lg font-bold text-white">Operating Hours</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DAYS.map((day) => (
            <div key={day}>
              <label className="label capitalize">{day}</label>
              <input value={form[`${day}_hours`] || ''} onChange={(e) => handleChange(`${day}_hours`, e.target.value)} className="input-field" placeholder="e.g. 6PM - 2AM" />
            </div>
          ))}
        </div>
      </div>

      {/* Media Preview */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Media</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label text-xs text-gray-500">Main Image</label>
            <div className="relative group">
              {bar.image_path ? (
                <img src={getUploadUrl(bar.image_path)} alt="Bar" className="w-full h-32 object-cover rounded" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
              ) : (
                <div className="w-full h-32 rounded flex items-center justify-center text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#555' }}>No Image</div>
              )}
              <button onClick={() => handleImageUpload('image')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <Upload className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          <div>
            <label className="label text-xs text-gray-500">Logo</label>
            <div className="relative group">
              {bar.logo_path ? (
                <img src={getUploadUrl(bar.logo_path)} alt="Logo" className="w-full h-32 object-contain rounded" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }} />
              ) : (
                <div className="w-full h-32 rounded flex items-center justify-center text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#555' }}>No Logo</div>
              )}
              <button onClick={() => handleImageUpload('icon')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <Upload className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          <div>
            <label className="label text-xs text-gray-500">GIF/Video</label>
            <div className="relative group">
              {bar.video_path ? (
                bar.video_path.endsWith('.gif') ? (
                  <img src={getUploadUrl(bar.video_path)} alt="GIF" className="w-full h-32 object-cover rounded" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                ) : (
                  <video src={getUploadUrl(bar.video_path)} className="w-full h-32 object-cover rounded" style={{ border: '1px solid rgba(255,255,255,0.08)' }} controls muted />
                )
              ) : (
                <div className="w-full h-32 rounded flex items-center justify-center text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#555' }}>No GIF/Video</div>
              )}
              <button onClick={() => handleImageUpload('gif')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <Upload className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Settings */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Reservation Settings</h3>
        <div className="flex gap-3">
          <button onClick={() => handleSettingsUpdate('manual_approval')} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={bar.reservation_mode === 'manual_approval' ? { background: '#CC0000', color: '#fff' } : { background: '#1a1a1a', color: '#888', border: '1px solid rgba(255,255,255,0.08)' }}
          >Manual Approval</button>
          <button onClick={() => handleSettingsUpdate('auto_accept')} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={bar.reservation_mode === 'auto_accept' ? { background: '#CC0000', color: '#fff' } : { background: '#1a1a1a', color: '#888', border: '1px solid rgba(255,255,255,0.08)' }}
          >Auto Accept</button>
        </div>
      </div>

      {showMapPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3" onClick={() => setShowMapPicker(false)}>
          <div
            className={`rounded-2xl shadow-2xl w-full ${mapFullscreen ? 'max-w-[98vw] h-[95vh]' : 'max-w-4xl h-[80vh]'} overflow-hidden flex flex-col`}
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h4 className="font-bold text-white">Pick Bar Location</h4>
                <p className="text-xs" style={{ color: '#888' }}>Click the map or drag the pin. Coordinates update automatically.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMapFullscreen((v) => !v)} className="btn-secondary text-xs px-3 py-1.5">
                  {mapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                <button type="button" onClick={() => setShowMapPicker(false)} className="btn-primary text-xs px-3 py-1.5">Done</button>
              </div>
            </div>

            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
              <div>
                <label className="label">Latitude</label>
                <input value={form.latitude || ''} onChange={(e) => handleChange('latitude', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input value={form.longitude || ''} onChange={(e) => handleChange('longitude', e.target.value)} className="input-field" />
              </div>
            </div>

            <div className="relative flex-1">
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: '#0d0d0d' }}>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#CC0000' }} />
                </div>
              )}
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarManagement;
