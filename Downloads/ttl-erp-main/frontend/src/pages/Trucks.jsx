import React, { useEffect, useState } from 'react';
import { trucksAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Textarea, Section, Badge, StatCard, FormGrid, SearchInput, ExcelImportBtn, exportToExcel, downloadExcelTemplate, exportToPDF } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const FONT = "'JetBrains Mono','Fira Code','Consolas',monospace";

const EMPTY = {
  truckNumber:'', vehicleType:'TRUCK', make:'', model:'', year:'', odometer:'',
  owner:'', fuelLimit:'', dvlaExpiry:'', insuranceExpiry:'', fitnessExpiry:'', permitExpiry:'',
  vitQ1:'', vitQ2:'', vitQ3:'', vitQ4:'', active:true,
};

const EXCEL_COLS = [
  { key:'truckNumber', label:'Truck Number', required:true, sample:'GR-1234-24' },
  { key:'vehicleType', label:'Vehicle Type', sample:'TRUCK' },
  { key:'make', label:'Make', sample:'TATA' },
  { key:'model', label:'Model', sample:'LPT 2518' },
  { key:'year', label:'Year', sample:'2020' },
  { key:'odometer', label:'Odometer', sample:'50000' },
  { key:'owner', label:'Owner', sample:'Company Name' },
  { key:'fuelLimit', label:'Fuel Limit (L/month)', sample:'400' },
  { key:'dvlaExpiry', label:'DVLA Expiry (YYYY-MM-DD)', sample:'2025-12-31' },
  { key:'insuranceExpiry', label:'Insurance Expiry (YYYY-MM-DD)', sample:'2025-06-30' },
  { key:'fitnessExpiry', label:'Fitness Expiry (YYYY-MM-DD)', sample:'2025-09-30' },
  { key:'permitExpiry', label:'Permit Expiry (YYYY-MM-DD)', sample:'2025-03-31' },
  { key:'vitQ1', label:'VIT Q1 (YYYY-MM-DD)', sample:'2025-03-31' },
  { key:'vitQ2', label:'VIT Q2 (YYYY-MM-DD)', sample:'2025-06-30' },
  { key:'vitQ3', label:'VIT Q3 (YYYY-MM-DD)', sample:'2025-09-30' },
  { key:'vitQ4', label:'VIT Q4 (YYYY-MM-DD)', sample:'2025-12-31' },
];

function daysLeft(d) { if (!d) return null; return Math.ceil((new Date(d)-new Date())/86400000); }
function expiryBadge(d) {
  const days = daysLeft(d);
  if (days===null) return null;
  if (days<0) return <Badge text={`Exp ${Math.abs(days)}d`} type="danger"/>;
  if (days<=30) return <Badge text={`${days}d left`} type="warning"/>;
  return <Badge text="OK" type="success"/>;
}

