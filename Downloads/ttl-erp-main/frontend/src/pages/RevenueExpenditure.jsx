import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { revenueAPI, expenditureAPI } from '../api/api';
import { PageHeader, Btn, Section, StatCard, Tabs, Badge, exportToExcel } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const FONT = "'Inter','DM Sans','Segoe UI',system-ui,sans-serif";
const C = {
  primary: '#0B1F3A', primaryMid: '#1a3a5c', primaryLight: '#EBF0F7', primaryBorder: '#BFD0E8',
  success: '#0D6B35', successLight: '#E6F4ED', successBorder: '#7BC99A',
  danger: '#9B1C1C', dangerLight: '#FEE8E8', dangerBorder: '#F5A3A3',
  warning: '#B45309', warningLight: '#FEF3C7',
  accent: '#C8922A', accentLight: '#FDF4E3', accentBorder: '#E8C872',
  text: '#0F1A2A', textMuted: '#5A6E82', textLight: '#8A9BAD',
  border: '#D8E2EE', bg: '#F0F4F9', white: '#FFFFFF', tableHead: '#EEF2F9',
};

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const REV_CATS = ['FREIGHT','COMMISSION','LOADING','UNLOADING','OTHER'];
const EXP_CATS = ['FUEL','SALARY','MAINTENANCE','TOLL','OFFICE','REPAIRS','INSURANCE','TAX','SPARES','TIRES','LUBRICANTS','BREAKDOWN_ASSISTANCE','TOW_CHARGES','OTHER'];
const PAY_MODES = ['CASH','BANK','CHEQUE','UPI'];

function parseExcelDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  if (typeof val === 'string') return val.trim();
  return '';
}

// ── Field & Inputs ─────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: FONT }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: 12.5, outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
  background: '#fff', color: C.text, transition: 'border-color 0.15s, box-shadow 0.15s',
};

// ── Modals ─────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,20,40,0.60)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(11,31,58,0.30)', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})` }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13.5 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', width: 28, height: 28, borderRadius: 6, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Revenue Form ───────────────────────────────────────────
function RevenueForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    category: 'FREIGHT', description: '', amount: '', date: '', time: '',
    referenceNumber: '', partyName: '', lrNumber: '', paymentMode: 'CASH', receivedBy: '', remarks: ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleKeyDown = (e) => { if (e.key === 'Enter' && e.target.tagName !== 'SELECT') { e.preventDefault(); save(); } };
  const save = async () => {
    if (!form.amount) return alert('Amount is required');
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (form.date && form.time) {
      payload.transactionDateTime = `${form.date}T${form.time}:00`;
    } else if (form.date) {
      payload.transactionDateTime = `${form.date}T00:00:00`;
    }
    await onSave(payload);
    onClose();
  };
  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
        <FormField label="Category">
          <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
            {REV_CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Amount (GH₵)">
          <input style={inputStyle} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Date">
          <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Time">
          <input style={inputStyle} type="time" value={form.time} onChange={e => set('time', e.target.value)} placeholder="HH:MM" />
        </FormField>
        <FormField label="Payment Mode">
          <select style={inputStyle} value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}>
            {PAY_MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Party Name">
          <input style={inputStyle} value={form.partyName} onChange={e => set('partyName', e.target.value)} placeholder="Customer / Party" />
        </FormField>
        <FormField label="LR Number">
          <input style={inputStyle} value={form.lrNumber} onChange={e => set('lrNumber', e.target.value)} placeholder="LR-XXXX" />
        </FormField>
        <FormField label="Reference Number">
          <input style={inputStyle} value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value)} />
        </FormField>
        <FormField label="Received By">
          <input style={inputStyle} value={form.receivedBy} onChange={e => set('receivedBy', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Description">
        <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details..." />
      </FormField>
      <FormField label="Remarks">
        <input style={inputStyle} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>Save Entry</Btn>
      </div>
    </div>
  );
}

