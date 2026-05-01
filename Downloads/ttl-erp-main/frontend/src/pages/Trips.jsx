import React, { useEffect, useState } from 'react';
import { tripsAPI, trucksAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Textarea, Section, Badge, StatCard, FormGrid, SearchInput, ExcelImportBtn, exportToExcel, downloadExcelTemplate } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY = { waybillNumber:'', truckNumber:'', driverName:'', consignor:'', consignee:'', from:'', to:'', startDate:'', endDate:'', freight:'', paymentMode:'CREDIT', status:'PENDING', advance:'', balance:'', startTime:'', remarks:'' };

const STATUS_MAP = { PENDING:'warning', IN_TRANSIT:'info', DELIVERED:'success', BILLED:'primary', CANCELLED:'danger' };

const EXCEL_COLS = [
  { key:'waybillNumber', label:'Waybill No.', required:true, sample:'WB-2025-001' },
  { key:'truckNumber', label:'Truck Number', required:true, sample:'MH01AB1234' },
  { key:'driverName', label:'Driver Name', required:true, sample:'Ravi Kumar' },
  { key:'consignor', label:'Consignor', sample:'ABC Ltd' },
  { key:'consignee', label:'Consignee', sample:'XYZ Pvt Ltd' },
  { key:'from', label:'From', sample:'Mumbai' },
  { key:'to', label:'To', sample:'Delhi' },
  { key:'startDate', label:'Start Date (YYYY-MM-DD)', sample:'2025-01-10' },
  { key:'endDate', label:'End Date (YYYY-MM-DD)', sample:'2025-01-14' },
  { key:'freight', label:'Freight Amount', sample:'45000' },
  { key:'advance', label:'Advance', sample:'10000' },
  { key:'paymentMode', label:'Payment Mode', sample:'CREDIT' },
  { key:'status', label:'Status', sample:'PENDING' },
  { key:'remarks', label:'Remarks', sample:'' },
];

