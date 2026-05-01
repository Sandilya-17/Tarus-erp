import React, { useEffect, useState } from 'react';
import { tripsAPI, fuelAPI, trucksAPI, sparePartsAPI, tyresAPI, maintenanceAPI } from '../api/api';
import { PageHeader, Btn, Section, StatCard, Tabs, Badge, C, exportToExcel } from '../components/UI';
const FONT = "'Segoe UI','Roboto',system-ui,sans-serif";
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [tab, setTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [parts, setParts] = useState([]);
  const [tyres, setTyres] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tripsAPI.getAll().catch(() => ({ data: [] })),
      fuelAPI.getAll().catch(() => ({ data: [] })),
      trucksAPI.getAll().catch(() => ({ data: [] })),
      sparePartsAPI.getAll().catch(() => ({ data: [] })),
      tyresAPI.getAll().catch(() => ({ data: [] })),
      maintenanceAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([t, f, tr, p, ty, m]) => {
      setTrips(t.data); setFuelEntries(f.data); setTrucks(tr.data);
      setParts(p.data); setTyres(ty.data); setMaintenance(m.data);
    }).finally(() => setLoading(false));
  }, []);

  const filteredFuel = fuelEntries.filter(f => f.month === +filterMonth && f.year === +filterYear);
  const filteredMaint = maintenance.filter(m => {
    if (!m.serviceDate) return false;
    const d = new Date(m.serviceDate);
    return d.getMonth() + 1 === +filterMonth && d.getFullYear() === +filterYear;
  });
  const filteredTrips = trips.filter(t => {
    if (!t.startDate) return false;
    const d = new Date(t.startDate);
    return d.getMonth() + 1 === +filterMonth && d.getFullYear() === +filterYear;
  });

  // Aggregates
  const freightTotal = filteredTrips.reduce((s, t) => s + (t.freight || 0), 0);
  const fuelCostTotal = filteredFuel.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const maintCostTotal = filteredMaint.reduce((s, m) => s + (m.cost || 0), 0);
  const lowStock = parts.filter(p => (p.currentStock || 0) <= (p.reorderLevel || 0));

  // Per-truck fuel summary
  const truckFuelMap = {};
  filteredFuel.forEach(f => {
    if (!truckFuelMap[f.truckNumber]) truckFuelMap[f.truckNumber] = { qty: 0, cost: 0 };
    truckFuelMap[f.truckNumber].qty += (f.quantity || 0);
    truckFuelMap[f.truckNumber].cost += (f.totalAmount || 0);
  });
  const truckFuelData = Object.entries(truckFuelMap).map(([truck, d]) => ({ truck, ...d })).sort((a, b) => b.cost - a.cost);

  // Trip status breakdown
  const statusCounts = {};
  filteredTrips.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const tripCols = [
    { key: 'lrNumber', label: 'LR Number' }, { key: 'truckNumber', label: 'Truck' },
    { key: 'driverName', label: 'Driver' }, { key: 'from', label: 'From' }, { key: 'to', label: 'To' },
    { key: 'startDate', label: 'Start Date' }, { key: 'freight', label: 'Freight', exportVal: r => r.freight || 0 },
    { key: 'advance', label: 'Advance', exportVal: r => r.advance || 0 }, { key: 'balance', label: 'Balance', exportVal: r => r.balance || 0 },
    { key: 'status', label: 'Status' },
  ];

  const fuelCols = [
    { key: 'truckNumber', label: 'Truck Number' }, { key: 'date', label: 'Date' },
    { key: 'quantity', label: 'Quantity (L)', exportVal: r => r.quantity || 0 },
    { key: 'pricePerLitre', label: 'Price/L', exportVal: r => r.pricePerLitre || 0 },
    { key: 'totalAmount', label: 'Amount', exportVal: r => r.totalAmount || 0 },
    { key: 'paymentMode', label: 'Payment Mode' }, { key: 'invoiceNumber', label: 'Invoice' },
  ];

  const maintCols = [
    { key: 'truckNumber', label: 'Truck' }, { key: 'serviceType', label: 'Service Type' },
    { key: 'description', label: 'Description' }, { key: 'serviceDate', label: 'Date' },
    { key: 'cost', label: 'Cost', exportVal: r => r.cost || 0 }, { key: 'vendor', label: 'Workshop' }, { key: 'status', label: 'Status' },
  ];

  const stockCols = [
    { key: 'partCode', label: 'Code' }, { key: 'partName', label: 'Part Name' },
    { key: 'category', label: 'Category' }, { key: 'currentStock', label: 'Current Stock', exportVal: r => r.currentStock || 0 },
    { key: 'reorderLevel', label: 'Reorder Level', exportVal: r => r.reorderLevel || 0 },
    { key: 'unitPrice', label: 'Unit Price', exportVal: r => r.unitPrice || 0 },
    { key: 'vendor', label: 'Vendor' },
  ];

  const FilterBar = () => (
    <div style={{ background: '#fff', borderBottom: '1px solid #dde3ec', padding: '8px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ color: '#607d8b', fontSize: 11, fontWeight: 700 }}>PERIOD:</span>
      <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} style={{ padding: '4px 8px', border: '1px solid #dde3ec', borderRadius: 3, fontSize: 12, outline: 'none' }}>
        {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
      </select>
      <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} style={{ padding: '4px 8px', border: '1px solid #dde3ec', borderRadius: 3, fontSize: 12, outline: 'none' }}>
        {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
      </select>
      <span style={{ color: '#607d8b', fontSize: 11 }}>— {months[filterMonth - 1]} {filterYear}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT }}>
      <PageHeader title="REPORTS & ANALYTICS" subtitle="MIS, Business & Operational Reports" />

      <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Freight This Month" value={`GH₵${freightTotal.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="💰" color={C.success} />
        <StatCard label="Fuel Cost This Month" value={`GH₵${fuelCostTotal.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="⛽" color={C.primary} />
        <StatCard label="Maintenance Cost" value={`GH₵${maintCostTotal.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="🔩" color={C.warning} />
        <StatCard label="Net Estimate" value={`GH₵${(freightTotal - fuelCostTotal - maintCostTotal).toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="📊" color={freightTotal - fuelCostTotal - maintCostTotal >= 0 ? C.success : C.danger} />
      </div>

      <Tabs tabs={[
        { key: 'trips', label: `Trips Report (${filteredTrips.length})` },
        { key: 'fuel', label: `Fuel Report (${filteredFuel.length})` },
        { key: 'maintenance', label: `Maintenance (${filteredMaint.length})` },
        { key: 'stock', label: 'Stock Summary' },
      ]} active={tab} onChange={setTab} />

      <FilterBar />

      <div style={{ padding: '16px 20px' }}>
        {tab === 'trips' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} style={{ background: '#fff', border: '1px solid #dde3ec', borderRadius: 4, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge text={status} type={{ PENDING: 'warning', IN_TRANSIT: 'info', DELIVERED: 'success', BILLED: 'primary', CANCELLED: 'danger' }[status] || 'default'} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{count}</span>
                </div>
              ))}
            </div>
            <Section title={`Trip Report — ${months[filterMonth - 1]} ${filterYear}`}
              actions={<Btn size="xs" variant="teal" onClick={() => exportToExcel(filteredTrips, tripCols, `trips_${months[filterMonth - 1]}_${filterYear}`)}>📤 Export Excel</Btn>}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: FONT }}>
                  <thead><tr>
                    {['#', 'LR No.', 'Truck', 'Driver', 'Route', 'Start', 'Freight', 'Advance', 'Balance', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 9px', background: C.tableHead, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredTrips.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: '#607d8b' }}>No trips for this period</td></tr>
                    ) : filteredTrips.map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '7px 9px' }}>{i + 1}</td>
                        <td style={{ padding: '7px 9px', fontWeight: 600, color: C.primary }}>{t.lrNumber}</td>
                        <td style={{ padding: '7px 9px' }}>{t.truckNumber}</td>
                        <td style={{ padding: '7px 9px' }}>{t.driverName}</td>
                        <td style={{ padding: '7px 9px', fontSize: 11 }}>{t.from} → {t.to}</td>
                        <td style={{ padding: '7px 9px' }}>{t.startDate}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right' }}>GH₵{(t.freight || 0).toLocaleString('en-GH')}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right' }}>GH₵{(t.advance || 0).toLocaleString('en-GH')}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right', color: '#c62828', fontWeight: 700 }}>GH₵{(t.balance || 0).toLocaleString('en-GH')}</td>
                        <td style={{ padding: '7px 9px' }}><Badge text={t.status} type={{ PENDING: 'warning', IN_TRANSIT: 'info', DELIVERED: 'success', BILLED: 'primary' }[t.status] || 'default'} /></td>
                      </tr>
                    ))}
                    {filteredTrips.length > 0 && (
                      <tr style={{ background: '#ecf0f7', fontWeight: 700 }}>
                        <td colSpan={6} style={{ padding: '7px 9px', textAlign: 'right', color: '#1565c0', fontSize: 11 }}>TOTAL</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right', color: '#2e7d32' }}>GH₵{freightTotal.toLocaleString('en-GH')}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right' }}>GH₵{filteredTrips.reduce((s, t) => s + (t.advance || 0), 0).toLocaleString('en-GH')}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right', color: '#c62828' }}>GH₵{filteredTrips.reduce((s, t) => s + (t.balance || 0), 0).toLocaleString('en-GH')}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {tab === 'fuel' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <StatCard label="Total Litres" value={filteredFuel.reduce((s, f) => s + (f.quantity || 0), 0).toFixed(1) + 'L'} icon="⛽" color={C.primary} />
              <StatCard label="Total Cost" value={`GH₵${fuelCostTotal.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`} icon="💰" color={C.success} />
              <StatCard label="Avg Rate/L" value={filteredFuel.length > 0 ? `GH₵${(fuelCostTotal / filteredFuel.reduce((s, f) => s + (f.quantity || 0), 0)).toFixed(2)}` : '—'} icon="📊" color={C.info} />
            </div>
            <Section title={`Fuel Report — ${months[filterMonth - 1]} ${filterYear}`}
              actions={<Btn size="xs" variant="teal" onClick={() => exportToExcel(filteredFuel, fuelCols, `fuel_${months[filterMonth - 1]}_${filterYear}`)}>📤 Export Excel</Btn>}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>
                  {['Truck', 'Date', 'Quantity (L)', 'Rate/L', 'Total Amount', 'Payment', 'Invoice'].map(h => (
                    <th key={h} style={{ padding: '7px 9px', background: C.tableHead, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredFuel.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#607d8b' }}>No fuel entries for this period</td></tr>
                    : filteredFuel.map((f, i) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '7px 9px', fontWeight: 600, color: C.primary }}>{f.truckNumber}</td>
                        <td style={{ padding: '7px 9px' }}>{f.date}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right' }}>{(f.quantity || 0).toFixed(1)}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right' }}>GH₵{(f.pricePerLitre || 0).toFixed(2)}</td>
                        <td style={{ padding: '7px 9px', textAlign: 'right', fontWeight: 600 }}>GH₵{(f.totalAmount || 0).toLocaleString('en-GH', { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '7px 9px' }}>{f.paymentMode}</td>
                        <td style={{ padding: '7px 9px' }}>{f.invoiceNumber || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Section>

            {truckFuelData.length > 0 && (
              <Section title="Truck-wise Fuel Summary">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>
                    {['Truck Number', 'Total Quantity (L)', 'Total Cost'].map(h => (
                      <th key={h} style={{ padding: '7px 9px', background: C.tableHead, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{truckFuelData.map((t, i) => (
                    <tr key={t.truck} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '7px 9px', fontWeight: 600, color: C.primary }}>{t.truck}</td>
                      <td style={{ padding: '7px 9px', textAlign: 'right' }}>{t.qty.toFixed(1)}</td>
                      <td style={{ padding: '7px 9px', textAlign: 'right', fontWeight: 600 }}>GH₵{t.cost.toLocaleString('en-GH', { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </Section>
            )}
          </>
        )}

        {tab === 'maintenance' && (
          <Section title={`Maintenance Report — ${months[filterMonth - 1]} ${filterYear}`}
            actions={<Btn size="xs" variant="teal" onClick={() => exportToExcel(filteredMaint, maintCols, `maintenance_${months[filterMonth - 1]}_${filterYear}`)}>📤 Export Excel</Btn>}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>
                {['Truck', 'Service Type', 'Description', 'Date', 'Cost', 'Workshop', 'Status'].map(h => (
                  <th key={h} style={{ padding: '7px 9px', background: C.tableHead, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredMaint.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#607d8b' }}>No maintenance records for this period</td></tr>
                  : filteredMaint.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '7px 9px', fontWeight: 600, color: C.primary }}>{m.truckNumber}</td>
                      <td style={{ padding: '7px 9px' }}>{m.serviceType}</td>
                      <td style={{ padding: '7px 9px' }}>{m.description}</td>
                      <td style={{ padding: '7px 9px' }}>{m.serviceDate}</td>
                      <td style={{ padding: '7px 9px', textAlign: 'right', fontWeight: 600 }}>GH₵{(m.cost || 0).toLocaleString('en-GH')}</td>
                      <td style={{ padding: '7px 9px' }}>{m.vendor || '—'}</td>
                      <td style={{ padding: '7px 9px' }}><Badge text={m.status} type={{ COMPLETED: 'success', IN_PROGRESS: 'warning', SCHEDULED: 'info', CANCELLED: 'danger' }[m.status] || 'default'} /></td>
                    </tr>
                  ))}
                {filteredMaint.length > 0 && (
                  <tr style={{ background: '#ecf0f7', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '7px 9px', textAlign: 'right', color: '#1565c0', fontSize: 11 }}>TOTAL COST</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#c62828' }}>GH₵{maintCostTotal.toLocaleString('en-GH')}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>
        )}

        {tab === 'stock' && (
          <>
            <Section title="Spare Parts — Low Stock Alert"
              actions={<Btn size="xs" variant="teal" onClick={() => exportToExcel(parts, stockCols, 'spare_parts_stock')}>📤 Export Excel</Btn>}>
              {lowStock.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#2e7d32' }}>✓ All parts adequately stocked</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>
                    {['Part Code', 'Part Name', 'Category', 'Current Stock', 'Reorder Level', 'Unit Price', 'Vendor'].map(h => (
                      <th key={h} style={{ padding: '7px 9px', background: C.tableHead, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{lowStock.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '7px 9px', fontWeight: 600 }}>{p.partCode}</td>
                      <td style={{ padding: '7px 9px' }}>{p.partName}</td>
                      <td style={{ padding: '7px 9px' }}>{p.category}</td>
                      <td style={{ padding: '7px 9px', textAlign: 'right' }}><span style={{ color: '#c62828', fontWeight: 700 }}>{p.currentStock ?? 0}</span></td>
                      <td style={{ padding: '7px 9px', textAlign: 'right' }}>{p.reorderLevel ?? 0}</td>
                      <td style={{ padding: '7px 9px', textAlign: 'right' }}>GH₵{(p.unitPrice || 0).toLocaleString('en-GH')}</td>
                      <td style={{ padding: '7px 9px' }}>{p.vendor || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </Section>
            <Section title="Tyre Stock Summary" actions={<Btn size="xs" variant="teal" onClick={() => exportToExcel(tyres, [{ key: 'tyreName', label: 'Tyre Name' }, { key: 'brand', label: 'Brand' }, { key: 'size', label: 'Size' }, { key: 'currentStock', label: 'Current Stock', exportVal: r => r.currentStock || 0 }, { key: 'reorderLevel', label: 'Reorder Level', exportVal: r => r.reorderLevel || 0 }], 'tyre_stock')}>📤 Export Excel</Btn>}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>
                  {['Tyre Name', 'Brand', 'Size', 'Current Stock', 'Reorder Level', 'Status'].map(h => (
                    <th key={h} style={{ padding: '7px 9px', background: C.tableHead, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${C.primaryBorder}`, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{tyres.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '7px 9px', fontWeight: 600 }}>{t.tyreName}</td>
                    <td style={{ padding: '7px 9px' }}>{t.brand}</td>
                    <td style={{ padding: '7px 9px' }}>{t.size}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right' }}><span style={{ fontWeight: 700, color: (t.currentStock || 0) <= (t.reorderLevel || 0) ? '#c62828' : '#2e7d32' }}>{t.currentStock ?? 0}</span></td>
                    <td style={{ padding: '7px 9px', textAlign: 'right' }}>{t.reorderLevel ?? 0}</td>
                    <td style={{ padding: '7px 9px' }}><Badge text={(t.currentStock || 0) <= (t.reorderLevel || 0) ? 'LOW' : 'OK'} type={(t.currentStock || 0) <= (t.reorderLevel || 0) ? 'danger' : 'success'} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
