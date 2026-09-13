import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Laptop,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  operationsApi,
  type AssetDto,
  type AssetStatus,
  type EmployeeRowDto,
  type InternalProjectDto,
  type LeaveRequestDto,
  type MeetingDto,
  type PurchaseOrderDto,
  type PurchaseRequisitionDto,
  type VendorDto,
} from '../../lib/api/operations.api';

type Tab = 'people' | 'procurement' | 'assets' | 'projects';

const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500';
const secondaryButton = 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50';
const primaryButton = 'rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50';

const money = (value: string | number | null | undefined) =>
  `KES ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const day = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—';
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';
const toIso = (value: string) => value ? new Date(value).toISOString() : undefined;

function Status({ value }: { value: string }) {
  const tone = value.includes('APPROVED') || value.includes('RECEIVED') || value === 'IN_STOCK' || value === 'COMPLETED'
    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
    : value.includes('REJECT') || value === 'LOST' || value === 'CANCELLED'
      ? 'bg-rose-950/60 text-rose-300 border-rose-800'
      : value.includes('SUBMITTED') || value.includes('ORDERED') || value === 'ASSIGNED'
        ? 'bg-amber-950/60 text-amber-300 border-amber-800'
        : 'bg-slate-900 text-slate-300 border-slate-700';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${tone}`}>{value.replaceAll('_', ' ')}</span>;
}

