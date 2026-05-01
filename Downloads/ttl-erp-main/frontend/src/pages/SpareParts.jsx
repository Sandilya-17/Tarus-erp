import React, { useEffect, useState } from 'react';
import { sparePartsAPI, trucksAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Textarea, Section, Badge, StatCard, FormGrid, SearchInput, Tabs, ExcelImportBtn, exportToExcel, downloadExcelTemplate } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY_PART = { partName:'', partCode:'', category:'ENGINE', unit:'NOS', vendor:'', location:'', hsCode:'', vatPercent:'', unitPrice:'', openingStock:'0', reorderLevel:'5' };
const EMPTY_ISSUE = { partId:'', truckNumber:'', quantity:'1', jobCardNumber:'', mechanicName:'', location:'', issuedBy:'', remarks:'' };
const EMPTY_PURCHASE = { partId:'', quantity:'', pricePerUnit:'', supplierName:'', invoiceNumber:'' };

const EXCEL_COLS = [
  { key:'partName', label:'Part Name', required:true, sample:'Engine Oil Filter' },
  { key:'partCode', label:'Part Code', sample:'EOL-001' },
  { key:'category', label:'Category', sample:'ENGINE' },
  { key:'unit', label:'Unit', sample:'NOS' },
  { key:'vendor', label:'Vendor', sample:'Apollo Spares' },
  { key:'location', label:'Storage Location', sample:'Rack A-1' },
  { key:'hsCode', label:'HS Code', sample:'84139100' },
  { key:'vatPercent', label:'VAT %', sample:'18' },
  { key:'unitPrice', label:'Unit Price', sample:'450' },
  { key:'openingStock', label:'Opening Stock', sample:'10' },
  { key:'reorderLevel', label:'Reorder Level', sample:'5' },
];

const CATEGORIES = ['ENGINE','TRANSMISSION','BRAKES','ELECTRICAL','BODY','TYRES','SUSPENSION','COOLING','FUEL SYSTEM','HYDRAULICS','GENERAL'];

