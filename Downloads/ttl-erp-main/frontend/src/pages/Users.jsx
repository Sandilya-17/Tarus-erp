import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api/api';
import { KLTable, PageHeader, Btn, Modal, Field, Input, Select, Section, Badge, StatCard, FormGrid, SearchInput, exportToExcel } from '../components/UI';
import toast from 'react-hot-toast';

// ── Enterprise permission tree with sub-permissions ────────
const PERM_GROUPS = [
  {
    group: 'Fleet Operations',
    icon: '🚛',
    perms: [
      { key:'VIEW_TRUCKS',         label:'View Fleet',           desc:'View vehicles list & details' },
      { key:'MANAGE_TRUCKS',       label:'Manage Fleet',         desc:'Add, edit & deactivate trucks' },
      { key:'DRIVERS',             label:'View Drivers',         desc:'View driver profiles' },
      { key:'MANAGE_DRIVERS',      label:'Manage Drivers',       desc:'Add, edit & manage drivers' },
    ]
  },
  {
    group: 'Trip & Logistics',
    icon: '📋',
    perms: [
      { key:'TRIPS',               label:'View Trips',           desc:'View trip records & waybills' },
      { key:'CREATE_TRIPS',        label:'Create Trips',         desc:'Log new trips & waybills' },
      { key:'APPROVE_TRIPS',       label:'Approve Trips',        desc:'Approve & close trip records' },
    ]
  },
  {
    group: 'Fuel Management',
    icon: '⛽',
    perms: [
      { key:'FUEL_ENTRY',          label:'View Fuel',            desc:'View fuel entries & reports' },
      { key:'ADD_FUEL',            label:'Add Fuel Entry',       desc:'Record fuel purchases' },
      { key:'APPROVE_FUEL',        label:'Approve Fuel',         desc:'Approve fuel entries' },
    ]
  },
  {
    group: 'Workshop & Stores',
    icon: '🔧',
    perms: [
      { key:'SPARE_PART_ISSUE',    label:'View Spare Parts',     desc:'View stock & issue ledger' },
      { key:'MANAGE_SPARE_PARTS',  label:'Manage Spare Parts',   desc:'Add parts, purchase & issue' },
      { key:'TYRE_ISSUE',          label:'View Tyre Stock',      desc:'View tyre inventory' },
      { key:'MANAGE_TYRES',        label:'Manage Tyres',         desc:'Purchase & issue tyres' },
      { key:'MAINTENANCE',         label:'View Maintenance',     desc:'View service records' },
      { key:'MANAGE_MAINTENANCE',  label:'Manage Maintenance',   desc:'Create & update job cards' },
    ]
  },
  {
    group: 'Finance',
    icon: '💰',
    perms: [
      { key:'FINANCE',             label:'View Finance',         desc:'View revenue & expenditure' },
      { key:'MANAGE_FINANCE',      label:'Manage Finance',       desc:'Add & edit financial entries' },
      { key:'APPROVE_FINANCE',     label:'Approve Finance',      desc:'Approve financial records' },
      { key:'EXPORT_FINANCE',      label:'Export Finance Data',  desc:'Export P&L to Excel' },
    ]
  },
  {
    group: 'Reports & Analytics',
    icon: '📊',
    perms: [
      { key:'VIEW_REPORTS',        label:'View Reports',         desc:'Access MIS & analytics' },
      { key:'EXPORT_REPORTS',      label:'Export Reports',       desc:'Export reports to Excel' },
    ]
  },
];

const ALL_PERM_KEYS = PERM_GROUPS.flatMap(g => g.perms.map(p => p.key));

const DEPTS = ['Operations','Finance','Maintenance','Administration','Logistics','HR','Accounts','Workshop'];
const EMPTY = { username:'', password:'', fullName:'', email:'', phone:'', role:'EMPLOYEE', department:'Operations', jobTitle:'', employeeId:'', permissions:[], active:true };