export default function Trucks() {
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin() || hasPermission('MANAGE_TRUCKS');
  const [trucks, setTrucks] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => trucksAPI.getAll().then(r=>setTrucks(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = trucks.filter(t =>
    t.truckNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.make?.toLowerCase().includes(search.toLowerCase()) ||
    t.owner?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, year:form.year?+form.year:null, odometer:form.odometer?+form.odometer:null, fuelLimit:form.fuelLimit?+form.fuelLimit:null };
      if (modal==='add') { await trucksAPI.add(payload); toast.success('Truck added'); }
      else { await trucksAPI.update(selected.id, payload); toast.success('Truck updated'); }
      load(); setModal(null);
    } catch(err) { toast.error(err.response?.data?.message || err.response?.data || 'Error saving'); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete truck ${t.truckNumber}?`)) return;
    await trucksAPI.delete(t.id); toast.success('Deleted'); load();
  };

  const handleImport = async (rows) => {
    let ok=0, fail=0;
    for (const row of rows) {
      try {
        await trucksAPI.add({ ...row, year:row.year?+row.year:null, fuelLimit:row.fuelLimit?+row.fuelLimit:null, odometer:row.odometer?+row.odometer:null });
        ok++;
      } catch { fail++; }
    }
    toast.success(`Imported: ${ok} trucks${fail?` (${fail} failed)`:''}`);
    load();
  };

  const cols = [
    { key:'truckNumber', label:'Truck No.', color:'#1565c0', minWidth:100 },
    { key:'vehicleType', label:'Type' },
    { key:'make', label:'Make/Model', render:(_,r)=>`${r.make||''} ${r.model||''}`.trim()||'—' },
    { key:'year', label:'Year' },
    { key:'fuelLimit', label:'Fuel Limit', align:'right', render:v=>v?`${v} L`:'—' },
    { key:'dvlaExpiry', label:'DVLA Expiry', render:v=>v?<><span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span> {expiryBadge(v)}</>:'—' },
    { key:'insuranceExpiry', label:'Insurance', render:v=>v?<><span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span> {expiryBadge(v)}</>:'—' },
    { key:'vitQ1', label:'VIT Q1', render:v=>v?expiryBadge(v):<span style={{color:'#8A9BAD'}}>—</span> },
    { key:'vitQ2', label:'VIT Q2', render:v=>v?expiryBadge(v):<span style={{color:'#8A9BAD'}}>—</span> },
    { key:'vitQ3', label:'VIT Q3', render:v=>v?expiryBadge(v):<span style={{color:'#8A9BAD'}}>—</span> },
    { key:'vitQ4', label:'VIT Q4', render:v=>v?expiryBadge(v):<span style={{color:'#8A9BAD'}}>—</span> },
    { key:'active', label:'Status', render:v=><Badge text={v?'Active':'Inactive'} type={v?'success':'danger'}/> },
  ];

  const active = trucks.filter(t=>t.active!==false).length;
  const expiring = trucks.filter(t=>[t.dvlaExpiry,t.insuranceExpiry,t.fitnessExpiry,t.permitExpiry,t.vitQ1,t.vitQ2,t.vitQ3,t.vitQ4].some(d=>{const n=daysLeft(d);return n!==null&&n>=0&&n<=30;})).length;

  return (
    <div>
      <PageHeader title="FLEET MASTER" subtitle={`${active} Active | ${trucks.length-active} Inactive | Total: ${trucks.length}`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="Search truck/make/owner..."/>,
          canManage && <Btn key="tmpl" variant="secondary" onClick={()=>downloadExcelTemplate(EXCEL_COLS,'trucks')}>📄 Template</Btn>,
          canManage && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport}/>,
          <Btn key="exp" variant="teal" onClick={()=>exportToExcel(filtered,cols,'fleet')}>📤 Excel</Btn>,
          <Btn key="pdf" variant="gold" onClick={()=>exportToPDF(filtered,cols,'Fleet Master Register','fleet')}>📄 PDF</Btn>,
          canManage && <Btn key="add" variant="success" onClick={()=>{setForm(EMPTY);setModal('add');}}>+ Add Truck</Btn>,
        ].filter(Boolean)}
      />
      <div style={{padding:'16px 24px',display:'flex',gap:12,flexWrap:'wrap'}}>
        <StatCard label="Total Fleet" value={trucks.length} icon="🚛" color="#1565c0"/>
        <StatCard label="Active" value={active} icon="✓" color="#2e7d32"/>
        <StatCard label="Inactive" value={trucks.length-active} icon="✗" color="#c62828"/>
        <StatCard label="Expiring Docs (30d)" value={expiring} icon="⚠" color="#e65100"/>
      </div>
      <div style={{padding:'0 24px 24px'}}>
        <Section title={`Fleet Master — ${filtered.length} records`}>
          <KLTable columns={cols} data={filtered} loading={loading}
            onView={t=>{setSelected(t);setModal('view');}}
            onEdit={canManage?t=>{setForm({...EMPTY,...t,year:t.year||'',fuelLimit:t.fuelLimit||'',odometer:t.odometer||'',dvlaExpiry:t.dvlaExpiry||'',insuranceExpiry:t.insuranceExpiry||'',fitnessExpiry:t.fitnessExpiry||'',permitExpiry:t.permitExpiry||'',vitQ1:t.vitQ1||'',vitQ2:t.vitQ2||'',vitQ3:t.vitQ3||'',vitQ4:t.vitQ4||''});setSelected(t);setModal('edit');}:null}
            onDelete={canManage?handleDelete:null}
          />
        </Section>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add Truck':'Edit Truck'} onClose={()=>setModal(null)} width={760}>
          <form onSubmit={handleSubmit}>
            <FormGrid cols={3}>
              <Field label="Truck Number" required><Input name="truckNumber" value={form.truckNumber} onChange={handleChange} required/></Field>
              <Field label="Vehicle Type"><Select name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                {['TRUCK','TRAILER','TANKER','MINI TRUCK','LCV','HCV'].map(v=><option key={v}>{v}</option>)}
              </Select></Field>
              <Field label="Fuel Limit (L/month)"><Input name="fuelLimit" type="number" value={form.fuelLimit} onChange={handleChange}/></Field>
              <Field label="Make"><Input name="make" value={form.make} onChange={handleChange}/></Field>
              <Field label="Model"><Input name="model" value={form.model} onChange={handleChange}/></Field>
              <Field label="Year"><Input name="year" type="number" value={form.year} onChange={handleChange}/></Field>
              <Field label="Odometer (km)"><Input name="odometer" type="number" value={form.odometer} onChange={handleChange}/></Field>
              <Field label="Owner"><Input name="owner" value={form.owner} onChange={handleChange}/></Field>
              <Field label="Status"><Select name="active" value={form.active} onChange={e=>setForm(p=>({...p,active:e.target.value==='true'}))}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </Select></Field>
            </FormGrid>

            <div style={{marginTop:20,padding:'14px 16px',background:'#EBF4FF',border:'1px solid #BFD0E8',borderRadius:8}}>
              <div style={{fontWeight:700,fontSize:9.5,color:'#0B1F3A',textTransform:'uppercase',letterSpacing:1.5,fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>📋 Document Expiries</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px 16px'}}>
                <Field label="DVLA Expiry"><Input name="dvlaExpiry" type="date" value={form.dvlaExpiry} onChange={handleChange}/></Field>
                <Field label="Insurance Expiry"><Input name="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={handleChange}/></Field>
                <Field label="Fitness Expiry"><Input name="fitnessExpiry" type="date" value={form.fitnessExpiry} onChange={handleChange}/></Field>
                <Field label="Permit Expiry"><Input name="permitExpiry" type="date" value={form.permitExpiry} onChange={handleChange}/></Field>
              </div>
            </div>

            <div style={{marginTop:14,padding:'14px 16px',background:'#FDF4E3',border:'1px solid #E8C872',borderRadius:8}}>
              <div style={{fontWeight:700,fontSize:9.5,color:'#8B5E00',textTransform:'uppercase',letterSpacing:1.5,fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>🏷️ VIT — Vehicle Income Tax (Quarterly)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px 16px'}}>
                <Field label="Q1 (Jan–Mar)"><Input name="vitQ1" type="date" value={form.vitQ1} onChange={handleChange}/></Field>
                <Field label="Q2 (Apr–Jun)"><Input name="vitQ2" type="date" value={form.vitQ2} onChange={handleChange}/></Field>
                <Field label="Q3 (Jul–Sep)"><Input name="vitQ3" type="date" value={form.vitQ3} onChange={handleChange}/></Field>
                <Field label="Q4 (Oct–Dec)"><Input name="vitQ4" type="date" value={form.vitQ4} onChange={handleChange}/></Field>
              </div>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
              <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal==='add'?'Add Truck':'Save Changes'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal==='view' && selected && (
        <Modal title={`Truck — ${selected.truckNumber}`} onClose={()=>setModal(null)} width={640}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px',fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>
            {[['Truck Number',selected.truckNumber],['Type',selected.vehicleType],['Make',selected.make],['Model',selected.model],
              ['Year',selected.year],['Odometer',selected.odometer?selected.odometer+' km':'—'],['Owner',selected.owner],
              ['Fuel Limit',selected.fuelLimit?selected.fuelLimit+' L':'—'],
              ['DVLA Expiry',selected.dvlaExpiry||'—'],['Insurance',selected.insuranceExpiry||'—'],
              ['Fitness',selected.fitnessExpiry||'—'],['Permit',selected.permitExpiry||'—'],
            ].map(([k,v])=>(
              <div key={k}><div style={{color:'#607d8b',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>{k}</div><div style={{fontWeight:600,marginTop:2}}>{v||'—'}</div></div>
            ))}
          </div>
          <div style={{marginTop:16,padding:'12px 14px',background:'#FDF4E3',border:'1px solid #E8C872',borderRadius:8}}>
            <div style={{fontWeight:700,fontSize:9.5,color:'#8B5E00',textTransform:'uppercase',letterSpacing:1,fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>VIT Quarters</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[['Q1',selected.vitQ1],['Q2',selected.vitQ2],['Q3',selected.vitQ3],['Q4',selected.vitQ4]].map(([q,v])=>(
                <div key={q} style={{textAlign:'center'}}>
                  <div style={{fontSize:9,fontWeight:700,color:'#8B5E00',marginBottom:4}}>{q}</div>
                  {v?<>{expiryBadge(v)}<div style={{fontSize:9.5,marginTop:4}}>{v}</div></>:<span style={{color:'#8A9BAD',fontSize:10}}>—</span>}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
