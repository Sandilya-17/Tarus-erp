import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ── CAPTCHA ── */
function generateCaptchaText() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function CaptchaCanvas({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 140, 44);
    ctx.fillStyle = 'rgba(15,30,60,0.04)';
    ctx.fillRect(0, 0, 140, 44);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random()*160|0},${Math.random()*160|0},${Math.random()*200|0},0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random()*140, Math.random()*44);
      ctx.lineTo(Math.random()*140, Math.random()*44);
      ctx.stroke();
    }
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(${Math.random()*120|0},${Math.random()*120|0},${Math.random()*200|0},0.25)`;
      ctx.fillRect(Math.random()*140, Math.random()*44, 2, 2);
    }
    const fts = ['bold 22px Georgia','bold 20px "Times New Roman"','bold 24px Trebuchet MS'];
    const cols = ['#0a2144','#1a7f6e','#c0392b','#7b3fa0','#1a5fa0'];
    text.split('').forEach((ch, i) => {
      ctx.save();
      ctx.font = fts[i % fts.length];
      ctx.fillStyle = cols[i % cols.length];
      ctx.translate(14 + i * 21, 28);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }, [text]);
  return <canvas ref={ref} width={140} height={44} style={{ borderRadius: 8, background: '#f0f4fb', border: '1px solid #d0dce8', display: 'block' }} />;
}

/* ── Floating particles ── */
function Particles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const size = 3 + Math.random() * 5;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const dur = 8 + Math.random() * 10;
        const opacity = 0.08 + Math.random() * 0.18;
        return (
          <div key={i} style={{
            position: 'absolute',
            bottom: '-20px',
            left: `${left}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#f0a500' : i % 3 === 1 ? '#1a7f6e' : '#fff',
            opacity,
            animation: `ttlFloat ${dur}s ${delay}s infinite linear`,
          }} />
        );
      })}
    </div>
  );
}

/* ── Animated truck SVG ── */
function TruckSVG() {
  return (
    <div style={{ fontSize: 56, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))', animation: 'ttlTruckBob 3s ease-in-out infinite' }}>
      🚛
    </div>
  );
}

const LOGIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

@keyframes ttlFloat {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
}

@keyframes ttlTruckBob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes ttlFadeSlide {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ttlPulseRing {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 0.3; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

@keyframes ttlShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes ttlSpin {
  to { transform: rotate(360deg); }
}

@keyframes ttlGlowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(240,165,0,0.2), 0 4px 20px rgba(0,0,0,0.3); }
  50% { box-shadow: 0 0 35px rgba(240,165,0,0.4), 0 4px 20px rgba(0,0,0,0.3); }
}

