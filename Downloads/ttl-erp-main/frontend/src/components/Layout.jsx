import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authAPI } from '../api/api';

const NAV_GROUPS = [
  { group: 'OVERVIEW', items: [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞', sub: 'KPIs & Live Summary' },
  ]},
  { group: 'FLEET OPERATIONS', items: [
    { path: '/trucks',   label: 'Fleet Master',     icon: '🚛', perm: 'VIEW_TRUCKS', sub: 'Vehicles & Registration' },
    { path: '/drivers',  label: 'Drivers',          icon: '👤', perm: 'DRIVERS',     sub: 'Driver Profiles & Licence' },
    { path: '/trips',    label: 'Trips & Waybill',  icon: '📋', perm: 'TRIPS',       sub: 'Trip Logs & E-Waybills' },
    { path: '/fuel',     label: 'Fuel Management',  icon: '⛽', perm: 'FUEL_ENTRY',  sub: 'Fuel Entries & Ledger' },
  ]},
  { group: 'WORKSHOP & STORES', items: [
    { path: '/spare-parts',  label: 'Spare Parts',     icon: '🔧', perm: 'SPARE_PART_ISSUE', sub: 'Stock & Issue Ledger' },
    { path: '/tyres',        label: 'Tyre Stock',      icon: '⚙️', perm: 'TYRE_ISSUE',       sub: 'Tyre Inventory & Issue' },
    { path: '/maintenance',  label: 'Maintenance Log', icon: '🔩', perm: 'MAINTENANCE',      sub: 'Service Records & Jobs' },
  ]},
  { group: 'FINANCE', items: [
    { path: '/revenue-expenditure', label: 'Revenue & Expenditure', icon: '💰', perm: 'FINANCE',      sub: 'P&L, Income & Costs' },
    { path: '/reports',             label: 'Reports & Analytics',   icon: '📊', perm: 'VIEW_REPORTS', sub: 'MIS & Business Reports' },
  ]},
  { group: 'ADMINISTRATION', items: [
    { path: '/users', label: 'User Management', icon: '👥', adminOnly: true, sub: 'Roles & Permissions' },
  ]},
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
:root{--navy:#060d1f;--navy2:#0d1b35;--gold:#f0a500;--gold-glow:rgba(240,165,0,0.35);--border:rgba(255,255,255,0.07);--surf:rgba(255,255,255,0.04);--muted:rgba(255,255,255,0.45);--dim:rgba(255,255,255,0.22);--font:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;}
.ttl-wrap{display:flex;min-height:100vh;font-family:var(--font);background:#eef2f8;}
.ttl-sb{width:256px;flex-shrink:0;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;background:var(--navy);overflow:hidden;box-shadow:4px 0 24px rgba(0,0,0,0.28);}
.ttl-sb::before{content:'';position:absolute;top:-80px;right:-80px;width:240px;height:240px;background:radial-gradient(circle,rgba(240,165,0,0.11) 0%,transparent 70%);border-radius:50%;pointer-events:none;}
.ttl-sb::after{content:'';position:absolute;bottom:30px;left:-60px;width:180px;height:180px;background:radial-gradient(circle,rgba(26,127,110,0.09) 0%,transparent 70%);border-radius:50%;pointer-events:none;}
.ttl-brand{padding:16px 15px;display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--border);position:relative;z-index:1;}
.ttl-bicon{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#c8922a,#f0c060);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 4px 14px rgba(200,146,42,0.45);border:1px solid rgba(255,255,255,0.18);}
.ttl-bname{color:#fff;font-size:11.5px;font-weight:800;letter-spacing:0.5px;line-height:1.3;}
.ttl-bsub{color:var(--dim);font-size:9px;margin-top:2px;}
.ttl-clock{padding:7px 15px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);background:rgba(0,0,0,0.15);}
.ttl-cdate{color:var(--dim);font-size:9px;font-family:var(--mono);}
.ttl-ctime{color:#7eefb2;font-size:11.5px;font-weight:700;font-family:var(--mono);letter-spacing:0.5px;}
.ttl-nav{flex:1;overflow-y:auto;padding:8px 0 16px;position:relative;z-index:1;scrollbar-width:none;}
.ttl-nav::-webkit-scrollbar{display:none;}
.ttl-glabel{padding:10px 15px 4px;color:var(--dim);font-size:8.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;transition:color .15s;}
.ttl-glabel:hover{color:var(--muted);}
.ttl-item{display:flex;align-items:center;gap:10px;padding:8px 12px 8px 15px;margin:1px 7px;border-radius:9px;text-decoration:none;color:var(--muted);transition:all .18s cubic-bezier(.4,0,.2,1);position:relative;}
.ttl-item:hover{background:var(--surf);color:#fff;}
.ttl-item.act{background:linear-gradient(135deg,rgba(240,165,0,0.15),rgba(240,165,0,0.05));color:#fff;box-shadow:inset 0 0 0 1px rgba(240,165,0,0.18);}
.ttl-item.act::before{content:'';position:absolute;left:-7px;top:50%;transform:translateY(-50%);width:3px;height:60%;background:linear-gradient(180deg,#f0a500,#f0c060);border-radius:0 2px 2px 0;box-shadow:0 0 8px rgba(240,165,0,0.6);}
.ttl-ico{font-size:15px;width:22px;text-align:center;flex-shrink:0;transition:transform .2s;}
.ttl-item:hover .ttl-ico{transform:scale(1.15);}
.ttl-lbl{font-size:12px;font-weight:600;line-height:1.2;}
.ttl-sub{font-size:9px;color:var(--dim);margin-top:1px;transition:color .18s;}
.ttl-item.act .ttl-sub{color:rgba(240,165,0,0.55);}
.ttl-item:hover .ttl-sub{color:var(--muted);}
.ttl-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);box-shadow:0 0 6px var(--gold-glow);margin-left:auto;flex-shrink:0;}
.ttl-footer{padding:12px 14px;border-top:1px solid var(--border);background:rgba(0,0,0,0.2);position:relative;z-index:1;}
.ttl-urow{display:flex;align-items:center;gap:9px;}
.ttl-av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#c8922a,#f0c060);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;flex-shrink:0;box-shadow:0 3px 8px rgba(200,146,42,0.4);}
.ttl-uname{color:#fff;font-size:11.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ttl-urole{color:var(--dim);font-size:9px;margin-top:1px;font-family:var(--mono);}
.ttl-ibtn{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surf);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .15s;flex-shrink:0;}
.ttl-ibtn:hover{background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2);}
.ttl-ibtn.out:hover{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.4);color:#fca5a5;}
.ttl-main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;}
.ttl-topbar{height:54px;background:#fff;border-bottom:1px solid #e5eaf2;display:flex;align-items:center;padding:0 24px;gap:14px;flex-shrink:0;box-shadow:0 1px 8px rgba(6,13,31,0.06);position:sticky;top:0;z-index:10;}
.ttl-bc{flex:1;display:flex;align-items:center;gap:8px;}
.ttl-bcicon{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#060d1f,#132040);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;box-shadow:0 2px 6px rgba(6,13,31,0.2);}
.ttl-bctitle{font-weight:700;color:#0d1b35;font-size:13px;}
.ttl-bcsep{color:#c5d0e0;font-size:16px;}
.ttl-bcsub{color:#8a9ab5;font-size:11.5px;}
.ttl-tright{display:flex;align-items:center;gap:10px;}
.ttl-tpill{display:flex;align-items:center;gap:6px;padding:4px 11px 4px 7px;background:#f4f7fc;border:1px solid #e5eaf2;border-radius:20px;}
.ttl-tav{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#c8922a,#f0c060);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;}
.ttl-tuname{font-size:12px;font-weight:600;color:#2d3f55;}
.ttl-rbadge{padding:2px 8px;border-radius:20px;font-size:9px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;font-family:var(--mono);}
.ttl-content{flex:1;overflow:auto;}
.ttl-overlay{position:fixed;inset:0;background:rgba(6,13,31,0.6);backdrop-filter:blur(5px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:ttlFade .2s ease;}
.ttl-mbox{background:#fff;border-radius:16px;width:400px;overflow:hidden;box-shadow:0 24px 80px rgba(6,13,31,0.3);animation:ttlSlide .25s cubic-bezier(.34,1.56,.64,1);}
.ttl-mhead{background:linear-gradient(135deg,#060d1f,#132040);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;}
.ttl-mtitle{color:#fff;font-weight:700;font-size:13px;}
.ttl-mbody{padding:22px;display:flex;flex-direction:column;gap:15px;}
.ttl-fl label{display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px;}
.ttl-fl input{width:100%;padding:9px 13px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13px;font-family:var(--font);outline:none;box-sizing:border-box;transition:border .15s,box-shadow .15s;background:#f8fafc;color:#0d1b35;}
.ttl-fl input:focus{border-color:#c8922a;box-shadow:0 0 0 3px rgba(200,146,42,0.12);background:#fff;}
.ttl-mfoot{display:flex;gap:8px;justify-content:flex-end;padding:0 22px 20px;}
.ttl-cancel{padding:8px 18px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;}
.ttl-cancel:hover{background:#f1f5f9;}
.ttl-save{padding:8px 20px;border:none;border-radius:8px;background:linear-gradient(135deg,#c8922a,#f0a500);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);box-shadow:0 3px 10px rgba(200,146,42,0.35);transition:all .15s;}
.ttl-save:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(200,146,42,0.45);}
.ttl-save:disabled{opacity:.6;cursor:not-allowed;transform:none;}
@keyframes ttlFade{from{opacity:0}to{opacity:1}}
@keyframes ttlSlide{from{transform:translateY(18px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
`;

export default function Layout({ children }) {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clock, setClock] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    const id = 'ttl-layout-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isVisible = i => i.adminOnly ? isAdmin() : (!i.perm || isAdmin() || hasPermission(i.perm));
  const handleLogout = () => { logout(); navigate('/login'); };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setShowProfile(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const currentItem = NAV_GROUPS.flatMap(g => g.items).find(m => location.pathname.startsWith(m.path));

  return (
    <div className="ttl-wrap">
      {/* SIDEBAR */}
      <div className="ttl-sb">
        <div className="ttl-brand">
          <div className="ttl-bicon">🚛</div>
          <div>
            <div className="ttl-bname">TAURUS TRADING & LOGISTICS</div>
            <div className="ttl-bsub">Enterprise ERP · Ghana</div>
          </div>
        </div>

        <div className="ttl-clock">
          <div className="ttl-cdate">{clock.toLocaleDateString('en-GH',{weekday:'short',day:'2-digit',month:'short',year:'numeric',timeZone:'Africa/Accra'})}</div>
          <div className="ttl-ctime">{clock.toLocaleTimeString('en-GH',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Africa/Accra'})}</div>
        </div>

        <nav className="ttl-nav">
          {NAV_GROUPS.map(group => {
            const items = group.items.filter(isVisible);
            if (!items.length) return null;
            const isCol = collapsed[group.group];
            return (
              <div key={group.group}>
                <div className="ttl-glabel" onClick={() => setCollapsed(c => ({ ...c, [group.group]: !c[group.group] }))}>
                  <span>{group.group}</span>
                  <span style={{ display:'inline-block', transition:'transform .2s', transform: isCol?'rotate(-90deg)':'rotate(0)' }}>▾</span>
                </div>
                {!isCol && items.map(m => {
                  const active = location.pathname === m.path || (m.path !== '/dashboard' && location.pathname.startsWith(m.path));
                  return (
                    <NavLink key={m.path} to={m.path} className={`ttl-item${active?' act':''}`}>
                      <span className="ttl-ico">{m.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="ttl-lbl">{m.label}</div>
                        <div className="ttl-sub">{m.sub}</div>
                      </div>
                      {active && <div className="ttl-dot" />}
                    </NavLink>
                  );
                })}
                <div style={{ height:6 }} />
              </div>
            );
          })}
        </nav>

        <div className="ttl-footer">
          <div className="ttl-urow">
            <div className="ttl-av">{(user?.fullName||user?.username||'?')[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="ttl-uname">{user?.fullName||user?.username}</div>
              <div className="ttl-urole">{user?.role}{user?.department?' · '+user.department:''}</div>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              <button className="ttl-ibtn" onClick={() => setShowProfile(true)} title="Settings">⚙</button>
              <button className="ttl-ibtn out" onClick={handleLogout} title="Logout">⏻</button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="ttl-main">
        <div className="ttl-topbar">
          <div className="ttl-bc">
            <div className="ttl-bcicon"><span>{currentItem?.icon||'⊞'}</span></div>
            <span className="ttl-bctitle">{currentItem?.label||'Dashboard'}</span>
            {currentItem?.sub && <><span className="ttl-bcsep">›</span><span className="ttl-bcsub">{currentItem.sub}</span></>}
          </div>
          <div className="ttl-tright">
            <span style={{ fontSize:14 }}>🇬🇭</span>
            <div className="ttl-tpill">
              <div className="ttl-tav">{(user?.fullName||user?.username||'?')[0].toUpperCase()}</div>
              <span className="ttl-tuname">{user?.fullName||user?.username}</span>
            </div>
            <span className="ttl-rbadge" style={{
              background: user?.role==='ADMIN'?'linear-gradient(135deg,#060d1f,#132040)':'#eef2ff',
              color: user?.role==='ADMIN'?'#f0c060':'#3730a3',
              border: user?.role==='ADMIN'?'1px solid rgba(240,192,96,0.3)':'1px solid #c7d2fe',
            }}>{user?.role}</span>
          </div>
        </div>
        <div className="ttl-content">{children}</div>
      </div>

      {/* Change Password Modal */}
      {showProfile && (
        <div className="ttl-overlay" onClick={e => e.target===e.currentTarget && setShowProfile(false)}>
          <div className="ttl-mbox">
            <div className="ttl-mhead">
              <span className="ttl-mtitle">⚙ Change Password</span>
              <button className="ttl-ibtn" onClick={() => setShowProfile(false)} style={{ width:28,height:28,fontSize:16 }}>×</button>
            </div>
            <form onSubmit={handleChangePw}>
              <div className="ttl-mbody">
                {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm Password']].map(([k,lbl]) => (
                  <div key={k} className="ttl-fl">
                    <label>{lbl}</label>
                    <input type="password" value={pwForm[k]} onChange={e => setPwForm(p=>({...p,[k]:e.target.value}))} required />
                  </div>
                ))}
              </div>
              <div className="ttl-mfoot">
                <button type="button" className="ttl-cancel" onClick={() => setShowProfile(false)}>Cancel</button>
                <button type="submit" className="ttl-save" disabled={saving}>{saving?'Saving...':'Change Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
