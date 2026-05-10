import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Globe, Eye, EyeOff, Mail, Lock, ArrowRight, MapPin, BarChart2, Camera, Package, KeyRound } from 'lucide-react';
import './Auth.css';

const FEATURES = [
  { icon: <MapPin size={18}/>,    title: 'Smart Trip Planning',  desc: 'Organize every detail of your trip in one place' },
  { icon: <BarChart2 size={18}/>, title: 'Budget Analytics',     desc: 'Track spending with visual charts and breakdowns' },
  { icon: <Camera size={18}/>,    title: 'Photo Gallery',        desc: 'Store and relive your travel memories' },
  { icon: <Package size={18}/>,   title: 'Packing Lists',        desc: 'Never forget essentials with smart checklists' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]         = useState({ email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  // Set-password mode: shown when account exists but has no password
  const [needsPassword, setNeedsPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
      toast.success('Welcome back! ✈️');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      // Backend auto-sets password now, but if for some reason it still shows this:
      if (msg.toLowerCase().includes('no password')) {
        setNeedsPassword(true);
        setError('Your account has no password yet. Enter the password you want to use — it will be set automatically.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  // Fallback: manual set-password via /api/auth/set-password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.setPassword(form.email, form.password);
      // Store token and user manually
      localStorage.setItem('token', res.data.token);
      window.location.href = '/dashboard'; // hard reload to reinitialise AuthContext
      toast.success('Password set! Welcome to Travelify ✈️');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left visual panel */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <Globe size={52} className="auth-globe"/>
          <h1>Your Journey<br/>Awaits</h1>
          <p>Plan, track and relive your travel adventures with Travelify</p>
          <div className="auth-features">
            {FEATURES.map(f => (
              <div key={f.title} className="auth-feature-item">
                <div className="af-icon">{f.icon}</div>
                <div className="af-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-panel">
          <div className="auth-form-card">
            <div className="auth-logo-row">
              <Globe size={26} color="var(--ocean)"/>
              <span className="auth-logo-text">Travelify</span>
            </div>

            {needsPassword ? (
              /* ── Set password mode ── */
              <>
                <div style={{textAlign:'center',marginBottom:16}}>
                  <div style={{fontSize:40,marginBottom:8}}>🔑</div>
                  <h2>Set Your Password</h2>
                  <p className="auth-sub">Your account exists but has no password yet. Enter a password to continue.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSetPassword}>
                  <div className="auth-field">
                    <label className="form-label">Email</label>
                    <div className="auth-field-icon-wrap">
                      <Mail size={16} className="auth-field-icon"/>
                      <input type="email" className="auth-input" value={form.email}
                        onChange={e=>setForm({...form,email:e.target.value})} required/>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="form-label">Choose a Password</label>
                    <div className="auth-field-icon-wrap" style={{position:'relative'}}>
                      <KeyRound size={16} className="auth-field-icon"/>
                      <input type={showPass?'text':'password'} className="auth-input"
                        placeholder="Min. 6 characters"
                        value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                      <button type="button" onClick={()=>setShowPass(s=>!s)}
                        style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex'}}>
                        {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="auth-btn-full" disabled={loading}>
                    {loading ? 'Setting password...' : <><span>Set Password & Sign In</span><ArrowRight size={16}/></>}
                  </button>
                </form>
                <p className="auth-footer">
                  <button className="auth-link-btn" onClick={()=>setNeedsPassword(false)}>← Back to sign in</button>
                </p>
              </>
            ) : (
              /* ── Normal login mode ── */
              <>
                <h2>Welcome back</h2>
                <p className="auth-sub">Sign in to continue your adventures</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label className="form-label">Email Address</label>
                    <div className="auth-field-icon-wrap">
                      <Mail size={16} className="auth-field-icon"/>
                      <input type="email" className="auth-input" placeholder="you@example.com"
                        value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required autoFocus/>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="form-label">Password</label>
                    <div className="auth-field-icon-wrap" style={{position:'relative'}}>
                      <Lock size={16} className="auth-field-icon"/>
                      <input type={showPass?'text':'password'} className="auth-input" placeholder="Your password"
                        value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                      <button type="button" onClick={()=>setShowPass(s=>!s)}
                        style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex'}}>
                        {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-btn-full" disabled={loading}>
                    {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16}/></>}
                  </button>
                </form>

                <p className="auth-footer">
                  Don't have an account? <Link to="/register">Create one free</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