@keyframes ttlRoadMove {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes ttlGridMove {
  from { transform: perspective(400px) rotateX(60deg) translateY(0); }
  to { transform: perspective(400px) rotateX(60deg) translateY(60px); }
}

.ttl-login-wrap {
  min-height: 100vh;
  display: flex;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  overflow: hidden;
  background: #060d1f;
}

/* LEFT PANEL */
.ttl-left {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #020810 0%, #060d1f 35%, #0a1f3a 65%, #071425 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Ghana flag bar */
.ttl-flag-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 5px;
  z-index: 10;
  background: linear-gradient(90deg, #ce1126 33.3%, #f0a500 33.3% 66.6%, #1a4731 66.6%);
}

/* Animated grid floor */
.ttl-grid-floor {
  position: absolute;
  bottom: 0; left: -10%; right: -10%;
  height: 55%;
  background-image:
    linear-gradient(rgba(240,165,0,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(240,165,0,0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: perspective(400px) rotateX(60deg);
  transform-origin: bottom center;
  animation: ttlGridMove 3s linear infinite;
}

/* Glowing horizon line */
.ttl-horizon {
  position: absolute;
  left: 0; right: 0;
  bottom: 42%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(240,165,0,0.6), rgba(26,127,110,0.5), transparent);
  box-shadow: 0 0 20px rgba(240,165,0,0.3);
}

/* Road stripes */
.ttl-road {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 38%;
  overflow: hidden;
}

.ttl-road-stripe {
  position: absolute;
  bottom: 12%;
  left: 0;
  width: 200%;
  height: 3px;
  display: flex;
  animation: ttlRoadMove 1.4s linear infinite;
}

.ttl-road-dash {
  width: 80px;
  height: 3px;
  background: rgba(240,165,0,0.5);
  margin-right: 60px;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(240,165,0,0.4);
  flex-shrink: 0;
}

/* Center content */
.ttl-left-content {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 0 40px;
  text-align: center;
}

.ttl-tagline {
  color: rgba(255,255,255,0.85);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1.25;
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
}

.ttl-tagline span {
  color: #f0a500;
  display: block;
}

.ttl-desc {
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  letter-spacing: 3px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Bottom brand card */
.ttl-brand-card {
  position: absolute;
  bottom: 28px; left: 28px;
  background: rgba(10,25,50,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(240,165,0,0.2);
  border-radius: 14px;
  padding: 14px 18px;
  z-index: 10;
  animation: ttlGlowPulse 3s ease-in-out infinite;
}

.ttl-brand-card-title {
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
}

.ttl-brand-card-sub {
  color: #f0a500;
  font-size: 9px;
  letter-spacing: 3px;
  font-weight: 700;
  margin-top: 3px;
  text-transform: uppercase;
}

/* Stats row */
.ttl-stats {
  display: flex;
  gap: 16px;
}

.ttl-stat {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px 18px;
  text-align: center;
  backdrop-filter: blur(8px);
}

.ttl-stat-val {
  color: #f0a500;
  font-size: 22px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}

.ttl-stat-lbl {
  color: rgba(255,255,255,0.35);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
  font-weight: 600;
}

/* RIGHT PANEL */
.ttl-right {
  width: 440px;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 44px;
  position: relative;
  overflow: hidden;
}

.ttl-right::before {
  content: '';
  position: absolute;
  top: -120px; right: -120px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.ttl-right::after {
  content: '';
  position: absolute;
  bottom: -80px; left: -80px;
  width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(26,127,110,0.06) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.ttl-form-wrap {
  width: 100%;
  position: relative;
  z-index: 1;
  animation: ttlFadeSlide 0.5s ease both;
}

.ttl-form-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.ttl-form-logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0a1f3a, #1a4060);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 6px 18px rgba(6,13,31,0.25);
}

.ttl-form-company {
  font-size: 15px;
  font-weight: 900;
  color: #0a1f3a;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.ttl-form-company-sub {
  font-size: 9.5px;
  font-weight: 700;
  color: #f0a500;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 2px;
}

.ttl-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d0dce8, transparent);
  margin: 16px 0;
}

.ttl-form-title {
  font-size: 26px;
  font-weight: 900;
  color: #060d1f;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}

.ttl-form-subtitle {
  font-size: 12.5px;
  color: #8a9ab5;
  margin-bottom: 26px;
}

.ttl-form-card {
  background: #f8fafd;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  padding: 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ttl-input-group label {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  color: #5a6e82;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  margin-bottom: 7px;
}

.ttl-input-wrap {
  position: relative;
}

.ttl-input {
  width: 100%;
  padding: 11px 14px 11px 40px;
  border: 1.5px solid #dde8f4;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  outline: none;
  background: #fff;
  color: #0d1b35;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  box-sizing: border-box;
}

.ttl-input:focus {
  border-color: #f0a500;
  box-shadow: 0 0 0 3px rgba(240,165,0,0.12);
  background: #fffdf8;
  transform: translateY(-1px);
}

.ttl-input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  pointer-events: none;
  opacity: 0.5;
}

.ttl-input-suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.45;
  padding: 3px;
  transition: opacity 0.15s;
}

.ttl-input-suffix:hover { opacity: 0.8; }

.ttl-captcha-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.ttl-refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #1a7f6e;
  font-size: 22px;
  padding: 4px;
  transition: transform 0.35s;
  line-height: 1;
}

.ttl-refresh-btn:hover { transform: rotate(180deg); }

.ttl-captcha-err {
  font-size: 11px;
  color: #e53935;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ttl-forgot {
  text-align: right;
  margin-top: -8px;
}

.ttl-forgot span {
  font-size: 11.5px;
  color: #1a7f6e;
  cursor: pointer;
  font-weight: 700;
  transition: color 0.15s;
}

.ttl-forgot span:hover { color: #0f5e50; }

.ttl-login-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #060d1f 0%, #1a3a6c 100%);
  color: #fff;
  border: none;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 5px 18px rgba(6,13,31,0.3);
}

.ttl-login-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  transition: left 0.5s;
}

.ttl-login-btn:hover::before { left: 150%; }

.ttl-login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(6,13,31,0.4);
}

.ttl-login-btn:active:not(:disabled) { transform: translateY(0); }

.ttl-login-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.ttl-login-btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.ttl-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ttlSpin 0.7s linear infinite;
  flex-shrink: 0;
}

.ttl-enter-hint {
  text-align: center;
  margin-top: 10px;
  color: #b0bec5;
  font-size: 10.5px;
}

