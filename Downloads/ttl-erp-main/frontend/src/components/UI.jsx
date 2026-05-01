import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export const C = {
  primary: '#0B1F3A', primaryDark: '#071428', primaryMid: '#1a3a5c',
  primaryLight: '#EBF0F7', primaryBorder: '#BFD0E8',
  accent: '#C8922A', accentLight: '#FDF4E3', accentBorder: '#E8C872',
  success: '#0D6B35', successLight: '#E6F4ED', successBorder: '#7BC99A',
  warning: '#B45309', warningLight: '#FEF3C7', warningBorder: '#F6C97A',
  danger: '#9B1C1C', dangerLight: '#FEE8E8', dangerBorder: '#F5A3A3',
  info: '#1E5F8C', infoLight: '#E0EEF7', infoBorder: '#7DB8D8',
  text: '#0F1A2A', textMuted: '#5A6E82', textLight: '#8A9BAD',
  border: '#D8E2EE', bg: '#F0F4F9', white: '#FFFFFF',
  tableBg: '#F8FAFD', tableHead: '#EEF2F9',
  shadow: '0 2px 8px rgba(11,31,58,0.10)', shadowMd: '0 4px 16px rgba(11,31,58,0.13)',
};

const FONT = "'JetBrains Mono','Fira Code','Consolas',monospace";

if (typeof document !== 'undefined') {
  const id = 'erp-fonts';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap';
    document.head.appendChild(link);
  }
  const styleId = 'erp-global-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      body, html { font-family: 'JetBrains Mono', monospace !important; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .erp-row-hover:hover td { background: #E8EFF8 !important; }
      .erp-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,31,58,0.14) !important; }
      input:focus, select:focus, textarea:focus {
        border-color: #1a3a5c !important;
        box-shadow: 0 0 0 3px rgba(11,31,58,0.10) !important;
        outline: none !important;
      }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: #F0F4F9; }
      ::-webkit-scrollbar-thumb { background: #BFD0E8; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #8AAAC8; }
    `;
    document.head.appendChild(style);
  }
}

export function Badge({ text, type = 'default' }) {
  const map = {
    success: { bg: '#E6F4ED', color: '#0D6B35', border: '#7BC99A' },
    danger:  { bg: '#FEE8E8', color: '#9B1C1C', border: '#F5A3A3' },
    warning: { bg: '#FEF3C7', color: '#B45309', border: '#F6C97A' },
    info:    { bg: '#E0EEF7', color: '#1E5F8C', border: '#7DB8D8' },
    primary: { bg: '#EBF0F7', color: '#0B1F3A', border: '#BFD0E8' },
    gold:    { bg: '#FDF4E3', color: '#C8922A', border: '#E8C872' },
    default: { bg: '#F1F5FA', color: '#5A6E82', border: '#C8D6E4' },
    teal:    { bg: '#E0F4F1', color: '#0D6B62', border: '#7BC9C0' },
  };
  const s = map[type] || map.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: FONT,
      letterSpacing: 0.5, textTransform: 'uppercase',
    }}>{text}</span>
  );
}

export function StatCard({ label, value, sub, color = '#0B1F3A', icon }) {
  return (
    <div className="erp-card-hover" style={{
      background: '#fff', border: '1px solid #D8E2EE', borderRadius: 12,
      padding: '18px 22px', flex: 1, minWidth: 160,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 10px rgba(11,31,58,0.08)',
      transition: 'all 0.2s ease', animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ color: '#5A6E82', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: FONT }}>{label}</span>
        {icon && <span style={{ fontSize: 14, width: 32, height: 32, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}20` }}>{icon}</span>}
      </div>
      <div style={{ color: '#0F1A2A', fontSize: 22, fontWeight: 800, lineHeight: 1, fontFamily: FONT, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: '#8A9BAD', fontSize: 10, marginTop: 6, fontFamily: FONT }}>{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0B1F3A 0%, #1a3a5c 100%)',
      padding: '0 28px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', minHeight: 64,
      boxShadow: '0 2px 12px rgba(11,31,58,0.20)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 4, height: 32, background: 'linear-gradient(180deg, #C8922A, #E8B84B)', borderRadius: 2 }} />
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 13, fontFamily: FONT, letterSpacing: 1.5, textTransform: 'uppercase' }}>{title}</div>
          {subtitle && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9.5, marginTop: 2, fontFamily: FONT, letterSpacing: 0.3 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>
    </div>
  );
}

