import React, { useEffect, useState } from 'react';
import { trucksAPI, tripsAPI, fuelAPI, sparePartsAPI, tyresAPI, driversAPI } from '../api/api';
import { StatCard, Section, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const FONT = "'Inter','DM Sans','Segoe UI',system-ui,sans-serif";
const C = {
  primary: '#0B1F3A', primaryMid: '#1a3a5c', primaryLight: '#EBF0F7',
  success: '#0D6B35', successLight: '#E6F4ED',
  danger: '#9B1C1C', dangerLight: '#FEE8E8',
  warning: '#B45309', warningLight: '#FEF3C7',
  info: '#1E5F8C', infoLight: '#E0EEF7',
  accent: '#C8922A',
  text: '#0F1A2A', textMuted: '#5A6E82', textLight: '#8A9BAD',
  border: '#D8E2EE', bg: '#F0F4F9', white: '#FFFFFF',
  tableBg: '#F8FAFD', tableHead: '#EEF2F9',
  vitGold: '#8B5E00', vitGoldBg: '#FEF9EC', vitGoldBorder: '#F3C94B',
};

function daysLeft(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); }

function getCurrentVITQuarter() {
  const m = new Date().getMonth(); // 0-11
  if (m <= 2) return { key: 'vitQ1', label: 'Q1 (Jan–Mar)' };
  if (m <= 5) return { key: 'vitQ2', label: 'Q2 (Apr–Jun)' };
  if (m <= 8) return { key: 'vitQ3', label: 'Q3 (Jul–Sep)' };
  return { key: 'vitQ4', label: 'Q4 (Oct–Dec)' };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [vitAlerts, setVitAlerts] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);
  const [fuelExcess, setFuelExcess] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    Promise.all([
      trucksAPI.getAll().catch(() => ({ data: [] })),
      tripsAPI.getAll().catch(() => ({ data: [] })),
      sparePartsAPI.getAll().catch(() => ({ data: [] })),
      tyresAPI.getAll().catch(() => ({ data: [] })),
      driversAPI.getAll().catch(() => ({ data: [] })),
      fuelAPI.getMonthly(now.getMonth() + 1, now.getFullYear()).catch(() => ({ data: [] })),
    ]).then(([trucks, trips, parts, tyres, drivers, fuelReport]) => {
      const t = trucks.data, tr = trips.data, p = parts.data, ty = tyres.data, d = drivers.data, f = fuelReport.data;

      setStats({
        trucks: t.filter(x => x.active !== false).length,
        trips: tr.length,
        tripsInTransit: tr.filter(x => x.status === 'IN_TRANSIT').length,
        pendingBalance: tr.reduce((s, x) => s + (x.balance || 0), 0),
        lowStockParts: p.filter(x => (x.currentStock || 0) <= (x.reorderLevel || 0)).length,
        lowStockTyres: ty.filter(x => (x.currentStock || 0) <= (x.reorderLevel || 0)).length,
        activeDrivers: d.filter(x => x.status === 'ACTIVE').length,
        excessFuelTrucks: f.filter(x => x.status === 'EXCESS').length,
      });

      // Document expiry alerts — use correct field names: dvlaExpiry, insuranceExpiry, fitnessExpiry, permitExpiry
      const exp = [];
      t.forEach(truck => {
        [
          ['DVLA', truck.dvlaExpiry],
          ['Insurance', truck.insuranceExpiry],
          ['Fitness', truck.fitnessExpiry],
          ['Permit', truck.permitExpiry],
        ].forEach(([type, date]) => {
          if (date) {
            const days = daysLeft(date);
            if (days !== null && days <= 30) exp.push({ truck: truck.truckNumber, type, date, days });
          }
        });
      });
      setExpiringDocs(exp.sort((a, b) => a.days - b.days).slice(0, 8));

      // VIT alerts — current quarter + any overdue quarters
      const currentQ = getCurrentVITQuarter();
      const allQuarters = [
        { key: 'vitQ1', label: 'Q1 (Jan–Mar)', deadline: `${now.getFullYear()}-03-31` },
        { key: 'vitQ2', label: 'Q2 (Apr–Jun)', deadline: `${now.getFullYear()}-06-30` },
        { key: 'vitQ3', label: 'Q3 (Jul–Sep)', deadline: `${now.getFullYear()}-09-30` },
        { key: 'vitQ4', label: 'Q4 (Oct–Dec)', deadline: `${now.getFullYear()}-12-31` },
      ];
      const vitRows = [];
      t.forEach(truck => {
        allQuarters.forEach(q => {
          const paid = truck[q.key];
          const deadlineDays = daysLeft(q.deadline);
          // Show: unpaid for current/past quarters, or paid but expiring soon
          if (!paid && deadlineDays !== null && deadlineDays <= 60) {
            vitRows.push({ truck: truck.truckNumber, quarter: q.label, paid: null, deadline: q.deadline, days: deadlineDays, status: deadlineDays < 0 ? 'OVERDUE' : 'DUE' });
          } else if (paid) {
            const paidDays = daysLeft(paid);
            if (paidDays !== null && paidDays <= 30) {
              vitRows.push({ truck: truck.truckNumber, quarter: q.label, paid, deadline: q.deadline, days: paidDays, status: paidDays < 0 ? 'EXPIRED' : 'EXPIRING' });
            }
          }
        });
      });
      setVitAlerts(vitRows.sort((a, b) => a.days - b.days).slice(0, 8));

      setRecentTrips(tr.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)).slice(0, 6));
      setLowStockParts(p.filter(x => (x.currentStock || 0) <= (x.reorderLevel || 0)).slice(0, 6));
      setFuelExcess(f.filter(x => x.status === 'EXCESS').slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const STATUS_MAP = { PENDING: 'warning', IN_TRANSIT: 'info', DELIVERED: 'success', BILLED: 'primary', CANCELLED: 'danger' };

  const th = { padding: '8px 12px', background: C.tableHead, color: C.primary, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, textAlign: 'left', borderBottom: `2px solid ${C.border}`, fontFamily: FONT, whiteSpace: 'nowrap' };
  const td = { padding: '8px 12px', fontSize: 12, color: C.text, fontFamily: FONT, borderBottom: `1px solid ${C.border}` };
  const vitTh = { ...th, background: '#FDF3DC', color: C.vitGold };
  const vitTd = { ...td, background: '#FFFDF7' };

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Welcome header */}
      <div style={{ background: `linear-gradient(135deg, #071428 0%, #0B1F3A 50%, #0e2647 100%)`, padding: '20px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: '100%', background: 'linear-gradient(135deg, transparent, rgba(200,146,42,0.08))', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Welcome back</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>{user?.fullName || user?.username}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {now.toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Accra' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>TTL, TAKORADI GHANA ERP</div>
            <div style={{ fontSize: 10, color: 'rgba(200,146,42,0.7)', marginTop: 2, fontWeight: 600, letterSpacing: 0.5 }}>Ghana Operations</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))', gap: 12, marginBottom: 22 }}>
          <StatCard label="Active Fleet" value={loading ? '—' : stats.trucks} icon="🚛" color={C.primary} sub="Registered vehicles" />
          <StatCard label="Active Drivers" value={loading ? '—' : stats.activeDrivers} icon="👤" color={C.success} sub="On duty today" />
          <StatCard label="In Transit" value={loading ? '—' : stats.tripsInTransit} icon="🛣️" color={C.info} sub="Ongoing trips" />
          <StatCard label="Pending Balance" value={loading ? '—' : `GH₵${(stats.pendingBalance || 0).toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="💰" color={C.accent} sub="Outstanding amount" />
          <StatCard label="Low Stock Parts" value={loading ? '—' : stats.lowStockParts} icon="🔧" color={C.danger} sub="Reorder required" />
          <StatCard label="Low Stock Tyres" value={loading ? '—' : stats.lowStockTyres} icon="⚙️" color={C.warning} sub="Below reorder level" />
          <StatCard label="Fuel Excess" value={loading ? '—' : stats.excessFuelTrucks} icon="⛽" color={C.danger} sub="This month" />
          <StatCard label="Total Trips" value={loading ? '—' : stats.trips} icon="📋" color="#5B3A8C" sub="All time records" />
        </div>

        {/* VIT Alert Banner — shown only when there are alerts */}
        {!loading && vitAlerts.length > 0 && (
          <div style={{ background: C.vitGoldBg, border: `1.5px solid ${C.vitGoldBorder}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🏷️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: C.vitGold, textTransform: 'uppercase', letterSpacing: 0.8 }}>VIT — Vehicle Income Tax Alerts</div>
                <div style={{ fontSize: 11, color: '#9A6F00', marginTop: 1 }}>{vitAlerts.length} truck{vitAlerts.length > 1 ? 's' : ''} require attention</div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Truck', 'Quarter', 'Status', 'Deadline', 'Days'].map(h => <th key={h} style={vitTh}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {vitAlerts.map((v, i) => (
                  <tr key={i}>
                    <td style={{ ...vitTd, fontWeight: 700, color: C.primary }}>{v.truck}</td>
                    <td style={vitTd}>{v.quarter}</td>
                    <td style={vitTd}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: v.status === 'OVERDUE' || v.status === 'EXPIRED' ? '#FEE8E8' : '#FEF3C7',
                        color: v.status === 'OVERDUE' || v.status === 'EXPIRED' ? '#9B1C1C' : '#B45309',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>{v.status}</span>
                    </td>
                    <td style={{ ...vitTd, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 11 }}>{v.deadline}</td>
                    <td style={{ ...vitTd, fontWeight: 700, color: v.days < 0 ? C.danger : v.days <= 7 ? '#e65100' : C.vitGold }}>
                      {v.days < 0 ? `${Math.abs(v.days)}d overdue` : `${v.days}d left`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Expiring Documents */}
          <Section title="⚠ Document Expiry Alerts — Next 30 Days">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.textMuted, fontSize: 13 }}>Loading…</div>
            ) : expiringDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.success, fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                All documents are valid
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Truck', 'Document', 'Expiry Date', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>{expiringDocs.map((d, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 700, color: C.primary }}>{d.truck}</td>
                    <td style={td}>{d.type}</td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 11 }}>{d.date}</td>
                    <td style={td}><Badge text={d.days < 0 ? 'Expired' : `${d.days}d left`} type={d.days < 0 ? 'danger' : d.days <= 7 ? 'danger' : 'warning'} /></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Section>

          {/* Recent Trips — waybillNumber fix */}
          <Section title="📋 Recent Trips">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.textMuted, fontSize: 13 }}>Loading…</div>
            ) : recentTrips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.textMuted, fontSize: 13 }}>No trips found</div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Waybill No.', 'Truck', 'Route', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>{recentTrips.map((t, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 700, color: C.primary }}>{t.waybillNumber || t.lrNumber || '—'}</td>
                    <td style={td}>{t.truckNumber}</td>
                    <td style={{ ...td, fontSize: 11, color: C.textMuted }}>{t.from} → {t.to}</td>
                    <td style={td}><Badge text={t.status} type={STATUS_MAP[t.status] || 'default'} /></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Section>

          {/* Low Stock Parts */}
          <Section title="🔧 Low Stock Parts">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.textMuted, fontSize: 13 }}>Loading…</div>
            ) : lowStockParts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.success, fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                All parts adequately stocked
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Part Name', 'Category', 'Current', 'Reorder'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>{lowStockParts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600 }}>{p.partName}</td>
                    <td style={td}>{p.category}</td>
                    <td style={{ ...td, fontWeight: 700, color: C.danger }}>{p.currentStock ?? 0}</td>
                    <td style={{ ...td, color: C.textMuted }}>{p.reorderLevel ?? 0}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Section>

          {/* Fuel Excess */}
          <Section title="⛽ Fuel Excess This Month">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.textMuted, fontSize: 13 }}>Loading…</div>
            ) : fuelExcess.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.success, fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                No excess fuel this month
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Truck', 'Limit (L)', 'Used (L)', 'Excess (L)'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>{fuelExcess.map((f, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 700, color: C.primary }}>{f.truckNumber}</td>
                    <td style={td}>{f.fuelLimit?.toFixed(0)}</td>
                    <td style={td}>{f.consumed?.toFixed(0)}</td>
                    <td style={{ ...td, fontWeight: 700, color: C.danger }}>{f.excess?.toFixed(0)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
