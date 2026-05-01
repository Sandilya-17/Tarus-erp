import React, { useEffect, useState } from 'react';
import { fuelAPI, trucksAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Section, Badge, StatCard, FormGrid, SearchInput, Tabs, ExcelImportBtn, exportToExcel, downloadExcelTemplate } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY = { truckNumber:'', date:'', quantity:'', pricePerLitre:'', paymentMode:'CASH', invoiceNumber:'', odometer:'', enteredBy:'', approvalStatus:'PENDING', fuelStation:'', technicianName:'' };

const EXCEL_COLS = [
  { key:'truckNumber', label:'Truck Number', required:true, sample:'MH01AB1234' },
  { key:'date', label:'Date (YYYY-MM-DD)', required:true, sample:'2025-01-15' },
  { key:'quantity', label:'Quantity (Litres)', required:true, sample:'100' },
  { key:'pricePerLitre', label:'Price Per Litre', required:true, sample:'92.50' },
  { key:'paymentMode', label:'Payment Mode', sample:'CASH' },
  { key:'invoiceNumber', label:'Invoice Number', sample:'INV-001' },
  { key:'odometer', label:'Odometer Reading', sample:'45000' },
  { key:'fuelStation', label:'Fuel Station', sample:'Total Takoradi' },
  { key:'technicianName', label:'Technician Name', sample:'Kwame Asante' },
  { key:'approvalStatus', label:'Approval Status', sample:'APPROVED' },
];