// ── Expenditure Form ───────────────────────────────────────
function ExpenditureForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    category: 'FUEL', description: '', amount: '', date: '', time: '',
    referenceNumber: '', truckNumber: '', vendorName: '', paymentMode: 'CASH', approvedBy: '', remarks: ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleKeyDown = (e) => { if (e.key === 'Enter' && e.target.tagName !== 'SELECT') { e.preventDefault(); save(); } };
  const save = async () => {
    if (!form.amount) return alert('Amount is required');
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (form.date && form.time) {
      payload.transactionDateTime = `${form.date}T${form.time}:00`;
    } else if (form.date) {
      payload.transactionDateTime = `${form.date}T00:00:00`;
    }
    await onSave(payload);
    onClose();
  };
  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
        <FormField label="Category">
          <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
            {EXP_CATS.map(c => <option key={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
        </FormField>
        <FormField label="Amount (GH₵)">
          <input style={inputStyle} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Date">
          <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Time">
          <input style={inputStyle} type="time" value={form.time} onChange={e => set('time', e.target.value)} placeholder="HH:MM" />
        </FormField>
        <FormField label="Payment Mode">
          <select style={inputStyle} value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}>
            {PAY_MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Truck Number">
          <input style={inputStyle} value={form.truckNumber} onChange={e => set('truckNumber', e.target.value)} placeholder="e.g. GH-1234-21" />
        </FormField>
        <FormField label="Vendor / Supplier">
          <input style={inputStyle} value={form.vendorName} onChange={e => set('vendorName', e.target.value)} />
        </FormField>
        <FormField label="Reference Number">
          <input style={inputStyle} value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value)} />
        </FormField>
        <FormField label="Approved By">
          <input style={inputStyle} value={form.approvedBy} onChange={e => set('approvedBy', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Description">
        <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details..." />
      </FormField>
      <FormField label="Remarks">
        <input style={inputStyle} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>Save Entry</Btn>
      </div>
    </div>
  );
}

// ── Helper: format date+time ───────────────────────────────
function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  const date = dateStr;
  if (!timeStr) return date;
  // Try to extract from transactionDateTime if present
  return date;
}

function extractTime(entry) {
  if (entry.transactionDateTime) {
    const parts = entry.transactionDateTime.split('T');
    if (parts[1]) return parts[1].substring(0, 5);
  }
  if (entry.time) return entry.time.substring(0, 5);
  return '';
}