export default function SpareParts() {
  const { user, isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin() || hasPermission('MANAGE_SPARE_PARTS');
  const [parts, setParts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [partForm, setPartForm] = useState(EMPTY_PART);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE);
  const [purchaseForm, setPurchaseForm] = useState(EMPTY_PURCHASE);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [tab, setTab] = useState('stock');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([sparePartsAPI.getAll(), sparePartsAPI.getIssues(), sparePartsAPI.getPurchases(), trucksAPI.getNumbers()])
    .then(([p, iss, pur, tr]) => { setParts(p.data); setIssues(iss.data); setPurchases(pur.data); setTrucks(tr.data); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filteredParts = parts.filter(p => {
    const q = search.toLowerCase();
    const mQ = !q || p.partName?.toLowerCase().includes(q) || p.partCode?.toLowerCase().includes(q) || p.vendor?.toLowerCase().includes(q);
    const mC = !catFilter || p.category === catFilter;
    return mQ && mC;
  });

  const handlePartChange = e => setPartForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleIssueChange = e => setIssueForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePurchaseChange = e => setPurchaseForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePartSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...partForm, unitPrice: partForm.unitPrice ? +partForm.unitPrice : null, openingStock: +partForm.openingStock, reorderLevel: +partForm.reorderLevel, vatPercent: partForm.vatPercent ? +partForm.vatPercent : null };
      if (modal === 'addPart') { await sparePartsAPI.add(payload); toast.success('Part added to stock'); }
      else { await sparePartsAPI.update(selected.id, payload); toast.success('Part updated'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data || 'Error'); }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    const selectedPart = parts.find(p => String(p.id) === String(issueForm.partId));
    if (!selectedPart) { toast.error('Please select a part'); return; }
    if ((selectedPart.currentStock || 0) <= 0) { toast.error(`"${selectedPart.partName}" is out of stock — cannot issue`); return; }
    if (+issueForm.quantity > (selectedPart.currentStock || 0)) { toast.error(`Insufficient stock! Available: ${selectedPart.currentStock}, Requested: ${issueForm.quantity}`); return; }
    try {
      await sparePartsAPI.issue({ ...issueForm, quantity: +issueForm.quantity, issuedBy: issueForm.issuedBy || user?.username });
      toast.success('Parts issued successfully'); load(); setModal(null); setIssueForm(EMPTY_ISSUE);
    } catch (err) { toast.error(err.response?.data || 'Error issuing parts'); }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      await sparePartsAPI.purchase({ ...purchaseForm, quantity: +purchaseForm.quantity, pricePerUnit: purchaseForm.pricePerUnit ? +purchaseForm.pricePerUnit : null });
      toast.success('Purchase recorded, stock updated'); load(); setModal(null); setPurchaseForm(EMPTY_PURCHASE);
    } catch (err) { toast.error(err.response?.data || 'Error'); }
  };

  const handlePurchaseEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await sparePartsAPI.updatePurchase(selectedPurchase.id, { ...purchaseForm, quantity: +purchaseForm.quantity, pricePerUnit: purchaseForm.pricePerUnit ? +purchaseForm.pricePerUnit : null });
      toast.success('Purchase updated, stock adjusted'); load(); setModal(null); setPurchaseForm(EMPTY_PURCHASE); setSelectedPurchase(null);
    } catch (err) { toast.error(err.response?.data || 'Error updating purchase'); }
  };

  const handlePurchaseDelete = async (p) => {
    if (!window.confirm(`Delete purchase of "${p.partName}" (Qty: ${p.quantity})?\nThis will reduce stock accordingly.`)) return;
    try {
      await sparePartsAPI.deletePurchase(p.id);
      toast.success('Purchase deleted, stock adjusted'); load();
    } catch (err) { toast.error(err.response?.data || 'Error deleting purchase'); }
  };

  const handleIssueCancel = async (iss) => {
    if (!window.confirm(`Cancel/Delete issue of "${iss.partName}" (Qty: ${iss.quantity})? Stock will be restored.`)) return;
    try {
      if (sparePartsAPI.deleteIssue) {
        await sparePartsAPI.deleteIssue(iss.id);
      } else {
        // Fallback: mark as cancelled if delete not supported
        toast.error('Delete issue API not available');
        return;
      }
      toast.success('Issue cancelled, stock restored'); load();
    } catch (err) { toast.error(err.response?.data || 'Error cancelling issue'); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete part "${p.partName}"?`)) return;
    await sparePartsAPI.delete(p.id); toast.success('Deleted'); load();
  };

  const handleImport = async (rows) => {
    let ok = 0, fail = 0;
    for (const r of rows) {
      try { await sparePartsAPI.add({ ...r, unitPrice: r.unitPrice ? +r.unitPrice : null, openingStock: r.openingStock ? +r.openingStock : 0, reorderLevel: r.reorderLevel ? +r.reorderLevel : 5, vatPercent: r.vatPercent ? +r.vatPercent : null }); ok++; }
      catch { fail++; }
    }
    toast.success(`Imported: ${ok}${fail ? ` (${fail} failed)` : ''}`); load();
  };

  const lowStock = parts.filter(p => (p.currentStock || 0) <= (p.reorderLevel || 0));
  const totalValue = parts.reduce((s, p) => s + ((p.currentStock || 0) * (p.unitPrice || 0)), 0);

  const stockCols = [
    { key: 'partCode', label: 'Code', color: '#1565c0', minWidth: 80 },
    { key: 'partName', label: 'Part Name', minWidth: 140 },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'openingStock', label: 'Opening', align: 'right' },
    { key: 'purchasedStock', label: 'Purchased', align: 'right' },
    { key: 'issuedStock', label: 'Issued', align: 'right' },
    { key: 'currentStock', label: 'Current', align: 'right', render: (v, r) => <span style={{ fontWeight: 700, color: v <= (r.reorderLevel || 0) ? '#c62828' : '#2e7d32' }}>{v ?? 0}</span> },
    { key: 'reorderLevel', label: 'Reorder', align: 'right' },
    { key: 'unitPrice', label: 'Unit Price', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'currentStock', label: 'Status', render: (v, r) => <Badge text={v <= (r.reorderLevel || 0) ? 'LOW STOCK' : 'OK'} type={v <= (r.reorderLevel || 0) ? 'danger' : 'success'} /> },
  ];

  const issueCols = [
    { key: 'partName', label: 'Part', minWidth: 130 },
    { key: 'truckNumber', label: 'Truck' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'totalValue', label: 'Value', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'jobCardNumber', label: 'Job Card' },
    { key: 'mechanicName', label: 'Mechanic' },
    { key: 'issuedBy', label: 'Issued By' },
    { key: 'issuedAt', label: 'Date & Time', render: v => v ? new Date(v).toLocaleDateString('en-GH', { timeZone: 'Africa/Accra' }) : '—' },
  ];

  const purchaseCols = [
    { key: 'partName', label: 'Part', minWidth: 130 },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'pricePerUnit', label: 'Rate', align: 'right', render: v => v ? `GH₵${Number(v).toLocaleString('en-GH')}` : '—' },
    { key: 'supplierName', label: 'Supplier' },
    { key: 'invoiceNumber', label: 'Invoice No.' },
    { key: 'purchaseDate', label: 'Date' },
  ];

  return (
    <div>
      <PageHeader title="SPARE PARTS MANAGEMENT" subtitle={`${parts.length} parts | ${lowStock.length} low stock | Value: GH₵${totalValue.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="Part name/code/vendor..." />,
          <select key="cat" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #90caf9', borderRadius: 3, fontSize: 11, outline: 'none' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>,
          canManage && <Btn key="tmpl" variant="secondary" onClick={() => downloadExcelTemplate(EXCEL_COLS, 'spare_parts')}>📄 Template</Btn>,
          canManage && <ExcelImportBtn key="imp" columns={EXCEL_COLS} onData={handleImport} />,
          <Btn key="exp" variant="teal" onClick={() => exportToExcel(filteredParts, stockCols, 'spare_parts')}>📤 Export</Btn>,
          canManage && <Btn key="add" variant="success" onClick={() => { setPartForm(EMPTY_PART); setModal('addPart'); }}>+ Add Part</Btn>,
        ]}
      />
      <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Total Parts" value={parts.length} icon="🔧" color="#1565c0" />
        <StatCard label="Low Stock" value={lowStock.length} icon="⚠" color="#c62828" />
        <StatCard label="Total Issues" value={issues.length} icon="📤" color="#e65100" />
        <StatCard label="Stock Value" value={`GH₵${totalValue.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="💰" color="#2e7d32" />
      </div>

      <Tabs tabs={[{ key: 'stock', label: `Stock Register (${filteredParts.length})` }, { key: 'issues', label: `Issue Ledger (${issues.length})` }, { key: 'purchases', label: `Purchase Register (${purchases.length})` }]} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 20px' }}>
        {tab === 'stock' && (
          <Section title="Spare Parts Stock Register">
            <KLTable columns={stockCols} data={filteredParts} loading={loading}
              actions={canManage ? row => (
                <div style={{ display: 'flex', gap: 3 }}>
                  <Btn size="xs" variant="warning" onClick={() => { setPurchaseForm({ ...EMPTY_PURCHASE, partId: row.id }); setModal('purchase'); }}>Buy</Btn>
                  <Btn size="xs" variant={row.currentStock > 0 ? "info" : "secondary"} disabled={!row.currentStock || row.currentStock <= 0} onClick={() => { if (!row.currentStock || row.currentStock <= 0) return; setIssueForm({ ...EMPTY_ISSUE, partId: row.id, issuedBy: user?.username }); setModal('issue'); }} title={row.currentStock <= 0 ? 'Out of stock — cannot issue' : 'Issue this part'}>{row.currentStock <= 0 ? 'No Stock' : 'Issue'}</Btn>
                </div>
              ) : null}
              onEdit={canManage ? p => { setPartForm({ ...EMPTY_PART, ...p }); setSelected(p); setModal('editPart'); } : null}
              onDelete={canManage ? handleDelete : null}
            />
          </Section>
        )}
        {tab === 'issues' && (
          <Section title="Issue Ledger" actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {canManage && <Btn size="xs" variant="warning" onClick={() => { setIssueForm({ ...EMPTY_ISSUE, issuedBy: user?.username }); setModal('issue'); }}>📤 Issue Stock</Btn>}
              <Btn size="xs" variant="teal" onClick={() => exportToExcel(issues, issueCols, 'spare_parts_issues')}>📤 Export</Btn>
            </div>
          }>
            <KLTable columns={issueCols} data={issues} loading={loading} onDelete={canManage ? handleIssueCancel : null} />
          </Section>
        )}
        {tab === 'purchases' && (
          <Section title="Purchase Register" actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {canManage && <Btn size="xs" variant="warning" onClick={() => { setPurchaseForm(EMPTY_PURCHASE); setSelectedPurchase(null); setModal('purchase'); }}>🛒 Record Purchase</Btn>}
              <Btn size="xs" variant="teal" onClick={() => exportToExcel(purchases, purchaseCols, 'spare_parts_purchases')}>📤 Export</Btn>
            </div>
          }>
            <KLTable columns={purchaseCols} data={purchases} loading={loading}
              onEdit={canManage ? p => { setSelectedPurchase(p); setPurchaseForm({ partId: p.partId || '', quantity: String(p.quantity || ''), pricePerUnit: String(p.pricePerUnit || ''), supplierName: p.supplierName || '', invoiceNumber: p.invoiceNumber || '' }); setModal('editPurchase'); } : null}
              onDelete={canManage ? handlePurchaseDelete : null}
            />
          </Section>
        )}
      </div>

      {/* Add/Edit Part Modal */}
      {(modal === 'addPart' || modal === 'editPart') && (
        <Modal title={modal === 'addPart' ? 'Add New Part' : 'Edit Part'} onClose={() => setModal(null)} width={700}>
          <form onSubmit={handlePartSubmit}>
            <FormGrid cols={3}>
              <Field label="Part Name" required><Input name="partName" value={partForm.partName} onChange={handlePartChange} required /></Field>
              <Field label="Part Code"><Input name="partCode" value={partForm.partCode} onChange={handlePartChange} /></Field>
              <Field label="Category">
                <Select name="category" value={partForm.category} onChange={handlePartChange}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Unit">
                <Select name="unit" value={partForm.unit} onChange={handlePartChange}>
                  {['NOS', 'SET', 'LITRE', 'KG', 'MTR', 'BOX', 'PKT'].map(u => <option key={u}>{u}</option>)}
                </Select>
              </Field>
              <Field label="Vendor"><Input name="vendor" value={partForm.vendor} onChange={handlePartChange} /></Field>
              <Field label="Storage Location"><Input name="location" value={partForm.location} onChange={handlePartChange} /></Field>
              <Field label="HS Code"><Input name="hsCode" value={partForm.hsCode} onChange={handlePartChange} /></Field>
              <Field label="VAT %"><Input name="vatPercent" type="number" value={partForm.vatPercent} onChange={handlePartChange} /></Field>
              <Field label="Unit Price (GH₵)"><Input name="unitPrice" type="number" step="0.01" value={partForm.unitPrice} onChange={handlePartChange} /></Field>
              <Field label="Opening Stock"><Input name="openingStock" type="number" value={partForm.openingStock} onChange={handlePartChange} /></Field>
              <Field label="Reorder Level"><Input name="reorderLevel" type="number" value={partForm.reorderLevel} onChange={handlePartChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal === 'addPart' ? 'Add Part' : 'Save'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Issue Modal */}
      {modal === 'issue' && (
        <Modal title="Issue Spare Parts" onClose={() => setModal(null)} width={520}>
          <form onSubmit={handleIssueSubmit}>
            <FormGrid cols={2}>
              <Field label="Part" required>
                <Select name="partId" value={issueForm.partId} onChange={handleIssueChange} required>
                  <option value="">Select Part</option>
                  {parts.map(p => <option key={p.id} value={p.id} disabled={!p.currentStock || p.currentStock <= 0}>{p.partName} — Stock: {p.currentStock || 0}{(!p.currentStock || p.currentStock <= 0) ? ' ⛔ OUT OF STOCK' : ''}</option>)}
                </Select>
                {issueForm.partId && (() => { const p = parts.find(x => String(x.id) === String(issueForm.partId)); if (!p) return null; return p.currentStock <= 0 ? <div style={{marginTop:4,padding:'6px 10px',background:'#FEE8E8',border:'1px solid #F5A3A3',borderRadius:5,fontSize:10,color:'#9B1C1C',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>⛔ OUT OF STOCK — Issue not allowed</div> : <div style={{marginTop:4,padding:'6px 10px',background:'#E6F4ED',border:'1px solid #7BC99A',borderRadius:5,fontSize:10,color:'#0D6B35',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>✓ Available Stock: {p.currentStock} {p.unit || 'units'}</div>; })()}
              </Field>
              <Field label="Truck Number">
                <Select name="truckNumber" value={issueForm.truckNumber} onChange={handleIssueChange}>
                  <option value="">Select Truck</option>
                  {trucks.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Quantity" required>
                <Input name="quantity" type="number" min="1"
                  max={issueForm.partId ? (parts.find(p => String(p.id) === String(issueForm.partId))?.currentStock || 1) : undefined}
                  value={issueForm.quantity} onChange={handleIssueChange} required
                  disabled={issueForm.partId && (parts.find(p => String(p.id) === String(issueForm.partId))?.currentStock || 0) <= 0}
                />
              </Field>
              <Field label="Job Card No."><Input name="jobCardNumber" value={issueForm.jobCardNumber} onChange={handleIssueChange} /></Field>
              <Field label="Mechanic Name"><Input name="mechanicName" value={issueForm.mechanicName} onChange={handleIssueChange} /></Field>
              <Field label="Location"><Input name="location" value={issueForm.location} onChange={handleIssueChange} /></Field>
              <Field label="Issued By"><Input name="issuedBy" value={issueForm.issuedBy} onChange={handleIssueChange} /></Field>
              <Field label="Remarks" cols={2}><Input name="remarks" value={issueForm.remarks} onChange={handleIssueChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="warning" disabled={issueForm.partId && (parts.find(p => String(p.id) === String(issueForm.partId))?.currentStock || 0) <= 0}>
                {issueForm.partId && (parts.find(p => String(p.id) === String(issueForm.partId))?.currentStock || 0) <= 0 ? '⛔ Out of Stock' : 'Issue Parts'}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Purchase Modal */}
      {modal === 'purchase' && (
        <Modal title="Record Purchase / Add Stock" onClose={() => setModal(null)} width={520}>
          <form onSubmit={handlePurchaseSubmit}>
            <FormGrid cols={2}>
              <Field label="Part" required>
                <Select name="partId" value={purchaseForm.partId} onChange={handlePurchaseChange} required>
                  <option value="">Select Part</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.partName} (Stock: {p.currentStock || 0})</option>)}
                </Select>
              </Field>
              <Field label="Quantity" required><Input name="quantity" type="number" min="1" value={purchaseForm.quantity} onChange={handlePurchaseChange} required /></Field>
              <Field label="Price Per Unit"><Input name="pricePerUnit" type="number" step="0.01" value={purchaseForm.pricePerUnit} onChange={handlePurchaseChange} /></Field>
              <Field label="Supplier Name"><Input name="supplierName" value={purchaseForm.supplierName} onChange={handlePurchaseChange} /></Field>
              <Field label="Invoice Number" cols={2}><Input name="invoiceNumber" value={purchaseForm.invoiceNumber} onChange={handlePurchaseChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">Add to Stock</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Purchase Modal */}
      {modal === 'editPurchase' && selectedPurchase && (
        <Modal title={`Edit Purchase — ${selectedPurchase.partName}`} onClose={() => { setModal(null); setSelectedPurchase(null); }} width={520}>
          <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 5, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#e65100' }}>
            ⚠ Editing quantity will automatically adjust the part's current stock balance.
          </div>
          <form onSubmit={handlePurchaseEditSubmit}>
            <FormGrid cols={2}>
              <Field label="Part" cols={2}>
                <div style={{ padding: '7px 10px', background: '#f4f6f9', border: '1px solid #dde3ec', borderRadius: 3, fontSize: 13, fontWeight: 600, color: '#37474f' }}>
                  {selectedPurchase.partName}
                </div>
              </Field>
              <Field label="Quantity" required><Input name="quantity" type="number" min="1" value={purchaseForm.quantity} onChange={handlePurchaseChange} required /></Field>
              <Field label="Price Per Unit"><Input name="pricePerUnit" type="number" step="0.01" value={purchaseForm.pricePerUnit} onChange={handlePurchaseChange} /></Field>
              <Field label="Supplier Name"><Input name="supplierName" value={purchaseForm.supplierName} onChange={handlePurchaseChange} /></Field>
              <Field label="Invoice Number" cols={2}><Input name="invoiceNumber" value={purchaseForm.invoiceNumber} onChange={handlePurchaseChange} /></Field>
            </FormGrid>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => { setModal(null); setSelectedPurchase(null); }}>Cancel</Btn>
              <Btn type="submit" variant="success">Save Changes</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