function Panel({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5 shadow-xl">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-base font-semibold text-slate-100">{title}</h2>{description && <p className="mt-1 text-xs text-slate-400">{description}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

export const OperationsWorkspace: React.FC = () => {
  const { currentUser, branches, users, hasUserPermission } = useApp();
  const canOpenOperations = hasUserPermission('module.operations');
  const canHr = hasUserPermission('hr.manage');
  const canProcurement = hasUserPermission('procurement.manage');
  const canAssets = hasUserPermission('assets.manage');
  const canManageOperations = hasUserPermission('operations.manage');

  const [tab, setTab] = useState<Tab>('people');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [employees, setEmployees] = useState<EmployeeRowDto[]>([]);
  const [leave, setLeave] = useState<LeaveRequestDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisitionDto[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [projects, setProjects] = useState<InternalProjectDto[]>([]);
  const [meetings, setMeetings] = useState<MeetingDto[]>([]);

  const defaultBranchId = currentUser.homeBranchId || branches[0]?.id || '';

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const leavePromise = operationsApi.leave(canHr ? 'all' : 'self');
      const employeePromise = canHr ? operationsApi.employees() : Promise.resolve([] as EmployeeRowDto[]);
      const operationalPromises = canOpenOperations
        ? Promise.all([operationsApi.vendors(), operationsApi.requisitions(), operationsApi.orders(), operationsApi.assets(), operationsApi.projects(), operationsApi.meetings()])
        : Promise.resolve([[], [], [], [], [], []] as [VendorDto[], PurchaseRequisitionDto[], PurchaseOrderDto[], AssetDto[], InternalProjectDto[], MeetingDto[]]);
      const [leaveRows, employeeRows, [vendorRows, requisitionRows, orderRows, assetRows, projectRows, meetingRows]] = await Promise.all([leavePromise, employeePromise, operationalPromises]);
      setLeave(leaveRows); setEmployees(employeeRows); setVendors(vendorRows); setRequisitions(requisitionRows);
      setOrders(orderRows); setAssets(assetRows); setProjects(projectRows); setMeetings(meetingRows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load operations data.');
    } finally { setLoading(false); }
  }, [canHr, canOpenOperations]);

  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(success); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed.'); }
    finally { setBusy(false); }
  }

  const [leaveForm, setLeaveForm] = useState({ type: 'Annual Leave', startsOn: '', endsOn: '', days: '1', reason: '' });
  const [employeeForm, setEmployeeForm] = useState({ userId: '', employeeNumber: '', employmentType: 'FULL_TIME', startDate: '', managerUserId: '', leavePolicyKey: 'STANDARD', cpdsRequiredAnnual: '0', notes: '' });
  const [vendorForm, setVendorForm] = useState({ name: '', kraPin: '', contactName: '', phone: '', email: '', address: '' });
  const [reqForm, setReqForm] = useState({ branchId: defaultBranchId, vendorId: '', description: '', amount: '' });
  const [assetForm, setAssetForm] = useState({ branchId: defaultBranchId, category: 'ICT', name: '', serialNumber: '', purchaseCost: '', notes: '' });
  const [projectForm, setProjectForm] = useState({ branchId: defaultBranchId, name: '', description: '', ownerUserId: currentUser.id, dueDate: '', budget: '' });
  const [meetingForm, setMeetingForm] = useState({ projectId: '', title: '', startsAt: '', endsAt: '', location: '', agenda: '' });
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingNotes, setMeetingNotes] = useState({ minutes: '', decision: '', action: '', assigneeId: '', dueAt: '' });

  useEffect(() => {
    if (defaultBranchId) {
      setReqForm((v) => v.branchId ? v : { ...v, branchId: defaultBranchId });
      setAssetForm((v) => v.branchId ? v : { ...v, branchId: defaultBranchId });
      setProjectForm((v) => v.branchId ? v : { ...v, branchId: defaultBranchId });
    }
  }, [defaultBranchId]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) ?? null;
  const pendingLeave = leave.filter((row) => row.status === 'SUBMITTED').length;
  const pendingProcurement = requisitions.filter((row) => row.status === 'SUBMITTED').length;
  const assignedAssets = assets.filter((row) => row.status === 'ASSIGNED').length;
  const upcomingMeetings = meetings.filter((row) => new Date(row.startsAt) >= new Date()).length;

  const activeAssetAssignment = (asset: AssetDto) => asset.assignments?.find((assignment) => !assignment.returnedAt);
  const sortedLeave = useMemo(() => [...leave].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [leave]);

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType; badge?: number; hidden?: boolean }> = [
    { id: 'people', label: 'People & Leave', icon: Users, badge: pendingLeave },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart, badge: pendingProcurement, hidden: !canOpenOperations },
    { id: 'assets', label: 'Asset Custody', icon: Laptop, badge: assignedAssets, hidden: !canOpenOperations },
    { id: 'projects', label: 'Projects & Meetings', icon: Briefcase, badge: upcomingMeetings, hidden: !canOpenOperations },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8 text-slate-100">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-500">Firm operations</p>
          <h1 className="mt-1 text-2xl font-serif font-bold">People, Procurement, Assets & Internal Work</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">Server-backed administration for leave, staff records, purchasing, custody, projects, meetings and action capture.</p>
        </div>
        <button className={secondaryButton} onClick={() => void load()} disabled={loading || busy}><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Refresh</button>
      </header>

      {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-800 bg-rose-950/40 text-rose-200' : 'border-emerald-800 bg-emerald-950/40 text-emerald-200'}`}>{error || message}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Pending leave', pendingLeave], ['Pending requisitions', pendingProcurement], ['Assets assigned', assignedAssets], ['Upcoming meetings', upcomingMeetings]
        ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><div className="text-xl font-bold text-slate-100">{value}</div><div className="text-[11px] text-slate-400">{label}</div></div>)}
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-2">
        {tabs.filter((item) => !item.hidden).map((item) => {
          const Icon = item.icon;
          return <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${tab === item.id ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{item.label}{item.badge ? <span className="rounded-full bg-slate-950/50 px-1.5 py-0.5 text-[10px]">{item.badge}</span> : null}</button>;
        })}
      </nav>

      {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-slate-400">Loading firm operations…</div> : null}

      {!loading && tab === 'people' && <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <Panel title="Request leave" description="Requests are persisted immediately and can be approved by HR without browser-only state.">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
              if (!leaveForm.startsOn || !leaveForm.endsOn) throw new Error('Choose the leave dates.');
              await operationsApi.requestLeave({ type: leaveForm.type, startsOn: new Date(`${leaveForm.startsOn}T00:00:00`).toISOString(), endsOn: new Date(`${leaveForm.endsOn}T23:59:59`).toISOString(), days: Number(leaveForm.days), reason: leaveForm.reason || undefined });
              setLeaveForm({ type: 'Annual Leave', startsOn: '', endsOn: '', days: '1', reason: '' });
            }, 'Leave request submitted.'); }}>
              <label className="block text-xs text-slate-400">Leave type<select className={inputClass} value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}><option>Annual Leave</option><option>Sick Leave</option><option>Compassionate Leave</option><option>Maternity Leave</option><option>Paternity Leave</option><option>Study Leave</option><option>Unpaid Leave</option></select></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">Starts<input type="date" className={inputClass} value={leaveForm.startsOn} onChange={(e) => setLeaveForm({ ...leaveForm, startsOn: e.target.value })} /></label><label className="text-xs text-slate-400">Ends<input type="date" className={inputClass} value={leaveForm.endsOn} onChange={(e) => setLeaveForm({ ...leaveForm, endsOn: e.target.value })} /></label></div>
              <label className="block text-xs text-slate-400">Chargeable days<input type="number" min="0.5" step="0.5" className={inputClass} value={leaveForm.days} onChange={(e) => setLeaveForm({ ...leaveForm, days: e.target.value })} /></label>
              <label className="block text-xs text-slate-400">Reason<textarea className={`${inputClass} min-h-24`} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></label>
              <button className={primaryButton} disabled={busy}>Submit leave request</button>
            </form>
          </Panel>

          {canHr && <Panel title="Employee profile" description="Create or update the internal employment profile attached to a firm user.">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
              if (!employeeForm.userId || !employeeForm.startDate) throw new Error('Choose the employee and start date.');
              await operationsApi.upsertEmployee(employeeForm.userId, {
                employeeNumber: employeeForm.employeeNumber || undefined,
                employmentType: employeeForm.employmentType,
                startDate: new Date(`${employeeForm.startDate}T00:00:00`).toISOString(),
                managerUserId: employeeForm.managerUserId || null,
                leavePolicyKey: employeeForm.leavePolicyKey || null,
                cpdsRequiredAnnual: Number(employeeForm.cpdsRequiredAnnual || 0),
                notes: employeeForm.notes || null,
              });
            }, 'Employee profile saved.'); }}>
              <label className="block text-xs text-slate-400">Employee<select className={inputClass} value={employeeForm.userId} onChange={(e) => setEmployeeForm({ ...employeeForm, userId: e.target.value })}><option value="">Choose staff member</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">Employee no.<input className={inputClass} placeholder="Auto if blank" value={employeeForm.employeeNumber} onChange={(e) => setEmployeeForm({ ...employeeForm, employeeNumber: e.target.value })} /></label><label className="text-xs text-slate-400">Employment type<select className={inputClass} value={employeeForm.employmentType} onChange={(e) => setEmployeeForm({ ...employeeForm, employmentType: e.target.value })}><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="CONTRACT">Contract</option><option value="INTERN">Intern</option><option value="CONSULTANT">Consultant</option></select></label></div>
              <label className="block text-xs text-slate-400">Start date<input type="date" className={inputClass} value={employeeForm.startDate} onChange={(e) => setEmployeeForm({ ...employeeForm, startDate: e.target.value })} /></label>
              <label className="block text-xs text-slate-400">Manager<select className={inputClass} value={employeeForm.managerUserId} onChange={(e) => setEmployeeForm({ ...employeeForm, managerUserId: e.target.value })}><option value="">No manager</option>{users.filter((user) => user.id !== employeeForm.userId).map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">Leave policy<input className={inputClass} value={employeeForm.leavePolicyKey} onChange={(e) => setEmployeeForm({ ...employeeForm, leavePolicyKey: e.target.value })} /></label><label className="text-xs text-slate-400">Annual CPD target<input type="number" min="0" className={inputClass} value={employeeForm.cpdsRequiredAnnual} onChange={(e) => setEmployeeForm({ ...employeeForm, cpdsRequiredAnnual: e.target.value })} /></label></div>
              <button className={primaryButton} disabled={busy}>Save employee profile</button>
            </form>
          </Panel>}
        </div>

        <div className="space-y-5">
          <Panel title={canHr ? 'Firm leave register' : 'My leave requests'} description={canHr ? 'Submitted requests can be approved or rejected here.' : 'Your authoritative leave history.'}>
            <div className="space-y-2">
              {!sortedLeave.length && <p className="py-8 text-center text-sm text-slate-500">No leave requests.</p>}
              {sortedLeave.map((row) => <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold text-slate-100">{row.requester?.fullName || currentUser.fullName} · {row.type}</div><div className="mt-1 text-xs text-slate-400">{day(row.startsOn)} → {day(row.endsOn)} · {String(row.days)} day(s)</div></div><Status value={row.status} /></div>
                {row.reason && <p className="mt-2 text-xs text-slate-300">{row.reason}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {canHr && row.status === 'SUBMITTED' && row.userId !== currentUser.id && <><button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideLeave(row.id, 'APPROVED'), 'Leave approved.')}>Approve</button><button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideLeave(row.id, 'REJECTED'), 'Leave rejected.')}>Reject</button></>}
                  {(row.userId === currentUser.id || canHr) && ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(row.status) && <button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.cancelLeave(row.id), 'Leave cancelled.')}>Cancel</button>}
                </div>
              </div>)}
            </div>
          </Panel>

          {canHr && <Panel title="Employment register" description="Employment metadata already modelled by the KKA data layer, now surfaced for administration.">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="text-slate-500"><tr><th className="pb-2">Employee</th><th>Number</th><th>Type</th><th>Start</th><th>Status</th></tr></thead><tbody>{employees.map((row) => <tr key={row.id} className="border-t border-slate-800"><td className="py-2.5"><div className="font-medium text-slate-200">{row.fullName}</div><div className="text-slate-500">{row.jobTitle || row.email}</div></td><td>{row.employeeProfile?.employeeNumber || 'Not profiled'}</td><td>{row.employeeProfile?.employmentType || '—'}</td><td>{day(row.employeeProfile?.startDate)}</td><td><Status value={row.status} /></td></tr>)}</tbody></table></div>
          </Panel>}
        </div>
      </div>}

      {!loading && tab === 'procurement' && canOpenOperations && <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-5">
          {canProcurement && <Panel title="New vendor">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { await operationsApi.createVendor({ ...vendorForm, email: vendorForm.email || undefined, kraPin: vendorForm.kraPin || undefined, contactName: vendorForm.contactName || undefined, phone: vendorForm.phone || undefined, address: vendorForm.address || undefined }); setVendorForm({ name: '', kraPin: '', contactName: '', phone: '', email: '', address: '' }); }, 'Vendor created.'); }}>
              <label className="block text-xs text-slate-400">Vendor name<input className={inputClass} value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">KRA PIN<input className={inputClass} value={vendorForm.kraPin} onChange={(e) => setVendorForm({ ...vendorForm, kraPin: e.target.value })} /></label><label className="text-xs text-slate-400">Contact<input className={inputClass} value={vendorForm.contactName} onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })} /></label></div>
              <div className="grid grid-cols-2 gap-3"><input className={inputClass} placeholder="Phone" value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} /><input className={inputClass} type="email" placeholder="Email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} /></div>
              <button className={primaryButton} disabled={busy || vendorForm.name.trim().length < 2}>Add vendor</button>
            </form>
          </Panel>}

          {canProcurement && <Panel title="Purchase requisition">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!reqForm.branchId || !reqForm.description || !reqForm.amount) throw new Error('Complete branch, description and amount.'); await operationsApi.createRequisition({ branchId: reqForm.branchId, vendorId: reqForm.vendorId || undefined, description: reqForm.description, amount: Number(reqForm.amount) }); setReqForm({ ...reqForm, description: '', amount: '' }); }, 'Purchase requisition submitted.'); }}>
              <label className="block text-xs text-slate-400">Branch<select className={inputClass} value={reqForm.branchId} onChange={(e) => setReqForm({ ...reqForm, branchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
              <label className="block text-xs text-slate-400">Preferred vendor<select className={inputClass} value={reqForm.vendorId} onChange={(e) => setReqForm({ ...reqForm, vendorId: e.target.value })}><option value="">Choose later</option>{vendors.filter((vendor) => vendor.active).map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
              <textarea className={`${inputClass} min-h-24`} placeholder="What is being purchased and why?" value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} />
              <input type="number" min="1" className={inputClass} placeholder="Amount KES" value={reqForm.amount} onChange={(e) => setReqForm({ ...reqForm, amount: e.target.value })} />
              <button className={primaryButton} disabled={busy}>Submit requisition</button>
            </form>
          </Panel>}
        </div>

        <div className="space-y-5">
          <Panel title="Requisitions" description="Approval and order creation remain separate audited states.">
            <div className="space-y-2">{requisitions.map((row) => <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-mono text-xs text-amber-400">{row.requisitionNo}</div><div className="font-semibold">{row.description}</div><div className="text-xs text-slate-500">{row.vendor?.name || 'Vendor not assigned'} · {money(row.amount)}</div></div><Status value={row.status} /></div>{canProcurement && <div className="mt-3 flex flex-wrap gap-2">{row.status === 'SUBMITTED' && row.requestedById !== currentUser.id && <><button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideRequisition(row.id, 'APPROVED'), 'Requisition approved.')}>Approve</button><button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideRequisition(row.id, 'REJECTED'), 'Requisition rejected.')}>Reject</button></>}{row.status === 'APPROVED' && row.vendorId && <button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.createOrder(row.id), 'Purchase order created.')}>Create PO</button>}</div>}</div>)}{!requisitions.length && <p className="py-8 text-center text-sm text-slate-500">No purchase requisitions.</p>}</div>
          </Panel>

          <Panel title="Purchase orders">
            <div className="space-y-2">{orders.map((order) => <div key={order.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-mono text-xs text-amber-400">{order.orderNo}</div><div className="font-semibold">{order.vendor?.name || order.description}</div><div className="text-xs text-slate-500">{money(order.amount)} · ordered {day(order.orderedAt)}</div></div><Status value={order.status} /></div>{canProcurement && ['ORDERED', 'PARTIALLY_RECEIVED'].includes(order.status) && <div className="mt-3 flex gap-2"><button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.receiveOrder(order.id, { partial: true }), 'Partial receipt recorded.')}>Partial receipt</button><button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.receiveOrder(order.id), 'Purchase order received.')}>Receive in full</button></div>}</div>)}{!orders.length && <p className="py-8 text-center text-sm text-slate-500">No purchase orders.</p>}</div>
          </Panel>
        </div>
      </div>}

      {!loading && tab === 'assets' && canOpenOperations && <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        {canAssets && <Panel title="Register asset" description="Creates a numbered custody asset in the firm register.">
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!assetForm.name || !assetForm.category) throw new Error('Asset name and category are required.'); await operationsApi.createAsset({ branchId: assetForm.branchId || undefined, category: assetForm.category, name: assetForm.name, serialNumber: assetForm.serialNumber || undefined, purchaseCost: assetForm.purchaseCost ? Number(assetForm.purchaseCost) : undefined, notes: assetForm.notes || undefined }); setAssetForm({ ...assetForm, name: '', serialNumber: '', purchaseCost: '', notes: '' }); }, 'Asset registered.'); }}>
            <label className="block text-xs text-slate-400">Branch<select className={inputClass} value={assetForm.branchId} onChange={(e) => setAssetForm({ ...assetForm, branchId: e.target.value })}><option value="">Firm-wide / unassigned</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><input className={inputClass} placeholder="Category" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} /><input className={inputClass} placeholder="Serial number" value={assetForm.serialNumber} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} /></div>
            <input className={inputClass} placeholder="Asset name" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
            <input type="number" min="0" className={inputClass} placeholder="Purchase cost KES" value={assetForm.purchaseCost} onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })} />
            <textarea className={`${inputClass} min-h-20`} placeholder="Notes / specification" value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} />
            <button className={primaryButton} disabled={busy}>Register asset</button>
          </form>
        </Panel>}

        <Panel title="Asset register" description="Current custody is derived from open assignment records rather than a browser-only flag.">
          <div className="grid gap-3 lg:grid-cols-2">{assets.map((asset) => { const custody = activeAssetAssignment(asset); return <div key={asset.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-mono text-[11px] text-amber-400">{asset.assetTag}</div><div className="font-semibold">{asset.name}</div><div className="text-xs text-slate-500">{asset.category}{asset.serialNumber ? ` · ${asset.serialNumber}` : ''}</div></div><Status value={asset.status} /></div>{custody && <div className="mt-3 rounded-lg bg-slate-900 p-2 text-xs"><UserCheck className="mr-1 inline h-3.5 w-3.5 text-amber-400" />Custody: {custody.user?.fullName || custody.userId} since {day(custody.assignedAt)}</div>}{canAssets && <div className="mt-3 flex flex-wrap gap-2">{!custody && !['RETIRED', 'LOST'].includes(asset.status) && <select className={`${inputClass} max-w-52`} defaultValue="" onChange={(e) => { const userId = e.target.value; if (userId) void run(() => operationsApi.assignAsset(asset.id, { userId }), 'Asset assigned.'); e.currentTarget.value = ''; }}><option value="">Assign custody…</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select>}{custody && <button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.returnAsset(asset.id), 'Asset returned to stock.')}>Return asset</button>}{(['IN_STOCK', 'REPAIR'] as AssetStatus[]).includes(asset.status) && <button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.updateAssetStatus(asset.id, asset.status === 'REPAIR' ? 'IN_STOCK' : 'REPAIR'), asset.status === 'REPAIR' ? 'Asset returned to service.' : 'Asset moved to repair.')}>{asset.status === 'REPAIR' ? 'Return to service' : 'Send to repair'}</button>}</div>}</div>; })}{!assets.length && <p className="col-span-full py-8 text-center text-sm text-slate-500">No registered assets.</p>}</div>
        </Panel>
      </div>}

      {!loading && tab === 'projects' && canOpenOperations && <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-5">
          {canManageOperations && <Panel title="Internal project">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!projectForm.name) throw new Error('Project name is required.'); await operationsApi.createProject({ branchId: projectForm.branchId || undefined, name: projectForm.name, description: projectForm.description || undefined, ownerUserId: projectForm.ownerUserId || undefined, dueDate: projectForm.dueDate ? new Date(`${projectForm.dueDate}T17:00:00`).toISOString() : undefined, budget: projectForm.budget ? Number(projectForm.budget) : undefined }); setProjectForm({ ...projectForm, name: '', description: '', dueDate: '', budget: '' }); }, 'Project created.'); }}>
              <input className={inputClass} placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
              <textarea className={`${inputClass} min-h-20`} placeholder="Purpose and scope" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              <label className="block text-xs text-slate-400">Owner<select className={inputClass} value={projectForm.ownerUserId} onChange={(e) => setProjectForm({ ...projectForm, ownerUserId: e.target.value })}>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><input type="date" className={inputClass} value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} /><input type="number" min="0" className={inputClass} placeholder="Budget KES" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} /></div>
              <button className={primaryButton} disabled={busy}>Create project</button>
            </form>
          </Panel>}

          {canManageOperations && <Panel title="Schedule meeting">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!meetingForm.title || !meetingForm.startsAt) throw new Error('Meeting title and start time are required.'); await operationsApi.createMeeting({ projectId: meetingForm.projectId || undefined, title: meetingForm.title, startsAt: toIso(meetingForm.startsAt)!, endsAt: toIso(meetingForm.endsAt), location: meetingForm.location || undefined, agenda: meetingForm.agenda ? { text: meetingForm.agenda } : undefined }); setMeetingForm({ projectId: '', title: '', startsAt: '', endsAt: '', location: '', agenda: '' }); }, 'Meeting scheduled.'); }}>
              <label className="block text-xs text-slate-400">Project<select className={inputClass} value={meetingForm.projectId} onChange={(e) => setMeetingForm({ ...meetingForm, projectId: e.target.value })}><option value="">Standalone meeting</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <input className={inputClass} placeholder="Meeting title" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3"><input type="datetime-local" className={inputClass} value={meetingForm.startsAt} onChange={(e) => setMeetingForm({ ...meetingForm, startsAt: e.target.value })} /><input type="datetime-local" className={inputClass} value={meetingForm.endsAt} onChange={(e) => setMeetingForm({ ...meetingForm, endsAt: e.target.value })} /></div>
              <input className={inputClass} placeholder="Location / room" value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} />
              <textarea className={`${inputClass} min-h-20`} placeholder="Agenda" value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} />
              <button className={primaryButton} disabled={busy}>Schedule meeting</button>
            </form>
          </Panel>}
        </div>

        <div className="space-y-5">
          <Panel title="Projects"><div className="grid gap-2 sm:grid-cols-2">{projects.map((project) => <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-start justify-between"><div><div className="font-semibold">{project.name}</div><div className="text-xs text-slate-500">Due {day(project.dueDate)} · {money(project.budget)}</div></div><Status value={project.status} /></div>{project.description && <p className="mt-2 text-xs text-slate-400 line-clamp-3">{project.description}</p>}</div>)}{!projects.length && <p className="col-span-full py-6 text-center text-sm text-slate-500">No internal projects.</p>}</div></Panel>

          <Panel title="Meeting register" description="Select a meeting to capture minutes, decisions and task-backed actions.">
            <div className="space-y-2">{meetings.map((meeting) => <button key={meeting.id} onClick={() => setSelectedMeetingId(meeting.id)} className={`w-full rounded-xl border p-3 text-left ${selectedMeetingId === meeting.id ? 'border-amber-600 bg-amber-950/20' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}><div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-slate-100">{meeting.title}</div><div className="text-xs text-slate-500">{dateTime(meeting.startsAt)} · {meeting.location || 'No location'}</div></div><Status value={meeting.status} /></div><div className="mt-2 flex gap-3 text-[11px] text-slate-500"><span>{meeting.decisions?.length || 0} decisions</span><span>{meeting.actions?.length || 0} actions</span></div></button>)}{!meetings.length && <p className="py-8 text-center text-sm text-slate-500">No meetings scheduled.</p>}</div>
          </Panel>

          {selectedMeeting && canManageOperations && <Panel title={`Minutes · ${selectedMeeting.title}`} action={<button className={secondaryButton} onClick={() => setSelectedMeetingId('')}>Close</button>}>
            <div className="space-y-4">
              <label className="block text-xs text-slate-400">Minutes<textarea className={`${inputClass} min-h-28`} value={meetingNotes.minutes} onChange={(e) => setMeetingNotes({ ...meetingNotes, minutes: e.target.value })} placeholder="Record discussion, resolutions and context." /></label>
              <div className="flex flex-wrap gap-2"><button className={primaryButton} disabled={busy || !meetingNotes.minutes.trim()} onClick={() => void run(() => operationsApi.updateMeeting(selectedMeeting.id, { minutes: { text: meetingNotes.minutes }, status: 'COMPLETED' }), 'Meeting minutes saved and meeting completed.')}>Save minutes & complete</button></div>
              <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Decision</div><textarea className={`${inputClass} min-h-20`} value={meetingNotes.decision} onChange={(e) => setMeetingNotes({ ...meetingNotes, decision: e.target.value })} /><button className={`${primaryButton} mt-2`} disabled={busy || !meetingNotes.decision.trim()} onClick={() => void run(async () => { await operationsApi.addMeetingDecision(selectedMeeting.id, { text: meetingNotes.decision }); setMeetingNotes((v) => ({ ...v, decision: '' })); }, 'Decision recorded.')}>Record decision</button></div><div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Action</div><textarea className={`${inputClass} min-h-20`} value={meetingNotes.action} onChange={(e) => setMeetingNotes({ ...meetingNotes, action: e.target.value })} /><select className={`${inputClass} mt-2`} value={meetingNotes.assigneeId} onChange={(e) => setMeetingNotes({ ...meetingNotes, assigneeId: e.target.value })}><option value="">No assignee</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select><input type="datetime-local" className={`${inputClass} mt-2`} value={meetingNotes.dueAt} onChange={(e) => setMeetingNotes({ ...meetingNotes, dueAt: e.target.value })} /><button className={`${primaryButton} mt-2`} disabled={busy || !meetingNotes.action.trim()} onClick={() => void run(async () => { await operationsApi.addMeetingAction(selectedMeeting.id, { text: meetingNotes.action, assigneeId: meetingNotes.assigneeId || undefined, dueAt: toIso(meetingNotes.dueAt), createTask: Boolean(meetingNotes.assigneeId && meetingNotes.dueAt) }); setMeetingNotes((v) => ({ ...v, action: '', assigneeId: '', dueAt: '' })); }, 'Meeting action recorded.')}>Record action{meetingNotes.assigneeId && meetingNotes.dueAt ? ' + task' : ''}</button></div></div>
            </div>
          </Panel>}
        </div>
      </div>}

      {!canOpenOperations && tab !== 'people' && <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">Your account can use self-service leave, but broader operations access has not been granted.</div>}
    </div>
  );
};
