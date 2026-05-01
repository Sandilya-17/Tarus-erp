import React, { useState, useEffect } from 'react';
import { driversAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Textarea, Section, Badge, StatCard, FormGrid, SearchInput, ExcelImportBtn, exportToExcel, downloadExcelTemplate } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name:'', phone:'', alternatePhone:'', licenseNumber:'', licenseExpiry:'', address:'', dateOfJoining:'', salary:'', status:'ACTIVE', bloodGroup:'', ghanaCardNumber:'', assignedTruck:'', remarks:'' };
const STATUS_COLORS = { ACTIVE:'success', ON_LEAVE:'warning', TERMINATED:'danger', INACTIVE:'default' };

const EXCEL_COLS = [
  { key:'name', label:'Full Name', required:true, sample:'Ravi Kumar' },
  { key:'phone', label:'Phone', sample:'9876543210' },
  { key:'licenseNumber', label:'License Number', sample:'MH0120230001234' },
  { key:'licenseExpiry', label:'License Expiry (YYYY-MM-DD)', sample:'2028-06-30' },
  { key:'dateOfJoining', label:'Date of Joining (YYYY-MM-DD)', sample:'2022-01-01' },
  { key:'salary', label:'Salary', sample:'18000' },
  { key:'status', label:'Status', sample:'ACTIVE' },
  { key:'bloodGroup', label:'Blood Group', sample:'B+' },
  { key:'assignedTruck', label:'Assigned Truck', sample:'MH01AB1234' },
  { key:'address', label:'Address', sample:'Mumbai' },
];

export default function Drivers() {
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin() || hasPermission('MANAGE_DRIVERS');
  const [drivers, setDrivers] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => driversAPI.getAll().then(r=>setDrivers(r.data)).catch(()=>setDrivers([])).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name?.toLowerCase().includes(q) || d.phone?.includes(q) || d.licenseNumber?.toLowerCase().includes(q) || d.assignedTruck?.toLowerCase().includes(q);
  });

  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, salary:form.salary?+form.salary:0 };
      if (modal==='add') { await driversAPI.add(payload); toast.success('Driver added'); }
      else { await driversAPI.update(selected.id, payload); toast.success('Driver updated'); }
      load(); setModal(null);
    } catch(err) { toast.error(err.response?.data || 'Error saving'); }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete driver ${d.name}?`)) return;
    await driversAPI.delete(d.id); toast.success('Deleted'); load();
  };

  const handleImport = async (rows) => {
    let ok=0, fail=0;
    for (const r of rows) { try { await driversAPI.add({...r,salary:r.salary?+r.salary:0}); ok++; } catch { fail++; } }
    toast.success(`Imported: ${ok}${fail?` (${fail} failed)`:''}`); load();
  };

  const cols = [
    { key:'name', label:'Name', color:'#1565c0', minWidth:120 },
    { key:'phone', label:'Phone' },
    { key:'licenseNumber', label:'License No.' },
    { key:'licenseExpiry', label:'License Expiry', render:v => {
      if (!v) return '—';
      const days = Math.ceil((new Date(v)-new Date())/86400000);
      return <><span style={{fontSize:11}}>{v}</span> <Badge text={days<0?`Expired`:days<=30?`${days}d`:'OK'} type={days<0?'danger':days<=30?'warning':'success'}/></>;
    }},
    { key:'assignedTruck', label:'Truck' },
    { key:'salary', label:'Salary', align:'right', render:v=>v?`GH₵${Number(v).toLocaleString('en-GH')}`:'—' },
    { key:'status', label:'Status', render:v=><Badge text={v} type={STATUS_COLORS[v]||'default'}/> },
  ];

  const active = drivers.filter(d=>d.status==='ACTIVE').length;
  const payroll = drivers.filter(d=>d.status==='ACTIVE').reduce((s,d)=>s+(d.salary||0),0);

  return (
    <div>
      <PageHeader title="DRIVER MANAGEMENT" subtitle={`Total: ${drivers.length} | Active: ${active}`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="Name/Phone/License/Truck..."/>,
          canManage && <Btn key="tmpl" variant="secondary" onClick={()=>downloadExcelTemplate(EXCEL_COLS,'drivers')}>📄 Template</Btn>,
          canManage && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport}/>,
          <Btn key="exp" variant="teal" onClick={()=>exportToExcel(filtered,cols,'drivers')}>📤 Export</Btn>,
          canManage && <Btn key="add" variant="success" onClick={()=>{setForm({...EMPTY,dateOfJoining:new Date().toISOString().split('T')[0]});setModal('add');}}>+ Add Driver</Btn>,
        ].filter(Boolean)}
      />
      <div style={{padding:'12px 20px',display:'flex',gap:10,flexWrap:'wrap'}}>
        <StatCard label="Total Drivers" value={drivers.length} icon="👤" color="#1565c0"/>
        <StatCard label="Active" value={active} icon="✓" color="#2e7d32"/>
        <StatCard label="On Leave" value={drivers.filter(d=>d.status==='ON_LEAVE').length} icon="🏖" color="#e65100"/>
        <StatCard label="Monthly Payroll" value={`GH₵${payroll.toLocaleString('en-GH')}`} icon="💰" color="#6a1b9a"/>
      </div>
      <div style={{padding:'0 20px 20px'}}>
        <Section title={`Drivers — ${filtered.length} records`}>
          <KLTable columns={cols} data={filtered} loading={loading}
            onView={d=>{setSelected(d);setModal('view');}}
            onEdit={canManage?t=>{setForm({...EMPTY,...t});setSelected(t);setModal('edit');}:null}
            onDelete={canManage?handleDelete:null}
          />
        </Section>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add Driver':'Edit Driver'} onClose={()=>setModal(null)} width={700}>
          <form onSubmit={handleSubmit}>
            <FormGrid cols={3}>
              <Field label="Full Name" required><Input name="name" value={form.name} onChange={handleChange} required/></Field>
              <Field label="Phone"><Input name="phone" value={form.phone} onChange={handleChange}/></Field>
              <Field label="Alternate Phone"><Input name="alternatePhone" value={form.alternatePhone} onChange={handleChange}/></Field>
              <Field label="License Number"><Input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}/></Field>
              <Field label="License Expiry"><Input name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange}/></Field>
              <Field label="Blood Group"><Select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v=><option key={v}>{v}</option>)}
              </Select></Field>
              <Field label="Date of Joining"><Input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange}/></Field>
              <Field label="Salary (GH₵)"><Input name="salary" type="number" value={form.salary} onChange={handleChange}/></Field>
              <Field label="Assigned Truck"><Input name="assignedTruck" value={form.assignedTruck} onChange={handleChange}/></Field>
              <Field label="Status"><Select name="status" value={form.status} onChange={handleChange}>
                {['ACTIVE','ON_LEAVE','INACTIVE','TERMINATED'].map(v=><option key={v}>{v}</option>)}
              </Select></Field>
              <Field label="Ghana Card Number"><Input name="ghanaCardNumber" value={form.ghanaCardNumber} onChange={handleChange}/></Field>
              <Field label="Address" cols={3}><Input name="address" value={form.address} onChange={handleChange}/></Field>
              <Field label="Remarks" cols={3}><Input name="remarks" value={form.remarks} onChange={handleChange}/></Field>
            </FormGrid>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal==='add'?'Add Driver':'Save Changes'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
