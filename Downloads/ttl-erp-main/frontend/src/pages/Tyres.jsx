import React, { useEffect, useState } from 'react';
import { tyresAPI, trucksAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Section, Badge, StatCard, FormGrid, SearchInput, Tabs, ExcelImportBtn, exportToExcel, downloadExcelTemplate } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY_TYRE = { tyreName:'', tyreCode:'', brand:'', size:'', type:'RADIAL', vendor:'', unitPrice:'', openingStock:'0', reorderLevel:'4' };
const EMPTY_ISSUE = { tyreId:'', truckNumber:'', quantity:'1', position:'', location:'', issuedBy:'', remarks:'' };

const EXCEL_COLS = [
  { key:'tyreName', label:'Tyre Name', required:true, sample:'MRF ZTR 10.00 R20' },
  { key:'tyreCode', label:'Tyre Code', sample:'MRF-ZTR-1000' },
  { key:'brand', label:'Brand', sample:'MRF' },
  { key:'size', label:'Size', sample:'10.00 R20' },
  { key:'type', label:'Type', sample:'RADIAL' },
  { key:'vendor', label:'Vendor', sample:'MRF Dealer' },
  { key:'unitPrice', label:'Unit Price', sample:'18500' },
  { key:'openingStock', label:'Opening Stock', sample:'10' },
  { key:'reorderLevel', label:'Reorder Level', sample:'4' },
];