// ── Main Page ──────────────────────────────────────────────
export default function RevenueExpenditure() {
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin() || hasPermission('MANAGE_FINANCE');
  const canApprove = isAdmin() || hasPermission('APPROVE_FINANCE');
  const canDelete = canApprove;
  const [tab, setTab] = useState('revenue');
  const [revenues, setRevenues] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showRevModal, setShowRevModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editRev, setEditRev] = useState(null);
  const [editExp, setEditExp] = useState(null);
  const [importing, setImporting] = useState(false);
  const revImportRef = useRef();
  const expImportRef = useRef();

  const load = () => {
    setLoading(true);
    Promise.all([
      revenueAPI.getAll().catch(() => ({ data: [] })),
      expenditureAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([r, e]) => {
      setRevenues(Array.isArray(r.data) ? r.data : []);
      setExpenditures(Array.isArray(e.data) ? e.data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() + 1 === +filterMonth && d.getFullYear() === +filterYear;
  };
  const filteredRev = revenues.filter(r => inPeriod(r.date));
  const filteredExp = expenditures.filter(e => inPeriod(e.date));

  const totalRev = filteredRev.reduce((s, r) => s + (r.amount || 0), 0);
  const totalExp = filteredExp.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRev - totalExp;

  const revByCat = {};
  filteredRev.forEach(r => { revByCat[r.category] = (revByCat[r.category] || 0) + (r.amount || 0); });
  const expByCat = {};
  filteredExp.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + (e.amount || 0); });

  const addRev = async (data) => { await revenueAPI.add(data); load(); };
  const updateRev = async (data) => { await revenueAPI.update(editRev.id, data); load(); };
  const deleteRev = async (id) => { if (!window.confirm('Delete this revenue entry?')) return; await revenueAPI.delete(id); load(); };

  const addExp = async (data) => { await expenditureAPI.add(data); load(); };
  const updateExp = async (data) => { await expenditureAPI.update(editExp.id, data); load(); };
  const deleteExp = async (id) => { if (!window.confirm('Delete this expenditure entry?')) return; await expenditureAPI.delete(id); load(); };

  const revCols = [
    { key: 'date', label: 'Date' }, { key: 'time', label: 'Time', exportVal: r => extractTime(r) },
    { key: 'category', label: 'Category' }, { key: 'description', label: 'Description' },
    { key: 'partyName', label: 'Party Name' }, { key: 'lrNumber', label: 'LR Number' },
    { key: 'referenceNumber', label: 'Reference' },
    { key: 'amount', label: 'Amount', exportVal: r => r.amount || 0 },
    { key: 'paymentMode', label: 'Payment Mode' }, { key: 'receivedBy', label: 'Received By' },
    { key: 'remarks', label: 'Remarks' },
  ];
  const expCols = [
    { key: 'date', label: 'Date' }, { key: 'time', label: 'Time', exportVal: r => extractTime(r) },
    { key: 'category', label: 'Category' }, { key: 'description', label: 'Description' },
    { key: 'truckNumber', label: 'Truck Number' }, { key: 'vendorName', label: 'Vendor' },
    { key: 'referenceNumber', label: 'Reference' },
    { key: 'amount', label: 'Amount', exportVal: r => r.amount || 0 },
    { key: 'paymentMode', label: 'Payment Mode' }, { key: 'approvedBy', label: 'Approved By' },
    { key: 'remarks', label: 'Remarks' },
  ];

  const downloadRevTemplate = () => {
    const headers = ['Date (YYYY-MM-DD)', 'Time (HH:MM)', 'Category', 'Description', 'Party Name', 'LR Number', 'Reference Number', 'Amount', 'Payment Mode', 'Received By', 'Remarks'];
    const sample = ['2026-04-01', '09:30', 'FREIGHT', 'Clinker transport', 'ABC Cement Ltd', 'LR-001', 'REF-001', '45000', 'BANK', 'John', ''];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Revenue Template');
    XLSX.writeFile(wb, 'revenue_import_template.xlsx');
  };

  const downloadExpTemplate = () => {
    const headers = ['Date (YYYY-MM-DD)', 'Time (HH:MM)', 'Category', 'Description', 'Truck Number', 'Vendor Name', 'Reference Number', 'Amount', 'Payment Mode', 'Approved By', 'Remarks'];
    const sample = ['2026-04-01', '14:00', 'FUEL', 'Diesel purchase', 'GH-1234-21', 'Shell Fuel', 'INV-001', '12000', 'CASH', 'Manager', ''];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenditure Template');
    XLSX.writeFile(wb, 'expenditure_import_template.xlsx');
  };

  const handleRevImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length < 2) return alert('No data rows found');
      const records = rows.slice(1).filter(r => r[7]).map(r => ({
        date: parseExcelDate(r[0]),
        time: r[1] || '',
        category: (r[2] || 'OTHER').toUpperCase(),
        description: r[3] || '',
        partyName: r[4] || '',
        lrNumber: r[5] || '',
        referenceNumber: r[6] || '',
        amount: parseFloat(r[7]) || 0,
        paymentMode: (r[8] || 'CASH').toUpperCase(),
        receivedBy: r[9] || '',
        remarks: r[10] || '',
      }));
      const res = await revenueAPI.bulkImport(records);
      alert(`✅ Imported ${res.data.imported} revenue records successfully!`);
      load();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.message || err.message));
    } finally { setImporting(false); e.target.value = ''; }
  };

  const handleExpImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length < 2) return alert('No data rows found');
      const records = rows.slice(1).filter(r => r[7]).map(r => ({
        date: parseExcelDate(r[0]),
        time: r[1] || '',
        category: (r[2] || 'OTHER').toUpperCase(),
        description: r[3] || '',
        truckNumber: r[4] || '',
        vendorName: r[5] || '',
        referenceNumber: r[6] || '',
        amount: parseFloat(r[7]) || 0,
        paymentMode: (r[8] || 'CASH').toUpperCase(),
        approvedBy: r[9] || '',
        remarks: r[10] || '',
      }));
      const res = await expenditureAPI.bulkImport(records);
      alert(`✅ Imported ${res.data.imported} expenditure records successfully!`);
      load();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.message || err.message));
    } finally { setImporting(false); e.target.value = ''; }
  };

  const th = {
    padding: '9px 12px', background: C.tableHead, color: C.primary, fontSize: 9.5,
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9,
    borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left', whiteSpace: 'nowrap', fontFamily: FONT,
  };
  const td = { padding: '9px 12px', fontSize: 12.5, color: C.text, fontFamily: FONT, borderBottom: `1px solid ${C.border}` };

  const FilterBar = () => (
    <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ color: C.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT }}>Period</span>
      <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}
        style={{ padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: FONT, background: '#fff' }}>
        {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
      </select>
      <select value={filterYear} onChange={e => setFilterYear(+e.target.value)}
        style={{ padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: FONT, background: '#fff' }}>
        {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
      </select>
      <div style={{ height: 18, width: 1, background: C.border }} />
      <span style={{ color: C.textMuted, fontSize: 12, fontFamily: FONT }}>{months[filterMonth - 1]} {filterYear}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT }}>
      <PageHeader title="Revenue & Expenditure" subtitle={`Financial Tracking — ${months[filterMonth - 1]} ${filterYear}`} />

      <input ref={revImportRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleRevImport} />
      <input ref={expImportRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExpImport} />

      {/* Summary KPI Cards */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="Total Revenue" value={`GH₵${totalRev.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="📈" color={C.success} sub={`${filteredRev.length} entries`} />
        <StatCard label="Total Expenditure" value={`GH₵${totalExp.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="📉" color={C.danger} sub={`${filteredExp.length} entries`} />
        <StatCard
          label={`Net ${netProfit >= 0 ? 'Profit' : 'Loss'}`}
          value={`${netProfit < 0 ? '-' : ''}GH₵${Math.abs(netProfit).toLocaleString('en-GH', { maximumFractionDigits: 0 })}`}
          icon={netProfit >= 0 ? '💚' : '🔴'}
          color={netProfit >= 0 ? C.success : C.danger}
          sub={totalRev > 0 ? `Margin: ${((netProfit / totalRev) * 100).toFixed(1)}%` : 'No revenue this period'}
        />
      </div>

      <Tabs tabs={[
        { key: 'revenue', label: `Revenue (${filteredRev.length})` },
        { key: 'expenditure', label: `Expenditure (${filteredExp.length})` },
        { key: 'summary', label: 'P&L Summary' },
      ]} active={tab} onChange={setTab} />

      <FilterBar />

      <div style={{ padding: '18px 24px' }}>

        {/* ── REVENUE TAB ── */}
        {tab === 'revenue' && (
          <Section
            title={`Revenue — ${months[filterMonth - 1]} ${filterYear}`}
            actions={
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Btn size="xs" variant="teal" onClick={() => exportToExcel(filteredRev, revCols, `revenue_${months[filterMonth-1]}_${filterYear}`)}>📤 Export</Btn>
                {canManage && <Btn size="xs" variant="outline" onClick={downloadRevTemplate}>📋 Template</Btn>}
                {canManage && <Btn size="xs" variant="outline" onClick={() => revImportRef.current.click()} disabled={importing}>📥 Import</Btn>}
                {canManage && <Btn size="xs" variant="primary" onClick={() => { setEditRev(null); setShowRevModal(true); }}>+ Add Revenue</Btn>}
              </div>
            }
          >
            {/* Category pills */}
            {Object.keys(revByCat).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.entries(revByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} style={{ background: C.successLight, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 10.5, fontWeight: 700, color: C.success, letterSpacing: 0.3 }}>
                    {cat} · GH₵{amt.toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                  </div>
                ))}
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>
                  {['#', 'Date', 'Time', 'Category', 'Description', 'Party', 'LR No.', 'Amount', 'Payment', 'Actions'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredRev.length === 0 ? (
                    <tr><td colSpan={10} style={{ padding: 28, textAlign: 'center', color: C.textMuted, fontFamily: FONT }}>No revenue entries for this period. Add manually or import Excel.</td></tr>
                  ) : filteredRev.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFD' }} className="erp-row-hover">
                      <td style={{ ...td, color: C.textLight, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 11.5 }}>{r.date || '—'}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 11.5, color: C.textMuted }}>
                        {extractTime(r) || <span style={{ color: C.textLight }}>—</span>}
                      </td>
                      <td style={td}><span style={{ background: C.infoLight, color: C.info, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{r.category}</span></td>
                      <td style={{ ...td, color: C.textMuted }}>{r.description || '—'}</td>
                      <td style={td}>{r.partyName || '—'}</td>
                      <td style={{ ...td, color: C.primary, fontWeight: 700 }}>{r.lrNumber || '—'}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: C.success, fontFamily: "'JetBrains Mono','Consolas',monospace" }}>
                        GH₵{(r.amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={td}>{r.paymentMode}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {canManage && <Btn size="xs" variant="outline" onClick={() => { setEditRev(r); setShowRevModal(true); }}>Edit</Btn>}
                          {canDelete && <Btn size="xs" variant="danger" onClick={() => deleteRev(r.id)}>Del</Btn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRev.length > 0 && (
                    <tr style={{ background: C.successLight }}>
                      <td colSpan={7} style={{ ...td, textAlign: 'right', color: C.success, fontWeight: 700, fontSize: 12 }}>TOTAL REVENUE</td>
                      <td style={{ ...td, textAlign: 'right', color: C.success, fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono','Consolas',monospace" }}>
                        GH₵{totalRev.toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ── EXPENDITURE TAB ── */}
        {tab === 'expenditure' && (
          <Section
            title={`Expenditure — ${months[filterMonth - 1]} ${filterYear}`}
            actions={
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Btn size="xs" variant="teal" onClick={() => exportToExcel(filteredExp, expCols, `expenditure_${months[filterMonth-1]}_${filterYear}`)}>📤 Export</Btn>
                {canManage && <Btn size="xs" variant="outline" onClick={downloadExpTemplate}>📋 Template</Btn>}
                {canManage && <Btn size="xs" variant="outline" onClick={() => expImportRef.current.click()} disabled={importing}>📥 Import</Btn>}
                {canManage && <Btn size="xs" variant="primary" onClick={() => { setEditExp(null); setShowExpModal(true); }}>+ Add Expenditure</Btn>}
              </div>
            }
          >
            {/* Category pills */}
            {Object.keys(expByCat).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} style={{ background: C.warningLight, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 10.5, fontWeight: 700, color: C.warning, letterSpacing: 0.3 }}>
                    {cat.replace(/_/g, ' ')} · GH₵{amt.toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                  </div>
                ))}
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>
                  {['#', 'Date', 'Time', 'Category', 'Description', 'Truck', 'Vendor', 'Amount', 'Payment', 'Actions'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredExp.length === 0 ? (
                    <tr><td colSpan={10} style={{ padding: 28, textAlign: 'center', color: C.textMuted, fontFamily: FONT }}>No expenditure entries for this period. Add manually or import Excel.</td></tr>
                  ) : filteredExp.map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFD' }} className="erp-row-hover">
                      <td style={{ ...td, color: C.textLight, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 11.5 }}>{e.date || '—'}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 11.5, color: C.textMuted }}>
                        {extractTime(e) || <span style={{ color: C.textLight }}>—</span>}
                      </td>
                      <td style={td}><span style={{ background: C.warningLight, color: C.warning, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{e.category?.replace(/_/g, ' ')}</span></td>
                      <td style={{ ...td, color: C.textMuted }}>{e.description || '—'}</td>
                      <td style={{ ...td, color: C.primary, fontWeight: 700 }}>{e.truckNumber || '—'}</td>
                      <td style={td}>{e.vendorName || '—'}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: C.danger, fontFamily: "'JetBrains Mono','Consolas',monospace" }}>
                        GH₵{(e.amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={td}>{e.paymentMode}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {canManage && <Btn size="xs" variant="outline" onClick={() => { setEditExp(e); setShowExpModal(true); }}>Edit</Btn>}
                          {canDelete && <Btn size="xs" variant="danger" onClick={() => deleteExp(e.id)}>Del</Btn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExp.length > 0 && (
                    <tr style={{ background: C.dangerLight }}>
                      <td colSpan={7} style={{ ...td, textAlign: 'right', color: C.danger, fontWeight: 700, fontSize: 12 }}>TOTAL EXPENDITURE</td>
                      <td style={{ ...td, textAlign: 'right', color: C.danger, fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono','Consolas',monospace" }}>
                        GH₵{totalExp.toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ── P&L SUMMARY TAB ── */}
        {tab === 'summary' && (
          <Section
            title={`Profit & Loss Statement — ${months[filterMonth - 1]} ${filterYear}`}
            actions={
              <Btn size="xs" variant="teal" onClick={() => {
                const rows = [
                  { Type: 'REVENUE', Category: '', Amount: '' },
                  ...Object.entries(revByCat).map(([cat, amt]) => ({ Type: '', Category: cat, Amount: amt })),
                  { Type: 'Total Revenue', Category: '', Amount: totalRev },
                  { Type: '', Category: '', Amount: '' },
                  { Type: 'EXPENDITURE', Category: '', Amount: '' },
                  ...Object.entries(expByCat).map(([cat, amt]) => ({ Type: '', Category: cat.replace(/_/g, ' '), Amount: amt })),
                  { Type: 'Total Expenditure', Category: '', Amount: totalExp },
                  { Type: '', Category: '', Amount: '' },
                  { Type: 'NET PROFIT/LOSS', Category: '', Amount: netProfit },
                ];
                const ws = XLSX.utils.json_to_sheet(rows);
                ws['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }];
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'P&L Summary');
                XLSX.writeFile(wb, `PL_Summary_${months[filterMonth - 1]}_${filterYear}.xlsx`);
              }}>📤 Export P&L</Btn>
            }
          >
            <div style={{ maxWidth: 640 }}>
              {/* Revenue block */}
              <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, color: C.success, fontSize: 11, marginBottom: 14, borderBottom: `1px solid ${C.successBorder}`, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>📈 Revenue Breakdown</div>
                {Object.entries(revByCat).length === 0 ? (
                  <div style={{ color: C.textMuted, fontSize: 12, fontFamily: FONT }}>No revenue entries this period</div>
                ) : Object.entries(revByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: C.text, fontFamily: FONT }}>{cat}</span>
                    <span style={{ fontWeight: 700, color: C.success, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 12.5 }}>GH₵{amt.toLocaleString('en-GH', { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.successBorder}`, marginTop: 10, paddingTop: 10, fontWeight: 800, fontSize: 14 }}>
                  <span style={{ color: C.success, fontFamily: FONT }}>TOTAL REVENUE</span>
                  <span style={{ color: C.success, fontFamily: "'JetBrains Mono','Consolas',monospace" }}>GH₵{totalRev.toLocaleString('en-GH', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Expenditure block */}
              <div style={{ background: C.dangerLight, border: `1px solid ${C.dangerBorder}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, color: C.danger, fontSize: 11, marginBottom: 14, borderBottom: `1px solid ${C.dangerBorder}`, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>📉 Expenditure Breakdown</div>
                {Object.entries(expByCat).length === 0 ? (
                  <div style={{ color: C.textMuted, fontSize: 12, fontFamily: FONT }}>No expenditure entries this period</div>
                ) : Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: C.text, fontFamily: FONT }}>{cat.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: 700, color: C.danger, fontFamily: "'JetBrains Mono','Consolas',monospace", fontSize: 12.5 }}>GH₵{amt.toLocaleString('en-GH', { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.dangerBorder}`, marginTop: 10, paddingTop: 10, fontWeight: 800, fontSize: 14 }}>
                  <span style={{ color: C.danger, fontFamily: FONT }}>TOTAL EXPENDITURE</span>
                  <span style={{ color: C.danger, fontFamily: "'JetBrains Mono','Consolas',monospace" }}>GH₵{totalExp.toLocaleString('en-GH', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Net P&L */}
              <div style={{
                background: netProfit >= 0 ? C.successLight : C.dangerLight,
                border: `2px solid ${netProfit >= 0 ? C.successBorder : C.dangerBorder}`,
                borderRadius: 12, padding: '22px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: FONT }}>
                  Net {netProfit >= 0 ? 'Profit' : 'Loss'} — {months[filterMonth - 1]} {filterYear}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: netProfit >= 0 ? C.success : C.danger, fontFamily: "'JetBrains Mono','Consolas',monospace", letterSpacing: -1 }}>
                  {netProfit < 0 ? '- ' : ''}GH₵{Math.abs(netProfit).toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                </div>
                {totalRev > 0 && (
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8, fontFamily: FONT }}>
                    Profit Margin: <strong>{((netProfit / totalRev) * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Revenue Modal */}
      {showRevModal && (
        <Modal title={editRev ? 'Edit Revenue Entry' : 'Add Revenue Entry'} onClose={() => { setShowRevModal(false); setEditRev(null); }}>
          <RevenueForm
            initial={editRev ? { ...editRev, amount: editRev.amount?.toString() || '', time: extractTime(editRev) } : null}
            onSave={editRev ? updateRev : addRev}
            onClose={() => { setShowRevModal(false); setEditRev(null); }}
          />
        </Modal>
      )}

      {/* Expenditure Modal */}
      {showExpModal && (
        <Modal title={editExp ? 'Edit Expenditure Entry' : 'Add Expenditure Entry'} onClose={() => { setShowExpModal(false); setEditExp(null); }}>
          <ExpenditureForm
            initial={editExp ? { ...editExp, amount: editExp.amount?.toString() || '', time: extractTime(editExp) } : null}
            onSave={editExp ? updateExp : addExp}
            onClose={() => { setShowExpModal(false); setEditExp(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
