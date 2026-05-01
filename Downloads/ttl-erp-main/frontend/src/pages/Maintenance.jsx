import React, { useEffect, useState } from 'react';
import { maintenanceAPI, trucksAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Textarea, Section, Badge, StatCard, FormGrid, SearchInput, ExcelImportBtn, exportToExcel, downloadExcelTemplate, exportToPDF } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY = { truckNumber:'', serviceType:'ROUTINE', customServiceType:'', description:'', serviceDate:'', odometerAtService:'', tripsCovered:'', presentOdometer:'', cost:'', vendor:'', invoiceNumber:'', nextServiceDate:'', nextServiceOdometer:'', status:'COMPLETED', performedBy:'', remarks:'' };
const STATUS_MAP = { COMPLETED:'success', IN_PROGRESS:'warning', SCHEDULED:'info', CANCELLED:'danger' };
const SERVICE_TYPES = ['ROUTINE','OIL CHANGE','BRAKE SERVICE','TYRE ROTATION','ENGINE OVERHAUL','ELECTRICAL','BODY REPAIR','AC SERVICE','CLUTCH','GEAR BOX','SUSPENSION','WHEEL ALIGNMENT','FULL SERVICE','EMERGENCY','CUSTOM'];

const EXCEL_COLS = [
  { key:'truckNumber', label:'Truck Number', required:true, sample:'MH01AB1234' },
  { key:'serviceType', label:'Service Type', sample:'ROUTINE' },
  { key:'description', label:'Description', sample:'Regular service' },
  { key:'serviceDate', label:'Service Date (YYYY-MM-DD)', sample:'2025-01-15' },
  { key:'cost', label:'Cost', sample:'5000' },
  { key:'vendor', label:'Workshop/Vendor', sample:'ABC Garage' },
  { key:'invoiceNumber', label:'Invoice Number', sample:'INV-001' },
  { key:'odometerAtService', label:'Odometer at Service', sample:'80000' },
  { key:'nextServiceDate', label:'Next Service Date', sample:'2025-07-15' },
  { key:'status', label:'Status', sample:'COMPLETED' },
];

