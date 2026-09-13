import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LeaveRequestForm } from './LeaveRequestForm';
import { LeavePolicyManager } from './LeavePolicyManager';
import { LeaveBalancePanel } from './LeaveBalancePanel';
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
  type EmployeeHrRecordsDto,
  type EmployeeRowDto,
  type InternalProjectDto,
  type LeaveRequestDto,
  type MeetingDto,
  type PurchaseOrderDto,
  type PurchaseCategoryDto,
  type PurchaseReceiptDto,
  type PurchaseRequisitionDto,
  type VendorDto,
} from '../../lib/api/operations.api';
import { organizationApi, type BackendDepartment } from '../../lib/api/organization.api';
import { parseWorkspaceLocation } from '../../lib/routing/workspaceRoutes';

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
  const canDecideApprovals = hasUserPermission('approval.decide');
  const canAssets = hasUserPermission('assets.manage');
  const canManageOperations = hasUserPermission('operations.manage');

  const [tab, setTab] = useState<Tab>('people');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [employees, setEmployees] = useState<EmployeeRowDto[]>([]);
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [selectedHrEmployeeId, setSelectedHrEmployeeId] = useState('');
  const [hrRecords, setHrRecords] = useState<EmployeeHrRecordsDto | null>(null);
  const [hrRecordsLoading, setHrRecordsLoading] = useState(false);
  const [leave, setLeave] = useState<LeaveRequestDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisitionDto[]>([]);
  const [purchaseCategories, setPurchaseCategories] = useState<PurchaseCategoryDto[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [receipts, setReceipts] = useState<PurchaseReceiptDto[]>([]);
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
        ? Promise.all([operationsApi.vendors(), operationsApi.requisitions(), operationsApi.purchaseCategories(), operationsApi.orders(), operationsApi.receipts(), operationsApi.assets(), operationsApi.projects(), operationsApi.meetings()])
        : Promise.resolve([[], [], [], [], [], [], [], []] as [VendorDto[], PurchaseRequisitionDto[], PurchaseCategoryDto[], PurchaseOrderDto[], PurchaseReceiptDto[], AssetDto[], InternalProjectDto[], MeetingDto[]]);
      const departmentPromise = canHr ? organizationApi.listDepartments() : Promise.resolve([] as BackendDepartment[]);
      const [leaveRows, employeeRows, departmentRows, [vendorRows, requisitionRows, categoryRows, orderRows, receiptRows, assetRows, projectRows, meetingRows]] = await Promise.all([leavePromise, employeePromise, departmentPromise, operationalPromises]);
      setLeave(leaveRows); setEmployees(employeeRows); setVendors(vendorRows); setRequisitions(requisitionRows);
      setDepartments(departmentRows); setPurchaseCategories(categoryRows); setOrders(orderRows); setReceipts(receiptRows); setAssets(assetRows); setProjects(projectRows); setMeetings(meetingRows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load operations data.');
    } finally { setLoading(false); }
  }, [canHr, canOpenOperations]);

  useEffect(() => { void load(); }, [load]);

  const loadHrRecords = useCallback(async (userId: string) => {
    if (!userId || !canHr) return;
    setHrRecordsLoading(true);
    try {
      setHrRecords(await operationsApi.employeeRecords(userId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the employee HR register.');
    } finally { setHrRecordsLoading(false); }
  }, [canHr]);

  useEffect(() => { void loadHrRecords(selectedHrEmployeeId); }, [loadHrRecords, selectedHrEmployeeId]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(success); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed.'); }
    finally { setBusy(false); }
  }

  const [employeeForm, setEmployeeForm] = useState({ userId: '', employeeNumber: '', employmentType: 'FULL_TIME', startDate: '', managerUserId: '', leavePolicyKey: 'STANDARD', cpdsRequiredAnnual: '0', notes: '' });
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', branchId: '', managerId: '', costCentre: '' });
  const [vendorForm, setVendorForm] = useState({ name: '', kraPin: '', contactName: '', phone: '', email: '', address: '' });
  const [reqForm, setReqForm] = useState({ branchId: defaultBranchId, vendorId: '', categoryId: '', description: '', amount: '' });
  const [receiptReferences, setReceiptReferences] = useState<Record<string, string>>({});
  const [assetForm, setAssetForm] = useState({ branchId: defaultBranchId, category: 'ICT', name: '', serialNumber: '', purchaseCost: '', notes: '' });
  const [projectForm, setProjectForm] = useState({ branchId: defaultBranchId, name: '', description: '', ownerUserId: currentUser.id, dueDate: '', budget: '' });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectWork, setProjectWork] = useState({ milestoneTitle: '', milestoneDueAt: '', spendDescription: '', spendAmount: '', spendOccurredAt: '', spendReference: '' });
  const [projectLinks, setProjectLinks] = useState({ matterId: '', documentId: '' });
  const [meetingForm, setMeetingForm] = useState({ projectId: '', title: '', startsAt: '', endsAt: '', location: '', agenda: '', recurrenceRule: '', recurrenceUntil: '', participantUserIds: [] as string[] });
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [selectedMeetingParticipantIds, setSelectedMeetingParticipantIds] = useState<string[]>([]);
  const [meetingNotes, setMeetingNotes] = useState({ minutes: '', decision: '', decisionOwnerUserId: '', action: '', assigneeId: '', dueAt: '' });

  useEffect(() => {
    const applyDetailRoute = () => {
      const route = parseWorkspaceLocation(window.location.pathname, window.location.search);
      if (route.workspace !== 'operations') return;
      if (route.resourceType === 'project' && route.resourceId) { setTab('projects'); setSelectedProjectId(route.resourceId); }
      if (route.resourceType === 'meeting' && route.resourceId) { setTab('projects'); setSelectedMeetingId(route.resourceId); }
    };
    applyDetailRoute();
    window.addEventListener('popstate', applyDetailRoute);
    return () => window.removeEventListener('popstate', applyDetailRoute);
  }, []);

  useEffect(() => {
    if (defaultBranchId) {
      setReqForm((v) => v.branchId ? v : { ...v, branchId: defaultBranchId });
      setAssetForm((v) => v.branchId ? v : { ...v, branchId: defaultBranchId });
      setProjectForm((v) => v.branchId ? v : { ...v, branchId: defaultBranchId });
    }
  }, [defaultBranchId]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) ?? null;
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedHrEmployee = employees.find((employee) => employee.id === selectedHrEmployeeId) ?? null;
  const pendingLeave = leave.filter((row) => row.status === 'SUBMITTED').length;
  const pendingProcurement = requisitions.filter((row) => row.status === 'SUBMITTED').length;
  const assignedAssets = assets.filter((row) => row.status === 'ASSIGNED').length;
  const upcomingMeetings = meetings.filter((row) => new Date(row.startsAt) >= new Date()).length;

  const activeAssetAssignment = (asset: AssetDto) => asset.assignments?.find((assignment) => !assignment.returnedAt);

  useEffect(() => {
    setSelectedMeetingParticipantIds(selectedMeeting?.participants?.map((participant) => participant.userId) ?? []);
  }, [selectedMeeting?.id, selectedMeeting?.updatedAt]);
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
          <Panel title="Request leave" description="Preview your policy calendar and leave balance before submitting.">
            <LeaveRequestForm onSaved={load} />
          </Panel>
          {canHr && <Panel title="Leave policies and historical review"><LeavePolicyManager requests={leave} onSaved={load} /></Panel>}

          {canHr && <Panel title="Employee profile" description="Create or update the internal employment profile attached to a firm user.">
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
              if (!employeeForm.userId || !employeeForm.startDate) throw new Error('Choose the employee and start date.');
              await operationsApi.upsertEmployee(employeeForm.userId, {
                employeeNumber: employeeForm.employeeNumber || undefined,
                employmentType: employeeForm.employmentType,
                startDate: new Date(`${employeeForm.startDate}T00:00:00Z`).toISOString(),
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

          {canHr && <Panel title="Departments" description="Departments and managers are persisted to the firm organization record.">
            <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!departmentForm.name.trim() || !departmentForm.code.trim()) throw new Error('Department name and code are required.'); await organizationApi.createDepartment({ name: departmentForm.name.trim(), code: departmentForm.code.trim(), branchId: departmentForm.branchId || undefined, managerId: departmentForm.managerId || undefined, costCentre: departmentForm.costCentre.trim() || undefined }); setDepartmentForm({ name: '', code: '', branchId: '', managerId: '', costCentre: '' }); }, 'Department created.'); }}><div className="grid grid-cols-2 gap-2"><input className={inputClass} placeholder="Department name" value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} /><input className={inputClass} placeholder="Code" value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value.toUpperCase() })} /></div><select className={inputClass} value={departmentForm.branchId} onChange={(event) => setDepartmentForm({ ...departmentForm, branchId: event.target.value })}><option value="">Firm-wide department</option>{branches.filter((branch) => branch.isActive).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><select className={inputClass} value={departmentForm.managerId} onChange={(event) => setDepartmentForm({ ...departmentForm, managerId: event.target.value })}><option value="">No manager</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select><input className={inputClass} placeholder="Cost centre (optional)" value={departmentForm.costCentre} onChange={(event) => setDepartmentForm({ ...departmentForm, costCentre: event.target.value })} /><button className={primaryButton} disabled={busy}>Create department</button></form><div className="mt-4 space-y-2">{departments.map((department) => <div key={department.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-xs"><div><div className="font-medium text-slate-200">{department.name} <span className="font-mono text-slate-500">{department.code}</span></div><div className="text-slate-500">Manager</div></div><div className="flex items-center gap-2"><select className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" value={department.managerId || ''} disabled={busy} onChange={(event) => void run(() => organizationApi.updateDepartment(department.id, { managerId: event.target.value || null }), 'Department manager updated.')}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select><Status value={department.active ? 'ACTIVE' : 'INACTIVE'} /></div></div>)}{!departments.length && <p className="py-2 text-xs text-slate-500">No departments configured.</p>}</div>
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
                  {canHr && row.status === 'SUBMITTED' && row.userId !== currentUser.id && <><button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideLeave(row.id, 'APPROVED', row.revision), 'Leave approved.')}>Approve</button><button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideLeave(row.id, 'REJECTED', row.revision), 'Leave rejected.')}>Reject</button></>}
                  {(row.userId === currentUser.id || canHr) && ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(row.status) && <button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.cancelLeave(row.id, row.revision), 'Leave cancelled.')}>Cancel</button>}
                </div>
              </div>)}
            </div>
          </Panel>

          {canHr && <Panel title="Employment register" description="Select an employee to view the server-backed HR record. Restricted notes remain an HR-only view.">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="text-slate-500"><tr><th className="pb-2">Employee</th><th>Number</th><th>Type</th><th>Start</th><th>Status</th><th /></tr></thead><tbody>{employees.map((row) => <tr key={row.id} className={`border-t border-slate-800 ${selectedHrEmployeeId === row.id ? 'bg-amber-950/20' : ''}`}><td className="py-2.5"><div className="font-medium text-slate-200">{row.fullName}</div><div className="text-slate-500">{row.jobTitle || row.email}</div></td><td>{row.employeeProfile?.employeeNumber || 'Not profiled'}</td><td>{row.employeeProfile?.employmentType || '—'}</td><td>{day(row.employeeProfile?.startDate)}</td><td><Status value={row.employeeProfile?.employmentStatus || row.status} /></td><td><button className={secondaryButton} onClick={() => setSelectedHrEmployeeId(row.id)}>View record</button></td></tr>)}</tbody></table></div>
          </Panel>}

          {canHr && selectedHrEmployee && <Panel title={`${selectedHrEmployee.fullName} — HR record`} description="Lifecycle, CPD, credentials, leave balances and staff-document metadata are loaded from the authoritative HR register." action={<button className={secondaryButton} disabled={hrRecordsLoading} onClick={() => void loadHrRecords(selectedHrEmployee.id)}><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Refresh record</button>}>
            {hrRecordsLoading ? <p className="py-5 text-center text-sm text-slate-400">Loading employee record…</p> : !hrRecords ? <p className="py-5 text-center text-sm text-slate-500">No HR record loaded.</p> : <div className="grid gap-4 text-xs md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="mb-2 font-semibold text-slate-200">Lifecycle</div>{hrRecords.lifecycle.length ? hrRecords.lifecycle.map((item) => <div key={item.id} className="border-t border-slate-800 py-2"><div className="flex justify-between gap-2"><span>{item.title}</span><Status value={item.status} /></div><div className="mt-1 text-slate-500">{item.lifecycle.toLowerCase()} · due {day(item.dueAt)}</div></div>) : <span className="text-slate-500">No lifecycle items.</span>}</div>
              <LeaveBalancePanel userId={selectedHrEmployeeId} policyKey={hrRecords.profile?.leavePolicyKey} />
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="mb-2 font-semibold text-slate-200">CPD & credentials</div>{[...hrRecords.cpd.map((record) => ({ id: `cpd-${record.id}`, title: `${record.title} (${String(record.hours)}h)`, detail: `${record.provider || 'Provider not recorded'} · ${day(record.occurredOn)}` })), ...hrRecords.credentials.map((credential) => ({ id: `credential-${credential.id}`, title: credential.admissionNumber, detail: `${credential.status} · certificate expiry ${day(credential.certificateExpiresAt)}` }))].map((record) => <div key={record.id} className="border-t border-slate-800 py-2"><div>{record.title}</div><div className="text-slate-500">{record.detail}</div></div>)}{!hrRecords.cpd.length && !hrRecords.credentials.length && <span className="text-slate-500">No CPD or credential records.</span>}</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="mb-2 font-semibold text-slate-200">Staff documents</div>{hrRecords.documents.length ? hrRecords.documents.map((document) => <div key={document.id} className="border-t border-slate-800 py-2"><div>{document.title} <Status value={document.storageState} /></div><div className="text-slate-500">{document.category} · expiry {day(document.expiresAt)}{document.externalReference ? ` · ${document.externalReference}` : ''}</div></div>) : <span className="text-slate-500">No staff-document metadata. Files are not uploaded by this screen.</span>}</div>
              <div className="rounded-lg border border-amber-900/60 bg-amber-950/15 p-3 md:col-span-2"><div className="mb-2 font-semibold text-amber-200">Restricted HR notes</div>{hrRecords.notes.length ? hrRecords.notes.map((note) => <div key={note.id} className="border-t border-amber-900/40 py-2"><div>{note.category}</div><div className="mt-1 whitespace-pre-wrap text-slate-300">{note.body}</div></div>) : <span className="text-slate-500">No restricted notes.</span>}</div>
            </div>}
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
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!reqForm.branchId || !reqForm.description || !reqForm.amount) throw new Error('Complete branch, description and amount.'); await operationsApi.createRequisition({ branchId: reqForm.branchId, vendorId: reqForm.vendorId || undefined, categoryId: reqForm.categoryId || undefined, description: reqForm.description, amount: Number(reqForm.amount), idempotencyKey: crypto.randomUUID() }); setReqForm({ ...reqForm, description: '', amount: '' }); }, 'Purchase requisition submitted.'); }}>
              <label className="block text-xs text-slate-400">Branch<select className={inputClass} value={reqForm.branchId} onChange={(e) => setReqForm({ ...reqForm, branchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
              <label className="block text-xs text-slate-400">Preferred vendor<select className={inputClass} value={reqForm.vendorId} onChange={(e) => setReqForm({ ...reqForm, vendorId: e.target.value })}><option value="">Choose later</option>{vendors.filter((vendor) => vendor.active).map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
              <label className="block text-xs text-slate-400">Purchase category<select className={inputClass} value={reqForm.categoryId} onChange={(e) => setReqForm({ ...reqForm, categoryId: e.target.value })}><option value="">Uncategorised</option>{purchaseCategories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}{category.approvalThreshold ? ` · threshold ${money(category.approvalThreshold)}` : ''}</option>)}</select></label>
              <textarea className={`${inputClass} min-h-24`} placeholder="What is being purchased and why?" value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} />
              <input type="number" min="1" className={inputClass} placeholder="Amount KES" value={reqForm.amount} onChange={(e) => setReqForm({ ...reqForm, amount: e.target.value })} />
              <button className={primaryButton} disabled={busy}>Submit requisition</button>
            </form>
          </Panel>}
        </div>

        <div className="space-y-5">
          <Panel title="Requisitions" description="Approval and order creation remain separate audited states.">
            <div className="space-y-2">{requisitions.map((row) => <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-mono text-xs text-amber-400">{row.requisitionNo}</div><div className="font-semibold">{row.description}</div><div className="text-xs text-slate-500">{row.vendor?.name || 'Vendor not assigned'} · {money(row.amount)}</div></div><Status value={row.status} /></div>{(canProcurement || canDecideApprovals) && <div className="mt-3 flex flex-wrap gap-2">{canDecideApprovals && row.status === 'SUBMITTED' && row.requestedById !== currentUser.id && <><button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideRequisition(row.id, 'APPROVED'), 'Requisition approved.')}>Approve</button><button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.decideRequisition(row.id, 'REJECTED'), 'Requisition rejected.')}>Reject</button></>}{canProcurement && row.status === 'APPROVED' && row.vendorId && <button className={primaryButton} disabled={busy} onClick={() => void run(() => operationsApi.createOrder(row.id), 'Purchase order created.')}>Create PO</button>}</div>}</div>)}{!requisitions.length && <p className="py-8 text-center text-sm text-slate-500">No purchase requisitions.</p>}</div>
          </Panel>

          <Panel title="Purchase orders">
            <div className="space-y-2">{orders.map((order) => { const reference = receiptReferences[order.id] || ''; return <div key={order.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-mono text-xs text-amber-400">{order.orderNo}</div><div className="font-semibold">{order.vendor?.name || order.description}</div><div className="text-xs text-slate-500">{money(order.amount)} · ordered {day(order.orderedAt)}</div></div><Status value={order.status} /></div>{canProcurement && ['ORDERED', 'PARTIALLY_RECEIVED'].includes(order.status) && <div className="mt-3 space-y-2"><input className={inputClass} placeholder="Delivery note, GRN, or manual receipt reference" value={reference} onChange={(event) => setReceiptReferences((values) => ({ ...values, [order.id]: event.target.value }))} /><div className="flex gap-2"><button className={secondaryButton} disabled={busy || reference.trim().length < 2} onClick={() => void run(() => operationsApi.receiveOrder(order.id, { partial: true, deliveryReference: reference.trim(), idempotencyKey: crypto.randomUUID() }), 'Partial receipt recorded with delivery evidence.')}>Partial receipt</button><button className={primaryButton} disabled={busy || reference.trim().length < 2} onClick={() => void run(async () => { await operationsApi.receiveOrder(order.id, { deliveryReference: reference.trim(), idempotencyKey: crypto.randomUUID() }); setReceiptReferences((values) => ({ ...values, [order.id]: '' })); }, 'Purchase order received with delivery evidence.')}>Receive in full</button></div></div>}</div>; })}{!orders.length && <p className="py-8 text-center text-sm text-slate-500">No purchase orders.</p>}</div>
          </Panel>
          <Panel title="Receipt register" description="A recorded delivery reference can create one asset or one submitted expense request. Neither action records payment.">
            <div className="space-y-2">{receipts.map((receipt) => <div key={receipt.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-mono text-xs text-amber-400">{receipt.deliveryReference}</div><div className="font-semibold">{receipt.purchaseOrder.description}</div><div className="text-xs text-slate-500">{receipt.purchaseOrder.orderNo} · {day(receipt.receivedAt)} · {money(receipt.purchaseOrder.amount)}</div></div><Status value={receipt.partial ? 'PARTIALLY_RECEIVED' : 'RECEIVED'} /></div><div className="mt-3 flex flex-wrap gap-2">{receipt.asset ? <span className="text-xs text-emerald-300">Asset: {receipt.asset.assetTag}</span> : canAssets ? <button className={secondaryButton} disabled={busy} onClick={() => { const name = window.prompt('Asset name'); const category = window.prompt('Asset category', 'ICT'); if (name && category) void run(() => operationsApi.createAssetFromReceipt(receipt.id, { name, category }), 'Asset created from recorded receipt.'); }}>Create asset</button> : null}{receipt.expense ? <span className="text-xs text-amber-300">Expense: {receipt.expense.expenseNumber} ({receipt.expense.status})</span> : canProcurement && hasUserPermission('finance.expense_create') ? <button className={secondaryButton} disabled={busy} onClick={() => { const category = window.prompt('Expense category', 'Procurement'); const paymentSource = window.prompt('Payment source', 'OFFICE_FUNDS'); if (category && paymentSource) void run(() => operationsApi.createExpenseFromReceipt(receipt.id, { category, paymentSource }), 'Submitted finance expense created from receipt.'); }}>Create expense request</button> : <span className="text-xs text-slate-500">Finance expense permission required for expense creation.</span>}</div></div>)}{!receipts.length && <p className="py-8 text-center text-sm text-slate-500">No delivery receipts recorded.</p>}</div>
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
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!meetingForm.title || !meetingForm.startsAt) throw new Error('Meeting title and start time are required.'); await operationsApi.createMeeting({ projectId: meetingForm.projectId || undefined, title: meetingForm.title, startsAt: toIso(meetingForm.startsAt)!, endsAt: toIso(meetingForm.endsAt), location: meetingForm.location || undefined, agenda: meetingForm.agenda ? { text: meetingForm.agenda } : undefined, recurrenceRule: meetingForm.recurrenceRule || undefined, recurrenceUntil: toIso(meetingForm.recurrenceUntil), participantUserIds: meetingForm.participantUserIds }); setMeetingForm({ projectId: '', title: '', startsAt: '', endsAt: '', location: '', agenda: '', recurrenceRule: '', recurrenceUntil: '', participantUserIds: [] }); }, 'Meeting scheduled.'); }}>
              <label className="block text-xs text-slate-400">Project<select className={inputClass} value={meetingForm.projectId} onChange={(e) => setMeetingForm({ ...meetingForm, projectId: e.target.value })}><option value="">Standalone meeting</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <input className={inputClass} placeholder="Meeting title" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3"><input type="datetime-local" className={inputClass} value={meetingForm.startsAt} onChange={(e) => setMeetingForm({ ...meetingForm, startsAt: e.target.value })} /><input type="datetime-local" className={inputClass} value={meetingForm.endsAt} onChange={(e) => setMeetingForm({ ...meetingForm, endsAt: e.target.value })} /></div>
              <input className={inputClass} placeholder="Location / room" value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} />
              <input className={inputClass} placeholder="Recurrence rule (metadata only, e.g. FREQ=WEEKLY)" value={meetingForm.recurrenceRule} onChange={(e) => setMeetingForm({ ...meetingForm, recurrenceRule: e.target.value })} />
              <label className="block text-xs text-slate-400">Recurrence ends (optional)<input type="datetime-local" className={`${inputClass} mt-1`} value={meetingForm.recurrenceUntil} onChange={(e) => setMeetingForm({ ...meetingForm, recurrenceUntil: e.target.value })} /></label>
              <textarea className={`${inputClass} min-h-20`} placeholder="Agenda" value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} />
              <label className="block text-xs text-slate-400">Participants (optional; use Ctrl/Cmd to select multiple)<select multiple className={`${inputClass} mt-1 min-h-28`} value={meetingForm.participantUserIds} onChange={(event) => setMeetingForm({ ...meetingForm, participantUserIds: Array.from(event.currentTarget.selectedOptions, (option) => option.value) })}>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
              <button className={primaryButton} disabled={busy}>Schedule meeting</button>
            </form>
          </Panel>}
        </div>

        <div className="space-y-5">
          <Panel title="Projects"><div className="grid gap-2 sm:grid-cols-2">{projects.map((project) => <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-start justify-between"><div><div className="font-semibold">{project.name}</div><div className="text-xs text-slate-500">Due {day(project.dueDate)} · {money(project.budget)}</div></div><Status value={project.status} /></div>{project.description && <p className="mt-2 text-xs text-slate-400 line-clamp-3">{project.description}</p>}</div>)}{!projects.length && <p className="col-span-full py-6 text-center text-sm text-slate-500">No internal projects.</p>}</div></Panel>

          <Panel title="Project status board" description="Status is loaded from the persisted project record; select a card to manage it."><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const).map((status) => <div key={status} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="mb-3 flex items-center justify-between"><Status value={status} /><span className="text-xs text-slate-500">{projects.filter((project) => project.status === status).length}</span></div><div className="space-y-2">{projects.filter((project) => project.status === status).map((project) => <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`w-full rounded-lg border p-2 text-left text-xs ${selectedProjectId === project.id ? 'border-amber-600 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'}`}><div className="font-medium text-slate-200">{project.name}</div><div className="mt-1 text-slate-500">Due {day(project.dueDate)}</div></button>)}{!projects.some((project) => project.status === status) && <p className="py-2 text-xs text-slate-600">None</p>}</div></div>)}</div></Panel>

          {canManageOperations && <Panel title="Project board" description="Milestones and manual spend are persisted to the selected project.">
            <div className="space-y-4">
              <label className="block text-xs text-slate-400">Project<select className={inputClass} value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              {!selectedProject && <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">{selectedProjectId ? 'This project is unavailable or no longer exists.' : 'Select a project to view and update its persisted milestones and spend register.'}</p>}
              {selectedProject && <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400"><Status value={selectedProject.status} /><span>{selectedProject.milestones?.length || 0} milestones</span><span>{selectedProject.spend?.length || 0} spend entries</span><label className="ml-auto flex items-center gap-2">Status<select className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" value={selectedProject.status} disabled={busy} onChange={(event) => void run(() => operationsApi.setProjectStatus(selectedProject.id, event.target.value as 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'), 'Project status updated.')}><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label></div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <form className="rounded-xl border border-slate-800 p-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!projectWork.milestoneTitle.trim()) throw new Error('Milestone title is required.'); await operationsApi.addProjectMilestone(selectedProject.id, { title: projectWork.milestoneTitle.trim(), dueAt: toIso(projectWork.milestoneDueAt) }); setProjectWork((current) => ({ ...current, milestoneTitle: '', milestoneDueAt: '' })); }, 'Milestone recorded.'); }}>
                    <div className="mb-2 text-xs font-semibold text-slate-200">Add milestone</div>
                    <input className={inputClass} placeholder="Milestone title" value={projectWork.milestoneTitle} onChange={(event) => setProjectWork((current) => ({ ...current, milestoneTitle: event.target.value }))} />
                    <input type="datetime-local" className={`${inputClass} mt-2`} value={projectWork.milestoneDueAt} onChange={(event) => setProjectWork((current) => ({ ...current, milestoneDueAt: event.target.value }))} />
                    <button className={`${primaryButton} mt-2`} disabled={busy}>Record milestone</button>
                  </form>
                  <form className="rounded-xl border border-slate-800 p-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { const amount = Number(projectWork.spendAmount); if (!projectWork.spendDescription.trim() || !Number.isFinite(amount) || amount <= 0 || !projectWork.spendOccurredAt) throw new Error('Description, a positive amount, and the date are required.'); await operationsApi.recordProjectSpend(selectedProject.id, { description: projectWork.spendDescription.trim(), amount, occurredAt: toIso(projectWork.spendOccurredAt)!, financeReference: projectWork.spendReference.trim() || undefined }); setProjectWork((current) => ({ ...current, spendDescription: '', spendAmount: '', spendOccurredAt: '', spendReference: '' })); }, 'Manual project spend recorded.'); }}>
                    <div className="mb-2 text-xs font-semibold text-slate-200">Record manual spend</div>
                    <input className={inputClass} placeholder="Description" value={projectWork.spendDescription} onChange={(event) => setProjectWork((current) => ({ ...current, spendDescription: event.target.value }))} />
                    <div className="mt-2 grid grid-cols-2 gap-2"><input type="number" min="0.01" step="0.01" className={inputClass} placeholder="Amount KES" value={projectWork.spendAmount} onChange={(event) => setProjectWork((current) => ({ ...current, spendAmount: event.target.value }))} /><input type="datetime-local" className={inputClass} value={projectWork.spendOccurredAt} onChange={(event) => setProjectWork((current) => ({ ...current, spendOccurredAt: event.target.value }))} /></div>
                    <input className={`${inputClass} mt-2`} placeholder="Manual finance/reference number (optional)" value={projectWork.spendReference} onChange={(event) => setProjectWork((current) => ({ ...current, spendReference: event.target.value }))} />
                    <button className={`${primaryButton} mt-2`} disabled={busy}>Record spend</button>
                  </form>
                </div>
                <div className="grid gap-3 lg:grid-cols-2"><form className="rounded-xl border border-slate-800 p-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!projectLinks.matterId.trim()) throw new Error('Matter ID is required.'); await operationsApi.linkProjectMatter(selectedProject.id, projectLinks.matterId.trim()); setProjectLinks((current) => ({ ...current, matterId: '' })); }, 'Matter linked to project.'); }}><div className="mb-2 text-xs font-semibold text-slate-200">Link authorized matter</div><input className={inputClass} placeholder="Matter ID" value={projectLinks.matterId} onChange={(event) => setProjectLinks((current) => ({ ...current, matterId: event.target.value }))} /><button className={`${secondaryButton} mt-2`} disabled={busy}>Link matter</button></form><form className="rounded-xl border border-slate-800 p-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (!projectLinks.documentId.trim()) throw new Error('Document ID is required.'); await operationsApi.linkProjectDocument(selectedProject.id, projectLinks.documentId.trim()); setProjectLinks((current) => ({ ...current, documentId: '' })); }, 'Document linked to project.'); }}><div className="mb-2 text-xs font-semibold text-slate-200">Link authorized document</div><input className={inputClass} placeholder="Document ID" value={projectLinks.documentId} onChange={(event) => setProjectLinks((current) => ({ ...current, documentId: event.target.value }))} /><button className={`${secondaryButton} mt-2`} disabled={busy}>Link document</button></form></div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold text-slate-200">Milestones</div><div className="space-y-2">{selectedProject.milestones?.map((milestone) => <div key={milestone.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 p-2 text-xs"><div><div className="font-medium text-slate-200">{milestone.title}</div><div className="text-slate-500">Due {dateTime(milestone.dueAt)}</div></div><div className="flex items-center gap-2"><Status value={milestone.status} />{milestone.status !== 'COMPLETED' && <button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.completeProjectMilestone(milestone.id), 'Milestone completed.')}>Complete</button>}</div></div>)}{!selectedProject.milestones?.length && <p className="py-3 text-xs text-slate-500">No milestones recorded.</p>}</div></div>
                  <div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold text-slate-200">Manual spend register</div><p className="mb-2 text-xs text-slate-500">These are operational entries, not finance-posted amounts.</p><div className="space-y-2">{selectedProject.spend?.map((spend) => <div key={spend.id} className="rounded-lg bg-slate-950/60 p-2 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-medium text-slate-200">{spend.description}</span><span className="text-amber-300">{money(spend.amount)}</span></div><div className="mt-1 text-slate-500">{dateTime(spend.occurredAt)} · {spend.source}{spend.financeReference ? ` · Ref ${spend.financeReference}` : ''}</div></div>)}{!selectedProject.spend?.length && <p className="py-3 text-xs text-slate-500">No manual spend recorded.</p>}</div></div>
                </div>
              </>}
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Attendance</div><div className="space-y-2">{selectedMeeting.participants?.map((participant) => <div key={participant.userId} className="flex items-center justify-between gap-2 text-xs"><span className="text-slate-300">{participant.user?.fullName || participant.userId}</span><select className="w-28 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" value={participant.attendanceStatus || ''} onChange={(event) => { if (event.target.value) void run(() => operationsApi.setMeetingAttendance(selectedMeeting.id, participant.userId, event.target.value as 'PRESENT' | 'ABSENT' | 'APOLOGY' | 'LATE'), 'Attendance recorded.'); }}><option value="">Not marked</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="APOLOGY">Apology</option><option value="LATE">Late</option></select></div>)}{!selectedMeeting.participants?.length && <p className="py-2 text-xs text-slate-500">No persisted participants. Add them when scheduling or editing the meeting.</p>}</div></div>
                <div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Recorded actions</div><div className="space-y-2">{selectedMeeting.actions?.map((action) => <div key={action.id} className="flex items-center justify-between gap-2 text-xs"><div><div className="text-slate-300">{action.text}</div><div className="text-slate-500">Due {dateTime(action.dueAt)}{action.taskId ? ' · Task linked' : ''}</div></div><div className="flex items-center gap-2"><Status value={action.status} />{action.status !== 'COMPLETED' && <button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.completeMeetingAction(action.id), 'Meeting action completed.')}>Complete</button>}</div></div>)}{!selectedMeeting.actions?.length && <p className="py-2 text-xs text-slate-500">No actions recorded.</p>}</div></div>
              </div>
            </div>
          </Panel>}

          <Panel title="Meeting register" description="Select a meeting to capture minutes, decisions and task-backed actions.">
            <div className="space-y-2">{meetings.map((meeting) => <button key={meeting.id} onClick={() => setSelectedMeetingId(meeting.id)} className={`w-full rounded-xl border p-3 text-left ${selectedMeetingId === meeting.id ? 'border-amber-600 bg-amber-950/20' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}><div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-slate-100">{meeting.title}</div><div className="text-xs text-slate-500">{dateTime(meeting.startsAt)} · {meeting.location || 'No location'}</div></div><Status value={meeting.status} /></div><div className="mt-2 flex gap-3 text-[11px] text-slate-500"><span>{meeting.decisions?.length || 0} decisions</span><span>{meeting.actions?.length || 0} actions</span></div></button>)}{!meetings.length && <p className="py-8 text-center text-sm text-slate-500">No meetings scheduled.</p>}</div>
          </Panel>

          {selectedMeetingId && !selectedMeeting && <p className="rounded-xl border border-slate-700 bg-slate-950/45 p-4 text-sm text-slate-400">This meeting is unavailable or no longer exists.</p>}
          {selectedMeeting && canManageOperations && <Panel title={`Minutes · ${selectedMeeting.title}`} action={<button className={secondaryButton} onClick={() => setSelectedMeetingId('')}>Close</button>}>
            <div className="space-y-4">
              <label className="block text-xs text-slate-400">Minutes<textarea className={`${inputClass} min-h-28`} value={meetingNotes.minutes} onChange={(e) => setMeetingNotes({ ...meetingNotes, minutes: e.target.value })} placeholder="Record discussion, resolutions and context." /></label>
              <div className="flex flex-wrap gap-2"><button className={primaryButton} disabled={busy || !meetingNotes.minutes.trim()} onClick={() => void run(() => operationsApi.updateMeeting(selectedMeeting.id, { minutes: { text: meetingNotes.minutes }, status: 'COMPLETED' }), 'Meeting minutes saved and meeting completed.')}>Save minutes & complete</button></div>
              <div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Participants</div><select multiple className={`${inputClass} min-h-28`} value={selectedMeetingParticipantIds} onChange={(event) => setSelectedMeetingParticipantIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select><div className="mt-2 flex flex-wrap items-center gap-2"><button className={secondaryButton} disabled={busy} onClick={() => void run(() => operationsApi.updateMeeting(selectedMeeting.id, { participantUserIds: selectedMeetingParticipantIds }), 'Meeting participants saved.')}>Save participants</button><span className="text-xs text-slate-500">Unchanged participants retain their recorded attendance.</span></div></div>
              <div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Recorded decisions</div><div className="space-y-2">{selectedMeeting.decisions?.map((decision) => <div key={decision.id} className="rounded-lg bg-slate-950/60 p-2 text-xs"><div className="text-slate-200">{decision.text}</div><div className="mt-1 text-slate-500">Owner: {decision.ownerUserId ? users.find((user) => user.id === decision.ownerUserId)?.fullName || decision.ownerUserId : 'Unassigned'} · {dateTime(decision.createdAt)}</div></div>)}{!selectedMeeting.decisions?.length && <p className="py-2 text-xs text-slate-500">No decisions recorded.</p>}</div></div>
              <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Decision</div><textarea className={`${inputClass} min-h-20`} value={meetingNotes.decision} onChange={(e) => setMeetingNotes({ ...meetingNotes, decision: e.target.value })} /><select className={`${inputClass} mt-2`} value={meetingNotes.decisionOwnerUserId} onChange={(e) => setMeetingNotes({ ...meetingNotes, decisionOwnerUserId: e.target.value })}><option value="">No decision owner</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select><button className={`${primaryButton} mt-2`} disabled={busy || !meetingNotes.decision.trim()} onClick={() => void run(async () => { await operationsApi.addMeetingDecision(selectedMeeting.id, { text: meetingNotes.decision, ownerUserId: meetingNotes.decisionOwnerUserId || undefined }); setMeetingNotes((v) => ({ ...v, decision: '', decisionOwnerUserId: '' })); }, 'Decision recorded.')}>Record decision</button></div><div className="rounded-xl border border-slate-800 p-3"><div className="mb-2 text-xs font-semibold">Action</div><textarea className={`${inputClass} min-h-20`} value={meetingNotes.action} onChange={(e) => setMeetingNotes({ ...meetingNotes, action: e.target.value })} /><select className={`${inputClass} mt-2`} value={meetingNotes.assigneeId} onChange={(e) => setMeetingNotes({ ...meetingNotes, assigneeId: e.target.value })}><option value="">No assignee</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select><input type="datetime-local" className={`${inputClass} mt-2`} value={meetingNotes.dueAt} onChange={(e) => setMeetingNotes({ ...meetingNotes, dueAt: e.target.value })} /><button className={`${primaryButton} mt-2`} disabled={busy || !meetingNotes.action.trim()} onClick={() => void run(async () => { await operationsApi.addMeetingAction(selectedMeeting.id, { text: meetingNotes.action, assigneeId: meetingNotes.assigneeId || undefined, dueAt: toIso(meetingNotes.dueAt), createTask: Boolean(meetingNotes.assigneeId && meetingNotes.dueAt) }); setMeetingNotes((v) => ({ ...v, action: '', assigneeId: '', dueAt: '' })); }, 'Meeting action recorded.')}>Record action{meetingNotes.assigneeId && meetingNotes.dueAt ? ' + task' : ''}</button></div></div>
            </div>
          </Panel>}
        </div>
      </div>}

      {!canOpenOperations && tab !== 'people' && <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">Your account can use self-service leave, but broader operations access has not been granted.</div>}
    </div>
  );
};