const GH_GREEN = '#1a4731';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(PERM_GROUPS.map(g => [g.group, true]))
  );

  const load = () => adminAPI.getUsers().then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.username?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const togglePerm = (perm) => setForm(p => ({
    ...p,
    permissions: p.permissions?.includes(perm)
      ? p.permissions.filter(x => x !== perm)
      : [...(p.permissions || []), perm],
  }));

  const toggleGroup = (groupPerms) => {
    const keys = groupPerms.map(p => p.key);
    const allChecked = keys.every(k => form.permissions?.includes(k));
    setForm(p => ({
      ...p,
      permissions: allChecked
        ? p.permissions.filter(k => !keys.includes(k))
        : [...new Set([...(p.permissions || []), ...keys])],
    }));
  };

  const selectAllPerms = () => setForm(p => ({ ...p, permissions: [...ALL_PERM_KEYS] }));
  const clearAllPerms = () => setForm(p => ({ ...p, permissions: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') { await adminAPI.createUser(form); toast.success('User created successfully'); }
      else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await adminAPI.updateUser(selected.id, payload);
        toast.success('User updated');
      }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving user'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete user "${u.username}"?
This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      toast.success(`User "${u.username}" deleted`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting user');
    }
  };

  const cols = [
    { key:'employeeId', label:'Emp ID' },
    { key:'username', label:'Username', color: GH_GREEN, minWidth:100 },
    { key:'fullName', label:'Full Name', minWidth:130 },
    { key:'role', label:'Role', render: v => <Badge text={v} type={v==='ADMIN'?'primary':'success'} /> },
    { key:'department', label:'Department' },
    { key:'jobTitle', label:'Job Title' },
    { key:'email', label:'Email' },
    { key:'permissions', label:'Permissions', render: v => (
      <span style={{ fontSize:10, color:'#607d8b' }}>
        {v?.length || 0} / {ALL_PERM_KEYS.length}
      </span>
    )},
    { key:'active', label:'Status', render: v => <Badge text={v?'Active':'Inactive'} type={v?'success':'danger'} /> },
  ];

  return (
    <div>
      <PageHeader title="USER MANAGEMENT" subtitle={`${users.filter(u=>u.active).length} active · ${users.length} total`}
        actions={[
          <SearchInput key="s" value={search} onChange={setSearch} placeholder="Username/name/email..." />,
          <Btn key="exp" variant="teal" onClick={() => exportToExcel(filtered, cols, 'users')}>📤 Export</Btn>,
          <Btn key="add" variant="success" onClick={() => { setForm({ ...EMPTY, permissions:[] }); setModal('add'); }}>+ Add User</Btn>,
        ]}
      />

      <div style={{ padding:'12px 20px', display:'flex', gap:10, flexWrap:'wrap' }}>
        <StatCard label="Total Users"  value={users.length}                              icon="👥" color={GH_GREEN} />
        <StatCard label="Admins"       value={users.filter(u=>u.role==='ADMIN').length}  icon="🔑" color="#6a1b9a" />
        <StatCard label="Employees"    value={users.filter(u=>u.role==='EMPLOYEE').length} icon="👤" color="#2e7d32" />
        <StatCard label="Inactive"     value={users.filter(u=>!u.active).length}         icon="✗"  color="#c62828" />
      </div>

      <div style={{ padding:'0 20px 20px' }}>
        <Section title={`System Users — ${filtered.length} records`}>
          <KLTable columns={cols} data={filtered} loading={loading}
            onEdit={u => { setForm({ ...EMPTY, ...u, password:'' }); setSelected(u); setModal('edit'); }}
            onDelete={handleDelete}
          />
        </Section>
      </div>

      {(modal==='add' || modal==='edit') && (
        <Modal title={modal==='add' ? 'Add New User' : `Edit User — ${selected?.username}`} onClose={() => setModal(null)} width={780}>
          <form onSubmit={handleSubmit}>

            {/* Account Details */}
            <div style={{ background:'#f4f6f9', borderRadius:6, padding:14, marginBottom:14 }}>
              <SectionTitle icon="👤" label="Account Details" />
              <FormGrid cols={3}>
                <Field label="Username" required>
                  <Input name="username" value={form.username} onChange={handleChange} required disabled={modal==='edit'} />
                </Field>
                <Field label={modal==='edit' ? 'New Password (blank = no change)' : 'Password'} required={modal==='add'}>
                  <Input name="password" type="password" value={form.password} onChange={handleChange} required={modal==='add'} autoComplete="new-password" />
                </Field>
                <Field label="Role">
                  <Select name="role" value={form.role} onChange={handleChange}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </Field>
                <Field label="Full Name" required>
                  <Input name="fullName" value={form.fullName} onChange={handleChange} required />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" value={form.email} onChange={handleChange} />
                </Field>
                <Field label="Phone">
                  <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+233 XX XXX XXXX" />
                </Field>
                <Field label="Employee ID">
                  <Input name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="EMP-001" />
                </Field>
                <Field label="Department">
                  <Select name="department" value={form.department} onChange={handleChange}>
                    {DEPTS.map(d => <option key={d}>{d}</option>)}
                  </Select>
                </Field>
                <Field label="Job Title">
                  <Input name="jobTitle" value={form.jobTitle} onChange={handleChange} />
                </Field>
                <Field label="Status">
                  <Select name="active" value={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.value==='true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </Field>
              </FormGrid>
            </div>

            {/* Enterprise Permissions */}
            {form.role === 'EMPLOYEE' && (
              <div style={{ background:'#f4f6f9', borderRadius:6, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <SectionTitle icon="🔐" label={`Module Access Permissions — ${form.permissions?.length || 0} / ${ALL_PERM_KEYS.length} granted`} />
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn size="xs" variant="success" onClick={selectAllPerms}>✓ Grant All</Btn>
                    <Btn size="xs" variant="secondary" onClick={clearAllPerms}>✗ Revoke All</Btn>
                  </div>
                </div>

                {PERM_GROUPS.map(group => {
                  const allChecked = group.perms.every(p => form.permissions?.includes(p.key));
                  const someChecked = group.perms.some(p => form.permissions?.includes(p.key));
                  const isOpen = expandedGroups[group.group];
                  return (
                    <div key={group.group} style={{ marginBottom:8, border:`1px solid ${allChecked?'#a5d6a7':someChecked?'#90caf9':'#dde3ec'}`, borderRadius:5, overflow:'hidden' }}>
                      {/* Group header row */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', background: allChecked?'#e8f5e9':someChecked?'#e3f2fd':'#eceff1', cursor:'pointer' }}
                        onClick={() => setExpandedGroups(s => ({ ...s, [group.group]: !s[group.group] }))}>
                        {/* Group-level checkbox */}
                        <div onClick={e => { e.stopPropagation(); toggleGroup(group.perms); }}
                          style={{ width:16, height:16, border:`2px solid ${allChecked?GH_GREEN:someChecked?'#1565c0':'#90a4ae'}`, borderRadius:3, background:allChecked?GH_GREEN:someChecked?'#e3f2fd':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                          {allChecked && <span style={{ color:'#fff', fontSize:11, lineHeight:1 }}>✓</span>}
                          {someChecked && !allChecked && <span style={{ color:'#1565c0', fontSize:11, lineHeight:1, fontWeight:900 }}>–</span>}
                        </div>
                        <span style={{ fontSize:13 }}>{group.icon}</span>
                        <span style={{ fontSize:11, fontWeight:700, color: allChecked?GH_GREEN:someChecked?'#1565c0':'#455a64', flex:1 }}>{group.group}</span>
                        <span style={{ fontSize:10, color:'#90a4ae' }}>{group.perms.filter(p=>form.permissions?.includes(p.key)).length}/{group.perms.length}</span>
                        <span style={{ fontSize:10, color:'#90a4ae', marginLeft:4, transform:isOpen?'rotate(0)':'rotate(-90deg)', display:'inline-block', transition:'transform .15s' }}>▾</span>
                      </div>

                      {/* Sub-permissions */}
                      {isOpen && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:1, background:'#dde3ec', padding:1 }}>
                          {group.perms.map(p => {
                            const checked = form.permissions?.includes(p.key);
                            return (
                              <label key={p.key} onClick={() => togglePerm(p.key)}
                                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                                  border:'none', background:checked?'#f0fdf4':'#fff', cursor:'pointer', transition:'background .1s' }}>
                                <div style={{ width:15, height:15, border:`2px solid ${checked?GH_GREEN:'#cfd8dc'}`, borderRadius:3, background:checked?GH_GREEN:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                  {checked && <span style={{ color:'#fff', fontSize:10, lineHeight:1 }}>✓</span>}
                                </div>
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:11, fontWeight:600, color:checked?GH_GREEN:'#37474f' }}>{p.label}</div>
                                  <div style={{ fontSize:9.5, color:'#90a4ae', marginTop:1 }}>{p.desc}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit" variant="success">{modal==='add' ? 'Create User' : 'Save Changes'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:'#1a4731', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
      <span>{icon}</span>{label}
    </div>
  );
}