export function Section({ title, children, actions }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #D8E2EE', borderRadius: 12,
      overflow: 'hidden', marginBottom: 20,
      boxShadow: '0 2px 10px rgba(11,31,58,0.07)',
      animation: 'fadeIn 0.3s ease',
    }}>
      {title && (
        <div style={{
          background: 'linear-gradient(90deg, #EEF2F9, #F4F7FC)',
          padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1px solid #D8E2EE',
        }}>
          <span style={{ fontWeight: 700, fontSize: 9.5, color: '#0B1F3A', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: FONT }}>{title}</span>
          {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'sm', disabled, type = 'button', style: extra }) {
  const vars = {
    primary:   { bg: '#0B1F3A', color: '#fff', border: '#071428', hov: '#1a3a5c' },
    success:   { bg: '#0D6B35', color: '#fff', border: '#0A5028', hov: '#0A5028' },
    danger:    { bg: '#9B1C1C', color: '#fff', border: '#7A1515', hov: '#7A1515' },
    warning:   { bg: '#B45309', color: '#fff', border: '#8B3F07', hov: '#8B3F07' },
    outline:   { bg: '#fff',    color: '#0B1F3A', border: '#BFD0E8', hov: '#EBF0F7' },
    secondary: { bg: '#EEF2F9', color: '#5A6E82', border: '#D8E2EE', hov: '#DDE6F2' },
    excel:     { bg: '#1D6F42', color: '#fff', border: '#155232', hov: '#155232' },
    info:      { bg: '#1E5F8C', color: '#fff', border: '#164A6F', hov: '#164A6F' },
    teal:      { bg: '#0D6B62', color: '#fff', border: '#095047', hov: '#095047' },
    gold:      { bg: '#C8922A', color: '#fff', border: '#9E6E1A', hov: '#9E6E1A' },
    purple:    { bg: '#5B21B6', color: '#fff', border: '#4C1D95', hov: '#4C1D95' },
  };
  const v = vars[variant] || vars.primary;
  const pad = size === 'xs' ? '4px 10px' : size === 'sm' ? '7px 14px' : '9px 20px';
  const fs = size === 'xs' ? 9.5 : size === 'sm' ? 10.5 : 12;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        background: disabled ? '#E8EDF4' : v.bg, color: disabled ? '#9AABBB' : v.color,
        border: `1px solid ${disabled ? '#D0D9E6' : v.border}`,
        padding: pad, borderRadius: 6, fontSize: fs, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: FONT, whiteSpace: 'nowrap', letterSpacing: 0.3,
        transition: 'all 0.15s', ...extra,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = v.hov)}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = v.bg)}
    >{children}</button>
  );
}

export function Modal({ title, onClose, children, width = 600 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,20,40,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: width,
        maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 72px rgba(11,31,58,0.35)', animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0B1F3A, #1a3a5c)',
          padding: '16px 22px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0, borderBottom: '2px solid rgba(200,146,42,0.4)',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: FONT, letterSpacing: 0.5 }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', borderRadius: 6, width: 28, height: 28, fontSize: 18, lineHeight: 1, fontFamily: FONT,
          }}>×</button>
        </div>
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, required, children, cols }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: cols ? `span ${cols}` : undefined }}>
      {label && <label style={{ fontSize: 9.5, fontWeight: 700, color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: FONT }}>
        {label}{required && <span style={{ color: '#9B1C1C' }}> *</span>}
      </label>}
      {children}
    </div>
  );
}

const inputBase = {
  width: '100%', padding: '8px 12px', fontSize: 12, fontFamily: FONT,
  border: '1px solid #D8E2EE', borderRadius: 6, outline: 'none',
  background: '#FAFBFD', color: '#0F1A2A', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
export const Input = (props) => <input style={inputBase} {...props} />;
export const Select = ({ children, ...props }) => <select style={inputBase} {...props}>{children}</select>;
export const Textarea = (props) => <textarea style={{ ...inputBase, resize: 'vertical', minHeight: 64 }} {...props} />;

export function FormGrid({ cols = 3, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: '14px 16px' }}>{children}</div>;
}

const thStyleBase = {
  background: 'linear-gradient(90deg, #EEF2F9, #E8EFF8)',
  padding: '10px 14px', fontWeight: 700, fontSize: 9.5,
  color: '#0B1F3A', textTransform: 'uppercase', letterSpacing: 1,
  borderBottom: '2px solid #BFD0E8', whiteSpace: 'nowrap', fontFamily: FONT,
};
const tdStyleBase = { padding: '10px 14px', color: '#0F1A2A', verticalAlign: 'middle', fontSize: 11.5, fontFamily: FONT };