export default function Tyres() {
  const { user, isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin() || hasPermission('MANAGE_TYRES');
  const [tyres, setTyres] = useState([]);
  const [issues, setIssues] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tyreForm, setTyreForm] = useState(EMPTY_TYRE);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE);
  const [purchaseData, setPurchaseData] = useState({ tyreId:'', quantity:'' });
  const [tab, setTab] = useState('stock');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [swapForm, setSwapForm] = useState({ tyreId:'', fromTruck:'', toTruck:'', quantity:'1', position:'', remarks:'' });
  const now = new Date();
  const [issueFilterMonth, setIssueFilterMonth] = useState(now.getMonth()+1);
  const [issueFilterYear, setIssueFilterYear] = useState(now.getFullYear());

  const load = () => Promise.all([tyresAPI.getAll(), tyresAPI.getIssues(), trucksAPI.getNumbers()])
    .then(([t, iss, tr]) => { setTyres(t.data); setIssues(iss.data); setTrucks(tr.data); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = tyres.filter(t => {
    const q = search.toLowerCase();
    return !q || t.tyreName?.toLowerCase().includes(q) || t.brand?.toLowerCase().includes(q) || t.size?.toLowerCase().includes(q);
  });

  const handleTyreChange = e => setTyreForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleIssueChange = e => setIssueForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleTyreSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...tyreForm, unitPrice: tyreForm.unitPrice ? +tyreForm.unitPrice : null, openingStock: +tyreForm.openingStock, reorderLevel: +tyreForm.reorderLevel };
      if (modal === 'addTyre') { await tyresAPI.add(payload); toast.success('Tyre added'); }
      else { await tyresAPI.update(selected.id, payload); toast.success('Updated'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    const selectedTyre = tyres.find(t => String(t.id) === String(issueForm.tyreId));
    if (!selectedTyre) { toast.error('Please select a tyre'); return; }
    if ((selectedTyre.currentStock || 0) <= 0) { toast.error(`"${selectedTyre.tyreName}" is out of stock — cannot issue`); return; }
    if (+issueForm.quantity > (selectedTyre.currentStock || 0)) { toast.error(`Insufficient stock! Available: ${selectedTyre.currentStock}, Requested: ${issueForm.quantity}`); return; }
    try {
      await tyresAPI.issue({ ...issueForm, quantity: +issueForm.quantity, issuedBy: issueForm.issuedBy || user?.username });
      toast.success('Tyres issued'); load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Insufficient stock or error'); }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      await tyresAPI.purchase({ tyreId: purchaseData.tyreId, quantity: +purchaseData.quantity });
      toast.success('Purchase recorded, stock updated'); load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete tyre "${t.tyreName}"?`)) return;
    await tyresAPI.delete(t.id); toast.success('Deleted'); load();
  };

  const handleIssueEdit = (issue) => {
    setSelectedIssue(issue);
    setIssueForm({ tyreId: issue.tyreId || '', truckNumber: issue.truckNumber || '', quantity: String(issue.quantity || 1), position: issue.position || '', location: issue.location || '', issuedBy: issue.issuedBy || '', remarks: issue.remarks || '' });
    setModal('editIssue');
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    try {
      await tyresAPI.swapTyre({ ...swapForm, quantity: +swapForm.quantity });
      toast.success(`Tyre swapped from ${swapForm.fromTruck} to ${swapForm.toTruck}`);
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Swap failed — ensure stock exists on source truck'); }
  };

  const handleIssueEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await tyresAPI.updateIssue(selectedIssue.id, { ...issueForm, quantity: +issueForm.quantity, issuedDate: selectedIssue.issuedDate });
      toast.success('Issue updated'); load(); setModal(null);
    } catch(err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleIssueDelete = async (issue) => {
    if (!window.confirm(`Delete issue of "${issue.tyreName}" for truck ${issue.truckNumber || '—'}? Stock will be returned.`)) return;
    try {
      await tyresAPI.deleteIssue(issue.id);
      toast.success('Issue deleted, stock returned'); load();
    } catch(err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleImport = async (rows) => {
    let ok = 0, fail = 0;
    for (const r of rows) {
      try { await tyresAPI.add({ ...r, unitPrice: r.unitPrice ? +r.unitPrice : null, openingStock: r.openingStock ? +r.openingStock : 0, reorderLevel: r.reorderLevel ? +r.reorderLevel : 4 }); ok++; }
      catch { fail++; }
    }
    toast.success(`Imported: ${ok}${fail ? ` (${fail} failed)` : ''}`); load();
  };

  const lowStock = tyres.filter(t => (t.currentStock || 0) <= (t.reorderLevel || 0));

  const stockCols = [
    { key: 'tyreCode', label: 'Code', color: '#1565c0', minWidth: 80 },
    { key: 'tyreName', label: 'Tyre Name', minWidth: 140 },
    { key: 'brand', label: 'Brand' },
    { key: 'size', label: 'Size' },
    { key: 'type', label: 'Type' },
    { key: 'openingStock', label: 'Opening', align: 'right' },
    { key: 'purchased', label: 'Purchased', align: 'right' },
    { key: 'issued', label: 'Issued', align: 'right' },
    { key: 'currentStock', label: 'Current', align: 'right', render: (v, r) => <span style={{ fontWeight: 700, color: v <= (r.reorderLevel || 0) ? '#c62828' : '#2e7d32' }}>{v ?? 0}</span> },
    { key: 'unitPrice', label: 'Price', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'currentStock', label: 'Status', render: (v, r) => <Badge text={v <= (r.reorderLevel || 0) ? 'LOW' : 'OK'} type={v <= (r.reorderLevel || 0) ? 'danger' : 'success'} /> },
  ];

  const issueMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const filteredIssues = issues.filter(iss => {
    const d = iss.issuedDate || '';
    if (!d) return true;
    const [y, m] = d.split('-').map(Number);
    return (!issueFilterMonth || m === issueFilterMonth) && (!issueFilterYear || y === issueFilterYear);
  });

  const issueCols = [
    { key: 'tyreName', label: 'Tyre', minWidth: 130 },
    { key: 'truckNumber', label: 'Truck' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'position', label: 'Position' },
    { key: 'issuedBy', label: 'Issued By' },
    { key: 'issuedDate', label: 'Date' },
    { key: 'remarks', label: 'Remarks' },
  ];

  return (
    <div>
      <PageHeader title="TYRE STOCK MANAGEMENT" subtitle={`${tyres.length} tyre types | ${lowStock.length} low stock`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="Tyre name/brand/size..." />,
          canManage && <Btn key="tmpl" variant="secondary" onClick={() => downloadExcelTemplate(EXCEL_COLS, 'tyres')}>📄 Template</Btn>,
          canManage && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport} />,
          <Btn key="exp" variant="teal" onClick={() => exportToExcel(filtered, stockCols, 'tyres')}>📤 Export</Btn>,
          canManage && <Btn key="swap" variant="purple" onClick={() => { setSwapForm({ tyreId:'', fromTruck:'', toTruck:'', quantity:'1', position:'', remarks:'' }); setModal('swap'); }}>🔄 Swap Tyre</Btn>,
          canManage && <Btn key="add" variant="success" onClick={() => { setTyreForm(EMPTY_TYRE); setModal('addTyre'); }}>+ Add Tyre</Btn>,
        ]}
      />
      <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Tyre Types" value={tyres.length} icon="⚙️" color="#1565c0" />
        <StatCard label="Low Stock" value={lowStock.length} icon="⚠" color="#c62828" />
        <StatCard label="Total Issues" value={issues.length} icon="📤" color="#e65100" />
        <StatCard label="Total Stock" value={tyres.reduce((s, t) => s + (t.currentStock || 0), 0)} icon="📦" color="#2e7d32" />
      </div>

      <Tabs tabs={[{ key: 'stock', label: `Tyre Stock (${filtered.length})` }, { key: 'issues', label: `Issue Ledger (${filteredIssues.length})` }]} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 20px' }}>
        {tab === 'stock' && (
          <Section title="Tyre Stock Register">
            <KLTable columns={stockCols} data={filtered} loading={loading}
              actions={canManage ? row => (
                <div style={{ display: 'flex', gap: 3 }}>
                  <Btn size="xs" variant="warning" onClick={() => { setPurchaseData({ tyreId: row.id, quantity: '' }); setModal('purchase'); }}>Buy</Btn>
                  <Btn size="xs" variant={row.currentStock > 0 ? "info" : "secondary"} disabled={!row.currentStock || row.currentStock <= 0} onClick={() => { if (!row.currentStock || row.currentStock <= 0) return; setIssueForm({ ...EMPTY_ISSUE, tyreId: row.id, issuedBy: user?.username }); setModal('issue'); }} title={row.currentStock <= 0 ? 'Out of stock — cannot issue' : 'Issue this tyre'}>{row.currentStock <= 0 ? 'No Stock' : 'Issue'}</Btn>
                </div>
              ) : null}
              onEdit={canManage ? t => { setTyreForm({ ...EMPTY_TYRE, ...t }); setSelected(t); setModal('editTyre'); } : null}
              onDelete={canManage ? handleDelete : null}
            />
          </Section>
        )}
        {tab === 'issues' && (
          <>
            <div style={{background:'#fff',borderBottom:'1px solid #dde3ec',padding:'8px 20px',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{color:'#607d8b',fontSize:11,fontWeight:700}}>FILTER:</span>
              <select value={issueFilterMonth} onChange={e=>setIssueFilterMonth(+e.target.value)} style={{padding:'4px 8px',border:'1px solid #dde3ec',borderRadius:3,fontSize:12,outline:'none'}}>
                <option value="">All Months</option>
                {issueMonths.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={issueFilterYear} onChange={e=>setIssueFilterYear(+e.target.value)} style={{padding:'4px 8px',border:'1px solid #dde3ec',borderRadius:3,fontSize:12,outline:'none'}}>
                {[2023,2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <Section title={`Tyre Issue Ledger — ${issueFilterMonth ? issueMonths[issueFilterMonth-1]+' ' : ''}${issueFilterYear}`} actions={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {canManage && <Btn size="xs" variant="warning" onClick={() => { setIssueForm({ ...EMPTY_ISSUE, issuedBy: user?.username }); setModal('issue'); }}>🚗 Issue Tyres</Btn>}
                <Btn size="xs" variant="teal" onClick={() => exportToExcel(filteredIssues, issueCols, 'tyre_issues')}>📤 Export</Btn>
              </div>
            }>
              <KLTable columns={issueCols} data={filteredIssues} loading={loading}
                onEdit={canManage ? handleIssueEdit : null}
                onDelete={canManage ? handleIssueDelete : null}
              />
            </Section>
          </>
        )}
      </div>

      {(modal === 'addTyre' || modal === 'editTyre') && (
        <Modal title={modal === 'addTyre' ? 'Add Tyre' : 'Edit Tyre'} onClose={() => setModal(null)} width={640}>
          <form onSubmit={handleTyreSubmit}>
            <FormGrid cols={3}>
              <Field label="Tyre Name" required><Input name="tyreName" value={tyreForm.tyreName} onChange={handleTyreChange} required /></Field>
              <Field label="Tyre Code"><Input name="tyreCode" value={tyreForm.tyreCode} onChange={handleTyreChange} /></Field>
              <Field label="Brand"><Input name="brand" value={tyreForm.brand} onChange={handleTyreChange} /></Field>
              <Field label="Size"><Input name="size" value={tyreForm.size} onChange={handleTyreChange} /></Field>
              <Field label="Type">
                <Select name="type" value={tyreForm.type} onChange={handleTyreChange}>
                  {['RADIAL', 'BIAS', 'TUBELESS', 'TUBE TYPE'].map(v => <option key={v}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Vendor"><Input name="vendor" value={tyreForm.vendor} onChange={handleTyreChange} /></Field>
              <Field label="Unit Price (GH₵)"><Input name="unitPrice" type="number" step="0.01" value={tyreForm.unitPrice} onChange={handleTyreChange} /></Field>
              <Field label="Opening Stock"><Input name="openingStock" type="number" value={tyreForm.openingStock} onChange={handleTyreChange} /></Field>
              <Field label="Reorder Level"><Input name="reorderLevel" type="number" value={tyreForm.reorderLevel} onChange={handleTyreChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal === 'addTyre' ? 'Add Tyre' : 'Save'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'issue' && (
        <Modal title="Issue Tyres" onClose={() => setModal(null)} width={480}>
          <form onSubmit={handleIssueSubmit}>
            <FormGrid cols={2}>
              <Field label="Tyre" required>
                <Select name="tyreId" value={issueForm.tyreId} onChange={handleIssueChange} required>
                  <option value="">Select Tyre</option>
                  {tyres.map(t => <option key={t.id} value={t.id} disabled={!t.currentStock || t.currentStock <= 0}>{t.tyreName} — Stock: {t.currentStock || 0}{(!t.currentStock || t.currentStock <= 0) ? ' ⛔ OUT OF STOCK' : ''}</option>)}
                </Select>
                {issueForm.tyreId && (() => { const t = tyres.find(x => String(x.id) === String(issueForm.tyreId)); if (!t) return null; return t.currentStock <= 0 ? <div style={{marginTop:4,padding:'6px 10px',background:'#FEE8E8',border:'1px solid #F5A3A3',borderRadius:5,fontSize:10,color:'#9B1C1C',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>⛔ OUT OF STOCK — Issue not allowed</div> : <div style={{marginTop:4,padding:'6px 10px',background:'#E6F4ED',border:'1px solid #7BC99A',borderRadius:5,fontSize:10,color:'#0D6B35',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>✓ Available: {t.currentStock} tyres</div>; })()}
              </Field>
              <Field label="Truck">
                <Select name="truckNumber" value={issueForm.truckNumber} onChange={handleIssueChange}>
                  <option value="">Select Truck</option>
                  {trucks.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Quantity" required>
                <Input name="quantity" type="number" min="1"
                  max={issueForm.tyreId ? (tyres.find(t => String(t.id) === String(issueForm.tyreId))?.currentStock || 1) : undefined}
                  value={issueForm.quantity} onChange={handleIssueChange} required
                  disabled={issueForm.tyreId && (tyres.find(t => String(t.id) === String(issueForm.tyreId))?.currentStock || 0) <= 0}
                />
              </Field>
              <Field label="Position">
                <Select name="position" value={issueForm.position} onChange={handleIssueChange}>
                  <option value="">Select</option>
                  {['FRONT LEFT','FRONT RIGHT','REAR LEFT INNER','REAR LEFT OUTER','REAR RIGHT INNER','REAR RIGHT OUTER','SPARE'].map(p => <option key={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Location"><Input name="location" value={issueForm.location} onChange={handleIssueChange} /></Field>
              <Field label="Issued By"><Input name="issuedBy" value={issueForm.issuedBy} onChange={handleIssueChange} /></Field>
              <Field label="Remarks" cols={2}><Input name="remarks" value={issueForm.remarks} onChange={handleIssueChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="warning" disabled={issueForm.tyreId && (tyres.find(t => String(t.id) === String(issueForm.tyreId))?.currentStock || 0) <= 0}>
                {issueForm.tyreId && (tyres.find(t => String(t.id) === String(issueForm.tyreId))?.currentStock || 0) <= 0 ? '⛔ Out of Stock' : 'Issue Tyres'}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'editIssue' && (
        <Modal title="Edit Tyre Issue" onClose={() => setModal(null)} width={480}>
          <form onSubmit={handleIssueEditSubmit}>
            <FormGrid cols={2}>
              <Field label="Tyre" required>
                <Select name="tyreId" value={issueForm.tyreId} onChange={handleIssueChange} required>
                  <option value="">Select Tyre</option>
                  {tyres.map(t => <option key={t.id} value={t.id}>{t.tyreName}</option>)}
                </Select>
              </Field>
              <Field label="Truck">
                <Select name="truckNumber" value={issueForm.truckNumber} onChange={handleIssueChange}>
                  <option value="">Select Truck</option>
                  {trucks.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Quantity" required>
                <Input name="quantity" type="number" min="1"
                  max={issueForm.tyreId ? (tyres.find(t => String(t.id) === String(issueForm.tyreId))?.currentStock || 1) : undefined}
                  value={issueForm.quantity} onChange={handleIssueChange} required
                  disabled={issueForm.tyreId && (tyres.find(t => String(t.id) === String(issueForm.tyreId))?.currentStock || 0) <= 0}
                />
              </Field>
              <Field label="Position">
                <Select name="position" value={issueForm.position} onChange={handleIssueChange}>
                  <option value="">Select</option>
                  {['FRONT LEFT','FRONT RIGHT','REAR LEFT INNER','REAR LEFT OUTER','REAR RIGHT INNER','REAR RIGHT OUTER','SPARE'].map(p => <option key={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Location"><Input name="location" value={issueForm.location} onChange={handleIssueChange} /></Field>
              <Field label="Issued By"><Input name="issuedBy" value={issueForm.issuedBy} onChange={handleIssueChange} /></Field>
              <Field label="Remarks" cols={2}><Input name="remarks" value={issueForm.remarks} onChange={handleIssueChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="warning">Save Changes</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'swap' && (
        <Modal title="🔄 Swap Tyre Between Trucks" onClose={() => setModal(null)} width={520}>
          <div style={{ background: '#EBF4FF', border: '1px solid #BFD0E8', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: '#1a3a5c', fontFamily: "'JetBrains Mono',monospace" }}>
            ℹ️ This will record a tyre transfer from one truck to another (issue from source, log on destination).
          </div>
          <form onSubmit={handleSwapSubmit}>
            <FormGrid cols={2}>
              <Field label="Tyre" required>
                <Select value={swapForm.tyreId} onChange={e => setSwapForm(p => ({ ...p, tyreId: e.target.value }))} required>
                  <option value="">Select Tyre</option>
                  {tyres.map(t => <option key={t.id} value={t.id}>{t.tyreName} ({t.brand})</option>)}
                </Select>
              </Field>
              <Field label="Quantity" required><Input type="number" min="1" value={swapForm.quantity} onChange={e => setSwapForm(p => ({ ...p, quantity: e.target.value }))} required /></Field>
              <Field label="From Truck" required>
                <Select value={swapForm.fromTruck} onChange={e => setSwapForm(p => ({ ...p, fromTruck: e.target.value }))} required>
                  <option value="">Select Source Truck</option>
                  {trucks.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="To Truck" required>
                <Select value={swapForm.toTruck} onChange={e => setSwapForm(p => ({ ...p, toTruck: e.target.value }))} required>
                  <option value="">Select Destination Truck</option>
                  {trucks.filter(t => t !== swapForm.fromTruck).map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Position">
                <Select value={swapForm.position} onChange={e => setSwapForm(p => ({ ...p, position: e.target.value }))}>
                  <option value="">Select Position</option>
                  {['FRONT LEFT','FRONT RIGHT','REAR LEFT INNER','REAR LEFT OUTER','REAR RIGHT INNER','REAR RIGHT OUTER','SPARE'].map(pos => <option key={pos}>{pos}</option>)}
                </Select>
              </Field>
              <Field label="Remarks"><Input value={swapForm.remarks} onChange={e => setSwapForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Reason for swap..."/></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="purple">🔄 Confirm Swap</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'purchase' && (
        <Modal title="Record Tyre Purchase" onClose={() => setModal(null)} width={400}>
          <form onSubmit={handlePurchaseSubmit}>
            <FormGrid cols={1}>
              <Field label="Tyre" required>
                <Select value={purchaseData.tyreId} onChange={e => setPurchaseData(p => ({ ...p, tyreId: e.target.value }))} required>
                  <option value="">Select Tyre</option>
                  {tyres.map(t => <option key={t.id} value={t.id}>{t.tyreName} (Stock: {t.currentStock || 0})</option>)}
                </Select>
              </Field>
              <Field label="Quantity" required><Input type="number" min="1" value={purchaseData.quantity} onChange={e => setPurchaseData(p => ({ ...p, quantity: e.target.value }))} required /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">Add to Stock</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