.ttl-form-footer {
  margin-top: 24px;
  text-align: center;
  color: rgba(0,0,0,0.28);
  font-size: 10.5px;
  line-height: 1.8;
}
`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [captchaText, setCaptchaText] = useState(generateCaptchaText);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = 'ttl-login-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = LOGIN_CSS;
      document.head.appendChild(s);
    }
    setTimeout(() => setMounted(true), 50);
  }, []);

  const refreshCaptcha = () => { setCaptchaText(generateCaptchaText()); setCaptchaInput(''); setCaptchaError(''); };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (captchaInput.trim() !== captchaText) {
      setCaptchaError('Verification code does not match. Please try again.');
      refreshCaptcha(); return;
    }
    setCaptchaError(''); setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.fullName || res.data.user.username}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } };

  return (
    <div className="ttl-login-wrap">
      {/* LEFT */}
      <div className="ttl-left">
        <div className="ttl-flag-bar" />
        <Particles />

        {/* Animated grid */}
        <div className="ttl-grid-floor" />
        <div className="ttl-horizon" />

        {/* Road */}
        <div className="ttl-road">
          <div className="ttl-road-stripe">
            {Array.from({ length: 20 }).map((_, i) => <div key={i} className="ttl-road-dash" />)}
          </div>
        </div>

        {/* Center content */}
        <div className="ttl-left-content">
          {/* Big company logo + name */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{
              width: 82, height: 82, borderRadius: 22,
              background: 'linear-gradient(135deg, #c8922a 0%, #f0c060 60%, #e0a030 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42, boxShadow: '0 8px 32px rgba(200,146,42,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
              border: '2px solid rgba(255,255,255,0.15)',
              animation: 'ttlGlowPulse 3s ease-in-out infinite',
            }}>♉</div>
            <div style={{ textAlign:'center' }}>
              <div style={{
                color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: 1.5,
                textShadow: '0 2px 12px rgba(0,0,0,0.5)', lineHeight: 1.1,
              }}>TAURUS TRADING</div>
              <div style={{
                color: '#f0a500', fontSize: 13, fontWeight: 800, letterSpacing: 3,
                textTransform: 'uppercase', marginTop: 3,
                textShadow: '0 0 14px rgba(240,165,0,0.6)',
              }}>& LOGISTICS LTD</div>
            </div>
          </div>

          <TruckSVG />

          <div className="ttl-tagline">
            Taurus Trading &<br />
            <span>Logistics ERP</span>
          </div>

          <div className="ttl-desc">Taurus Trading & Logistics Ltd · Ghana</div>

          <div className="ttl-stats">
            <div className="ttl-stat">
              <div className="ttl-stat-val">50+</div>
              <div className="ttl-stat-lbl">Fleet Trucks</div>
            </div>
            <div className="ttl-stat">
              <div className="ttl-stat-val">24/7</div>
              <div className="ttl-stat-lbl">Operations</div>
            </div>
            <div className="ttl-stat">
              <div className="ttl-stat-val">GH₵</div>
              <div className="ttl-stat-lbl">Live Finance</div>
            </div>
          </div>
        </div>

        {/* Brand card */}
        <div className="ttl-brand-card">
          <div className="ttl-brand-card-title">TAURUS TRADING & LOGISTICS</div>
          <div className="ttl-brand-card-sub">Enterprise ERP · Ghana</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="ttl-right" onKeyDown={handleKey}>
        <div className="ttl-form-wrap" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>

          <div className="ttl-form-brand">
            <div className="ttl-form-logo">🚛</div>
            <div>
              <div className="ttl-form-company">TAURUS TRADING & LOGISTICS</div>
              <div className="ttl-form-company-sub">Enterprise ERP</div>
            </div>
          </div>

          <div className="ttl-divider" />

          <div className="ttl-form-title">Sign In</div>
          <div className="ttl-form-subtitle">Access your ERP dashboard</div>

          <div className="ttl-form-card">
            {/* Username */}
            <div className="ttl-input-group">
              <label>Username</label>
              <div className="ttl-input-wrap">
                <span className="ttl-input-icon">👤</span>
                <input
                  className="ttl-input"
                  type="text"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  onKeyDown={handleKey}
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="ttl-input-group">
              <label>Password</label>
              <div className="ttl-input-wrap">
                <span className="ttl-input-icon">🔒</span>
                <input
                  className="ttl-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={handleKey}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" className="ttl-input-suffix" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="ttl-input-group">
              <label>Verification Code</label>
              <div className="ttl-captcha-row">
                <CaptchaCanvas text={captchaText} />
                <button type="button" className="ttl-refresh-btn" onClick={refreshCaptcha} title="Refresh">↻</button>
              </div>
              <div className="ttl-input-wrap">
                <span className="ttl-input-icon">🔢</span>
                <input
                  className="ttl-input"
                  type="text"
                  placeholder="Type the code above"
                  value={captchaInput}
                  onChange={e => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
                  onKeyDown={handleKey}
                  style={{ letterSpacing: 3, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
              {captchaError && <div className="ttl-captcha-err">⚠ {captchaError}</div>}
            </div>

            {/* Forgot */}
            <div className="ttl-forgot">
              <span onClick={() => toast('Please contact your system administrator to reset your password.')}>
                Forgot Password?
              </span>
            </div>

            {/* Submit */}
            <button className="ttl-login-btn" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <div className="ttl-login-btn-loading"><div className="ttl-spinner" /><span>Signing In...</span></div>
                : '🔐 Sign In to ERP'
              }
            </button>

            <div className="ttl-enter-hint">
              Press <kbd style={{ background: '#f0f4f8', border: '1px solid #cfd8e3', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: 10 }}>Enter</kbd> to login
            </div>
          </div>

          <div className="ttl-form-footer">
            🇬🇭 &nbsp;© 2026 Taurus Trading & Logistics &nbsp;·&nbsp; Enterprise ERP v3.0<br />
            Powered by TTL IT Department
          </div>
        </div>
      </div>
    </div>
  );
}