export function KLTable({ columns, data, onEdit, onDelete, onView, loading, emptyMsg = 'No records found', actions, rowKey = 'id' }) {
  if (loading) return (
    <div style={{ padding: 56, textAlign: 'center', color: '#5A6E82', fontSize: 12, fontFamily: FONT }}>
      <div style={{ width: 32, height: 32, border: '3px solid #D8E2EE', borderTop: '3px solid #0B1F3A', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
      Loading data...
    </div>
  );
  return (
    <div style={{ overflowX: 'auto', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, fontFamily: FONT }}>
        <thead>
          <tr>
            <th style={{ ...thStyleBase, width: 42 }}>#</th>
            {columns.map(c => <th key={c.key} style={{ ...thStyleBase, textAlign: c.align || 'left', minWidth: c.minWidth }}>{c.label}</th>)}
            {(onEdit || onDelete || onView || actions) && <th style={{ ...thStyleBase, width: 130, textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + 2} style={{ padding: 32, textAlign: 'center', color: '#8A9BAD', fontSize: 12, fontFamily: FONT, background: '#FAFBFD' }}>{emptyMsg}</td></tr>
          ) : data.map((row, i) => (
            <tr key={row[rowKey] || i} className="erp-row-hover"
              style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFD', borderBottom: '1px solid #E8EFF8', transition: 'background 0.1s' }}>
              <td style={{ ...tdStyleBase, color: '#8A9BAD', fontWeight: 600 }}>{i + 1}</td>
              {columns.map(c => (
                <td key={c.key} style={{ ...tdStyleBase, textAlign: c.align || 'left', color: c.color }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
              {(onEdit || onDelete || onView || actions) && (
                <td style={{ ...tdStyleBase, whiteSpace: 'nowrap', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    {onView && <Btn size="xs" variant="info" onClick={() => onView(row)}>View</Btn>}
                    {onEdit && <Btn size="xs" variant="outline" onClick={() => onEdit(row)}>Edit</Btn>}
                    {onDelete && <Btn size="xs" variant="danger" onClick={() => onDelete(row)}>Del</Btn>}
                    {actions && actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #D8E2EE', background: '#fff', padding: '0 24px', gap: 0 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 10.5, fontWeight: active === t.key ? 800 : 500,
          color: active === t.key ? '#0B1F3A' : '#8A9BAD',
          borderBottom: active === t.key ? '3px solid #C8922A' : '3px solid transparent',
          marginBottom: -2, fontFamily: FONT, whiteSpace: 'nowrap',
          transition: 'all .15s', letterSpacing: 0.3,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ paddingLeft: 32, width: 220, padding: '7px 12px 7px 32px', fontSize: 11, fontFamily: FONT, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6, outline: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', boxSizing: 'border-box' }} />
    </div>
  );
}

export function ExcelImportBtn({ onData, columns, label = 'Import Excel' }) {
  const ref = useRef();
  const handle = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const mapped = raw.map(row => {
          const out = {};
          columns.forEach(col => {
            const cands = [col.key, col.label, col.label?.toLowerCase(), col.label?.replace(/\s+/g, ''), col.label?.replace(/\s+/g, '_')].filter(Boolean);
            for (const c of cands) {
              const found = Object.keys(row).find(k => k.trim().toLowerCase().replace(/\s+/g, '') === c.toLowerCase().replace(/\s+/g, ''));
              if (found !== undefined) { out[col.key] = row[found]; break; }
            }
          });
          return out;
        }).filter(r => Object.values(r).some(v => v !== '' && v !== undefined));
        onData(mapped);
      } catch (err) { alert('Error reading Excel: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };
  return (
    <>
      <input ref={ref} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handle} />
      <Btn variant="excel" onClick={() => ref.current.click()}>📥 {label}</Btn>
    </>
  );
}

export function exportToExcel(data, columns, filename = 'export') {
  const rows = data.map(row => {
    const out = {};
    columns.forEach(c => { out[c.label] = c.exportVal ? c.exportVal(row) : (row[c.key] ?? ''); });
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.label.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function downloadExcelTemplate(columns, filename = 'template') {
  const header = columns.map(c => c.label);
  const sample = [columns.map(c => c.sample || '')];
  const ws = XLSX.utils.aoa_to_sheet([header, ...sample]);
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.label.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `${filename}_template.xlsx`);
}

export { KLTable as TallyTable };
export { Btn as FilterSelect };