export default function Trips() {
  const { isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin() || hasPermission('CREATE_TRIPS') || hasPermission('APPROVE_TRIPS');
  const canDelete = isAdmin() || hasPermission('APPROVE_TRIPS');
  const [trips, setTrips] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([tripsAPI.getAll(), trucksAPI.getNumbers()])
    .then(([t, tr]) => { setTrips(t.data); setTrucks(tr.data); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.waybillNumber?.toLowerCase().includes(q) || t.truckNumber?.toLowerCase().includes(q) || t.driverName?.toLowerCase().includes(q) || t.consignor?.toLowerCase().includes(q) || t.consignee?.toLowerCase().includes(q) || t.from?.toLowerCase().includes(q) || t.to?.toLowerCase().includes(q);
    const matchS = !filterStatus || t.status === filterStatus;
    return matchQ && matchS;
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, freight: form.freight ? +form.freight : null, advance: form.advance ? +form.advance : null, balance: form.freight && form.advance ? +form.freight - +form.advance : null };
      if (modal === 'add') { await tripsAPI.add(payload); toast.success('Trip created'); }
      else { await tripsAPI.update(selected.id, payload); toast.success('Trip updated'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Error saving'); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete trip ${t.waybillNumber}?`)) return;
    await tripsAPI.delete(t.id); toast.success('Deleted'); load();
  };

  const handleImport = async (rows) => {
    let ok = 0, fail = 0;
    for (const r of rows) {
      try { await tripsAPI.add({ ...r, freight: r.freight ? +r.freight : null, advance: r.advance ? +r.advance : null }); ok++; }
      catch { fail++; }
    }
    toast.success(`Imported: ${ok}${fail ? ` (${fail} failed)` : ''}`); load();
  };

  const totalFreight = filtered.reduce((s, t) => s + (t.freight || 0), 0);
  const totalBalance = filtered.reduce((s, t) => s + (t.balance || 0), 0);

  const cols = [
    { key: 'waybillNumber', label: 'Waybill No.', color: '#1565c0', minWidth: 110 },
    { key: 'truckNumber', label: 'Truck No.' },
    { key: 'driverName', label: 'Driver' },
    { key: 'from', label: 'From → To', render: (_, r) => `${r.from || '—'} → ${r.to || '—'}` },
    { key: 'startDate', label: 'Start Date' },
    { key: 'freight', label: 'Freight', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'advance', label: 'Advance', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'balance', label: 'Balance', align: 'right', render: v => v ? <span style={{ color: '#c62828', fontWeight: 700 }}>GH₵{Number(v).toLocaleString('en-GH')}</span> : '—' },
    { key: 'status', label: 'Status', render: v => <Badge text={v} type={STATUS_MAP[v] || 'default'} /> },
  ];

  return (
    <div>
      <PageHeader title="TRIPS & CHALLAN" subtitle={`${filtered.length} trips | Freight: GH₵${totalFreight.toLocaleString('en-GH')} | Balance: GH₵${totalBalance.toLocaleString('en-GH')}`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="LR/Truck/Driver/Place..." />,
          <select key="sf" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #90caf9', borderRadius: 3, fontSize: 11, outline: 'none' }}>
            <option value="">All Status</option>
            {['PENDING', 'IN_TRANSIT', 'DELIVERED', 'BILLED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
          </select>,
          canEdit && <Btn key="tmpl" variant="secondary" onClick={() => downloadExcelTemplate(EXCEL_COLS, 'trips')}>📄 Template</Btn>,
          canEdit && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport} />,
          <Btn key="exp" variant="teal" onClick={() => exportToExcel(filtered, cols, 'trips')}>📤 Export</Btn>,
          canEdit && <Btn key="add" variant="success" onClick={() => { setForm({ ...EMPTY, startDate: new Date().toISOString().split('T')[0] }); setModal('add'); }}>+ New Trip</Btn>,
        ]}
      />

      <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Total Trips" value={filtered.length} icon="📋" color="#1565c0" />
        <StatCard label="Pending" value={trips.filter(t => t.status === 'PENDING').length} icon="⏳" color="#e65100" />
        <StatCard label="In Transit" value={trips.filter(t => t.status === 'IN_TRANSIT').length} icon="🚛" color="#01579b" />
        <StatCard label="Delivered" value={trips.filter(t => t.status === 'DELIVERED').length} icon="✓" color="#2e7d32" />
        <StatCard label="Total Freight" value={`GH₵${totalFreight.toLocaleString('en-GH')}`} icon="💰" color="#6a1b9a" />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Section title={`Trip Register — ${filtered.length} records`}>
          <KLTable columns={cols} data={filtered} loading={loading}
            onView={t => { setSelected(t); setModal('view'); }}
            onEdit={canEdit ? t => { setForm({ ...EMPTY, ...t }); setSelected(t); setModal('edit'); } : null}
            onDelete={canDelete ? handleDelete : null}
          />
        </Section>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'New Trip' : `Edit Trip — ${selected?.waybillNumber}`} onClose={() => setModal(null)} width={760}>
          <form onSubmit={handleSubmit}>
            <FormGrid cols={3}>
              <Field label="Waybill No." required><Input name="waybillNumber" value={form.lrNumber} onChange={handleChange} required /></Field>
              <Field label="Truck Number" required>
                <Select name="truckNumber" value={form.truckNumber} onChange={handleChange} required>
                  <option value="">Select Truck</option>
                  {trucks.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Driver Name" required><Input name="driverName" value={form.driverName} onChange={handleChange} required /></Field>
              <Field label="Consignor"><Input name="consignor" value={form.consignor} onChange={handleChange} /></Field>
              <Field label="Consignee"><Input name="consignee" value={form.consignee} onChange={handleChange} /></Field>
              <Field label="Payment Mode">
                <Select name="paymentMode" value={form.paymentMode} onChange={handleChange}>
                  {['CASH', 'CREDIT', 'ACCOUNT', 'ADVANCE'].map(v => <option key={v}>{v}</option>)}
                </Select>
              </Field>
              <Field label="From"><Input name="from" value={form.from} onChange={handleChange} /></Field>
              <Field label="To"><Input name="to" value={form.to} onChange={handleChange} /></Field>
              <Field label="Status">
                <Select name="status" value={form.status} onChange={handleChange}>
                  {['PENDING', 'IN_TRANSIT', 'DELIVERED', 'BILLED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Start Date"><Input name="startDate" type="date" value={form.startDate} onChange={handleChange} /></Field>
              <Field label="Start Time"><Input name="startTime" type="time" value={form.startTime||''} onChange={handleChange} /></Field>
              <Field label="End Date"><Input name="endDate" type="date" value={form.endDate} onChange={handleChange} /></Field>
              <Field label="Freight (GH₵)"><Input name="freight" type="number" value={form.freight} onChange={handleChange} /></Field>
              <Field label="Advance (GH₵)"><Input name="advance" type="number" value={form.advance} onChange={handleChange} /></Field>
              {form.freight && form.advance && (
                <Field label="Balance">
                  <div style={{ padding: '6px 10px', background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 3, fontSize: 13, fontWeight: 700, color: '#c62828' }}>
                    GH₵{(+form.freight - +form.advance).toLocaleString('en-GH')}
                  </div>
                </Field>
              )}
              <Field label="Remarks" cols={3}><Input name="remarks" value={form.remarks} onChange={handleChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal === 'add' ? 'Create Trip' : 'Save Changes'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title={`Trip Details — ${selected.waybillNumber}`} onClose={() => setModal(null)} width={640}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13 }}>
            {[['Waybill No.', selected.waybillNumber], ['Truck', selected.truckNumber], ['Driver', selected.driverName],
              ['Consignor', selected.consignor], ['Consignee', selected.consignee],
              ['Route', `${selected.from || '—'} → ${selected.to || '—'}`],
              ['Start Date', selected.startDate], ['End Date', selected.endDate || 'In Progress'],
              ['Freight', selected.freight ? `GH₵${Number(selected.freight).toLocaleString('en-GH')}` : '—'],
              ['Advance', selected.advance ? `GH₵${Number(selected.advance).toLocaleString('en-GH')}` : '—'],
              ['Balance', selected.balance ? `GH₵${Number(selected.balance).toLocaleString('en-GH')}` : '—'],
              ['Payment Mode', selected.paymentMode],
            ].map(([k, v]) => (
              <div key={k}><div style={{ color: '#607d8b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{k}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v || '—'}</div></div>
            ))}
          </div>
          {selected.remarks && <div style={{ marginTop: 16, padding: '10px', background: '#f4f6f9', borderRadius: 4, fontSize: 12 }}><strong>Remarks:</strong> {selected.remarks}</div>}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Badge text={selected.status} type={STATUS_MAP[selected.status] || 'default'} />
          </div>
        </Modal>
      )}
    </div>
  );
}