export default function Fuel() {
  const { user, isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin() || hasPermission('ADD_FUEL') || hasPermission('APPROVE_FUEL');
  const canDelete = isAdmin() || hasPermission('APPROVE_FUEL');
  const now = new Date();
  const [entries, setEntries] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [excessReport, setExcessReport] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState('entries');
  const [filterMonth, setFilterMonth] = useState(now.getMonth()+1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterTruck, setFilterTruck] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([fuelAPI.getAll(), trucksAPI.getNumbers(), fuelAPI.getMonthly(filterMonth,filterYear)])
      .then(([f,t,ex])=>{ setEntries(f.data); setTrucks(t.data); setExcessReport(ex.data); })
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  useEffect(()=>{ fuelAPI.getMonthly(filterMonth,filterYear).then(r=>setExcessReport(r.data)); },[filterMonth,filterYear]);

  const filtered = entries.filter(e => {
    const mMatch = !filterMonth || e.month===+filterMonth;
    const yMatch = !filterYear || e.year===+filterYear;
    const tMatch = !filterTruck || e.truckNumber===filterTruck;
    return mMatch && yMatch && tMatch;
  });

  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    try {
      const payload = { ...form, quantity:+form.quantity, pricePerLitre:+form.pricePerLitre, odometer:form.odometer?+form.odometer:null, enteredBy:user?.username };
      if (modal==='add') { await fuelAPI.add(payload); toast.success('Fuel entry added'); }
      else { await fuelAPI.update(selected.id, payload); toast.success('Updated'); }
      load(); setModal(null); setForm(EMPTY);
    } catch(err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete fuel entry for ${entry.truckNumber}?`)) return;
    await fuelAPI.delete(entry.id); toast.success('Deleted'); load();
  };

  const handleImport = async (rows) => {
    let ok=0, fail=0;
    for (const r of rows) {
      try { await fuelAPI.add({...r, quantity:+r.quantity, pricePerLitre:+r.pricePerLitre, odometer:r.odometer?+r.odometer:null, enteredBy:user?.username}); ok++; }
      catch { fail++; }
    }
    toast.success(`Imported: ${ok}${fail?` (${fail} failed)`:''}`); load();
  };

  const totalLiters = filtered.reduce((s,e)=>s+(e.quantity||0),0);
  const totalCost = filtered.reduce((s,e)=>s+(e.totalAmount||0),0);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const entryCols = [
    { key:'truckNumber', label:'Truck No.', color:'#1565c0' },
    { key:'date', label:'Date' },
    { key:'quantity', label:'Quantity (L)', align:'right', render:v=>v?v.toFixed(1):'—' },
    { key:'pricePerLitre', label:'Rate/L', align:'right', render:v=>v?`GH₵${v.toFixed(2)}`:'—' },
    { key:'totalAmount', label:'Amount', align:'right', render:v=>v?`GH₵${v.toLocaleString('en-GH',{maximumFractionDigits:2})}`:'—' },
    { key:'paymentMode', label:'Payment' },
    { key:'invoiceNumber', label:'Invoice No.' },
    { key:'enteredBy', label:'By' },
    { key:'fuelStation', label:'Fuel Station' },
    { key:'technicianName', label:'Technician' },
    { key:'approvalStatus', label:'Approval', render:v=><Badge text={v||'PENDING'} type={v==='APPROVED'?'success':v==='NOT_APPROVED'?'danger':'warning'}/> },
  ];

  const excessCols = [
    { key:'truckNumber', label:'Truck No.', color:'#1565c0' },
    { key:'fuelLimit', label:'Limit (L)', align:'right', render:v=>v?.toFixed(1)||'—' },
    { key:'consumed', label:'Consumed (L)', align:'right', render:v=>v?.toFixed(1)||'—' },
    { key:'excess', label:'Excess (L)', align:'right', render:(v,r)=>r.status==='EXCESS'?<span style={{color:'#c62828',fontWeight:700}}>{v?.toFixed(1)}</span>:<span style={{color:'#2e7d32'}}>—</span> },
    { key:'status', label:'Status', render:v=><Badge text={v} type={v==='EXCESS'?'danger':'success'}/> },
  ];

  return (
    <div>
      <PageHeader title="FUEL MANAGEMENT" subtitle={`${filtered.length} entries | ${totalLiters.toFixed(1)} L | GH₵${totalCost.toLocaleString('en-GH')}`}
        actions={[
          canEdit && <Btn key="tmpl" variant="secondary" onClick={()=>downloadExcelTemplate(EXCEL_COLS,'fuel')}>📄 Template</Btn>,
          canEdit && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport}/>,
          <Btn key="exp" variant="teal" onClick={()=>exportToExcel(filtered,entryCols,'fuel')}>📤 Export</Btn>,
          canEdit && <Btn key="add" variant="success" onClick={()=>{setForm({...EMPTY,date:new Date().toISOString().split('T')[0]});setModal('add');}}>+ Fuel Entry</Btn>,
        ]}
      />
      <div style={{padding:'12px 20px',display:'flex',gap:10,flexWrap:'wrap'}}>
        <StatCard label="Total Entries" value={filtered.length} icon="📋" color="#1565c0"/>
        <StatCard label="Total Litres" value={totalLiters.toFixed(1)+'L'} icon="⛽" color="#0277bd"/>
        <StatCard label="Total Cost" value={`GH₵${totalCost.toLocaleString('en-GH',{maximumFractionDigits:0})}`} icon="💰" color="#2e7d32"/>
        <StatCard label="Excess Trucks" value={excessReport.filter(r=>r.status==='EXCESS').length} icon="⚠" color="#c62828"/>
      </div>

      {/* Filters */}
      <div style={{background:'#fff',borderBottom:'1px solid #dde3ec',padding:'8px 20px',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{color:'#607d8b',fontSize:11,fontWeight:700}}>FILTER:</span>
        <select value={filterMonth} onChange={e=>setFilterMonth(+e.target.value)} style={{padding:'4px 8px',border:'1px solid #dde3ec',borderRadius:3,fontSize:12,outline:'none'}}>
          <option value="">All Months</option>
          {months.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={e=>setFilterYear(+e.target.value)} style={{padding:'4px 8px',border:'1px solid #dde3ec',borderRadius:3,fontSize:12,outline:'none'}}>
          {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
        </select>
        <select value={filterTruck} onChange={e=>setFilterTruck(e.target.value)} style={{padding:'4px 8px',border:'1px solid #dde3ec',borderRadius:3,fontSize:12,outline:'none',minWidth:140}}>
          <option value="">All Trucks</option>
          {trucks.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <Tabs tabs={[{key:'entries',label:`Fuel Entries (${filtered.length})`},{key:'excess',label:`Monthly Excess Report`}]} active={tab} onChange={setTab}/>

      <div style={{padding:'16px 20px'}}>
        {tab==='entries' && (
          <Section title="Fuel Entry Register">
            <KLTable columns={entryCols} data={filtered} loading={loading}
              onEdit={canEdit ? e=>{setForm({...EMPTY,...e,date:e.date||''});setSelected(e);setModal('edit');} : null}
              onDelete={canDelete?handleDelete:null}
            />
          </Section>
        )}
        {tab==='excess' && (
          <Section title={`Monthly Excess Report — ${months[filterMonth-1]} ${filterYear}`}
            actions={<Btn size="xs" variant="teal" onClick={()=>exportToExcel(excessReport,excessCols,'fuel_excess')}>📤 Export</Btn>}>
            <KLTable columns={excessCols} data={excessReport} loading={loading} emptyMsg="No excess entries for this period"/>
          </Section>
        )}
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add Fuel Entry':'Edit Fuel Entry'} onClose={()=>setModal(null)} width={600}>
          <form onSubmit={handleSubmit}>
            <FormGrid cols={2}>
              <Field label="Truck Number" required>
                <Select name="truckNumber" value={form.truckNumber} onChange={handleChange} required>
                  <option value="">Select Truck</option>
                  {trucks.map(t=><option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Date" required><Input name="date" type="date" value={form.date} onChange={handleChange} required/></Field>
              <Field label="Quantity (Litres)" required><Input name="quantity" type="number" step="0.1" value={form.quantity} onChange={handleChange} required/></Field>
              <Field label="Price Per Litre" required><Input name="pricePerLitre" type="number" step="0.01" value={form.pricePerLitre} onChange={handleChange} required/></Field>
              <Field label="Payment Mode">
                <Select name="paymentMode" value={form.paymentMode} onChange={handleChange}>
                  {['CASH','CREDIT','CARD','UPI','ACCOUNT'].map(v=><option key={v}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Invoice Number"><Input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange}/></Field>
              <Field label="Odometer Reading"><Input name="odometer" type="number" value={form.odometer} onChange={handleChange}/></Field>
              <Field label="Fuel Station"><Input name="fuelStation" value={form.fuelStation||''} onChange={handleChange} placeholder="e.g. Total Takoradi"/></Field>
              <Field label="Technician Name"><Input name="technicianName" value={form.technicianName||''} onChange={handleChange}/></Field>
              <Field label="Approval Status"><Select name="approvalStatus" value={form.approvalStatus||'PENDING'} onChange={handleChange}>
                {['PENDING','APPROVED','NOT_APPROVED'].map(v=><option key={v}>{v}</option>)}
              </Select></Field>
              {form.quantity && form.pricePerLitre && (
                <Field label="Total Amount">
                  <div style={{padding:'6px 10px',background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:3,fontSize:13,fontWeight:700,color:'#2e7d32'}}>
                    GH₵{(+form.quantity * +form.pricePerLitre).toFixed(2)}
                  </div>
                </Field>
              )}
            </FormGrid>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal==='add'?'Add Entry':'Save'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