export default function Maintenance() {
  const { isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin() || hasPermission('MANAGE_MAINTENANCE');
  const canDelete = isAdmin() || hasPermission('MANAGE_MAINTENANCE');
  const [records, setRecords] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([maintenanceAPI.getAll(), trucksAPI.getNumbers()])
    .then(([m, t]) => { setRecords(m.data); setTrucks(t.data); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const mQ = !q || r.truckNumber?.toLowerCase().includes(q) || r.serviceType?.toLowerCase().includes(q) || r.vendor?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    const mT = !filterType || r.serviceType === filterType;
    return mQ && mT;
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, cost: form.cost ? +form.cost : null, odometerAtService: form.odometerAtService ? +form.odometerAtService : null, nextServiceOdometer: form.nextServiceOdometer ? +form.nextServiceOdometer : null, tripsCovered: form.tripsCovered ? +form.tripsCovered : null, presentOdometer: form.presentOdometer ? +form.presentOdometer : null };
      if (modal === 'add') { await maintenanceAPI.add(payload); toast.success('Maintenance record added'); }
      else { await maintenanceAPI.update(selected.id, payload); toast.success('Updated'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleDelete = async (r) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    await maintenanceAPI.delete(r.id); toast.success('Deleted'); load();
  };

  const handleImport = async (rows) => {
    let ok = 0, fail = 0;
    for (const r of rows) {
      try { await maintenanceAPI.add({ ...r, cost: r.cost ? +r.cost : null, odometerAtService: r.odometerAtService ? +r.odometerAtService : null }); ok++; }
      catch { fail++; }
    }
    toast.success(`Imported: ${ok}${fail ? ` (${fail} failed)` : ''}`); load();
  };

  const totalCost = filtered.reduce((s, r) => s + (r.cost || 0), 0);
  const cols = [
    { key: 'truckNumber', label: 'Truck No.', color: '#1565c0' },
    { key: 'serviceType', label: 'Service Type' },
    { key: 'description', label: 'Description', minWidth: 140 },
    { key: 'serviceDate', label: 'Service Date' },
    { key: 'odometerAtService', label: 'Odometer', align: 'right', render: v => v ? `${Number(v).toLocaleString('en-GH')} km` : '—' },
    { key: 'cost', label: 'Cost', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'vendor', label: 'Workshop' },
    { key: 'tripsCovered', label: 'Trips Covered', align: 'right', render: v => v ? Number(v).toLocaleString() : '—' },
    { key: 'presentOdometer', label: 'Present Odo', align: 'right', render: v => v ? `${Number(v).toLocaleString('en-GH')} km` : '—' },
    { key: 'nextServiceDate', label: 'Next Service' },
    { key: 'status', label: 'Status', render: v => <Badge text={v} type={STATUS_MAP[v] || 'default'} /> },
  ];

  return (
    <div>
      <PageHeader title="MAINTENANCE LOG" subtitle={`${filtered.length} records | Total Cost: GH₵${totalCost.toLocaleString('en-GH')}`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="Truck/service/workshop..." />,
          <select key="sf" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #90caf9', borderRadius: 3, fontSize: 11, outline: 'none' }}>
            <option value="">All Types</option>
            {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>,
          canEdit && <Btn key="tmpl" variant="secondary" onClick={() => downloadExcelTemplate(EXCEL_COLS, 'maintenance')}>📄 Template</Btn>,
          canEdit && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport} />,
          <Btn key="exp" variant="teal" onClick={() => exportToExcel(filtered, cols, 'maintenance')}>📤 Excel</Btn>,
          <Btn key="pdf" variant="gold" onClick={() => exportToPDF(filtered, cols, 'Maintenance Log', 'maintenance')}>📄 PDF</Btn>,
          canEdit && <Btn key="add" variant="success" onClick={() => { setForm({ ...EMPTY, serviceDate: new Date().toISOString().split('T')[0], status: 'COMPLETED' }); setModal('add'); }}>+ Add Record</Btn>,
        ]}
      />
      <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Total Records" value={records.length} icon="🔩" color="#1565c0" />
        <StatCard label="Completed" value={records.filter(r => r.status === 'COMPLETED').length} icon="✓" color="#2e7d32" />
        <StatCard label="In Progress" value={records.filter(r => r.status === 'IN_PROGRESS').length} icon="⚙" color="#e65100" />
        <StatCard label="Total Cost" value={`GH₵${totalCost.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="💰" color="#6a1b9a" />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Section title={`Maintenance Records — ${filtered.length}`}>
          <KLTable columns={cols} data={filtered} loading={loading}
            onView={r => { setSelected(r); setModal('view'); }}
            onEdit={canEdit ? r => { setForm({ ...EMPTY, ...r }); setSelected(r); setModal('edit'); } : null}
            onDelete={canDelete ? handleDelete : null}
          />
        </Section>
      </div>

      {modal === 'view' && selected && (
        <Modal title={`Maintenance Record — ${selected.truckNumber}`} onClose={() => setModal(null)} width={600}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', fontSize: 13 }}>
            {[
              ['Truck Number', selected.truckNumber],
              ['Service Type', selected.serviceType === 'CUSTOM' ? selected.customServiceType : selected.serviceType],
              ['Status', selected.status],
              ['Service Date', selected.serviceDate || '—'],
              ['Odometer at Service', selected.odometerAtService ? `${selected.odometerAtService} km` : '—'],
              ['Present Odometer', selected.presentOdometer ? `${selected.presentOdometer} km` : '—'],
              ['Trips Covered', selected.tripsCovered || '—'],
              ['Cost', selected.cost ? `GH₵${Number(selected.cost).toLocaleString('en-GH')}` : '—'],
              ['Workshop / Vendor', selected.vendor || '—'],
              ['Invoice Number', selected.invoiceNumber || '—'],
              ['Performed By', selected.performedBy || '—'],
              ['Next Service Date', selected.nextServiceDate || '—'],
              ['Next Service Odometer', selected.nextServiceOdometer ? `${selected.nextServiceOdometer} km` : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #eef2f9' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 600, color: '#0F1A2A' }}>{value}</div>
              </div>
            ))}
          </div>
          {selected.description && <div style={{ marginTop: 14, padding: '10px 12px', background: '#f5f7fb', borderRadius: 4, fontSize: 12 }}><strong>Description:</strong> {selected.description}</div>}
          {selected.remarks && <div style={{ marginTop: 8, padding: '10px 12px', background: '#f5f7fb', borderRadius: 4, fontSize: 12 }}><strong>Remarks:</strong> {selected.remarks}</div>}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Badge text={selected.status} type={STATUS_MAP[selected.status] || 'default'} />
          </div>
        </Modal>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Maintenance Record' : 'Edit Record'} onClose={() => setModal(null)} width={720}>
          <form onSubmit={handleSubmit}>
            <FormGrid cols={3}>
              <Field label="Truck Number" required>
                <Select name="truckNumber" value={form.truckNumber} onChange={handleChange} required>
                  <option value="">Select Truck</option>
                  {trucks.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Service Type">
                <Select name="serviceType" value={form.serviceType} onChange={handleChange}>
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Status">
                <Select name="status" value={form.status} onChange={handleChange}>
                  {['COMPLETED', 'IN_PROGRESS', 'SCHEDULED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Service Date"><Input name="serviceDate" type="date" value={form.serviceDate} onChange={handleChange} /></Field>
              <Field label="Odometer at Service"><Input name="odometerAtService" type="number" value={form.odometerAtService} onChange={handleChange} /></Field>
              <Field label="Cost (GH₵)"><Input name="cost" type="number" step="0.01" value={form.cost} onChange={handleChange} /></Field>
              <Field label="Workshop / Vendor"><Input name="vendor" value={form.vendor} onChange={handleChange} /></Field>
              <Field label="Invoice Number"><Input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} /></Field>
              <Field label="Performed By"><Input name="performedBy" value={form.performedBy} onChange={handleChange} /></Field>
              <Field label="Trips Covered"><Input name="tripsCovered" type="number" value={form.tripsCovered} onChange={handleChange} placeholder="No. of trips"/></Field>
              <Field label="Present Odometer (km)"><Input name="presentOdometer" type="number" value={form.presentOdometer} onChange={handleChange}/></Field>
              {form.serviceType === 'CUSTOM' && <Field label="Custom Service Type" required cols={3}><Input name="customServiceType" value={form.customServiceType||''} onChange={handleChange} placeholder="Enter custom service type..." required/></Field>}
              <Field label="Next Service Date"><Input name="nextServiceDate" type="date" value={form.nextServiceDate} onChange={handleChange} /></Field>
              <Field label="Next Service Odometer"><Input name="nextServiceOdometer" type="number" value={form.nextServiceOdometer} onChange={handleChange} /></Field>
              <Field label="Description" cols={3}><Input name="description" value={form.description} onChange={handleChange} /></Field>
              <Field label="Remarks" cols={3}><Input name="remarks" value={form.remarks} onChange={handleChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal === 'add' ? 'Add Record' : 'Save Changes'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
