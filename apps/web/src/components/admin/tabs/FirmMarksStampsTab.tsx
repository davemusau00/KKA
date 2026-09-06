import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '../../../lib/api/client';
import { apiUrl } from '../../../config/runtime';
import { useBranding } from '../../../context/BrandingContext';
interface Version { id: string; version: number; active?: boolean; createdAt: string }
interface Mark { id: string; displayName: string; type: string; description?: string; active: boolean; branchId?: string; versions: Version[]; permittedRoleKeys: string[]; permittedUserIds: string[]; allowedDocumentTypes: string[]; allowedMatterTypes: string[]; requiresApproval: boolean; approvalRoleKeys: string[]; effectiveFrom?: string; effectiveTo?: string; minRotationDegrees?: number; maxRotationDegrees?: number; minOpacity?: number }
interface Signature { id: string; userId: string; professionalDisplayName: string; approvalStatus: string; typedSignatureAllowed: boolean; versions: Version[]; delegationsFrom: Array<{id:string;delegateUserId:string;endsAt:string;revokedAt?:string}> }
const types = ['LOGO','FIRM_SEAL','BRANCH_SEAL','RECEIVED_STAMP','PAID_STAMP','APPROVED_STAMP','CERTIFIED_COPY_STAMP','CONFIDENTIAL_STAMP','DRAFT_STAMP','COPY_STAMP','INTERNAL_REVIEW_STAMP','CUSTOM_OPERATIONAL_MARK'];
const words = (s: string) => s.toLowerCase().replaceAll('_',' ');
const split = (s: string) => s.split(',').map(v => v.trim()).filter(Boolean);
export function FirmMarksStampsTab() {
  const { canManage } = useBranding();
  const [marks, setMarks] = useState<Mark[]>([]), [signatures, setSignatures] = useState<Signature[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; fullName: string }>>([]), [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [section, setSection] = useState('marks');
  const [edit, setEdit] = useState<Mark | null>(null), [name, setName] = useState(''), [type, setType] = useState('LOGO');
  const [branch, setBranch] = useState(''), [roles, setRoles] = useState(''), [allowedUsers, setAllowedUsers] = useState<string[]>([]), [docTypes, setDocTypes] = useState(''), [matterTypes, setMatterTypes] = useState('');
  const [approval, setApproval] = useState(false), [approvalRoles, setApprovalRoles] = useState('managing_partner'), [from, setFrom] = useState(''), [to, setTo] = useState('');
  const [file, setFile] = useState<File | null>(null), [sigUser, setSigUser] = useState(''), [sigName, setSigName] = useState('');
  const [sigId, setSigId] = useState(''), [sigMode, setSigMode] = useState('upload'), [typed, setTyped] = useState('');
  const [minRotation,setMinRotation]=useState('0'),[maxRotation,setMaxRotation]=useState('0'),[minOpacity,setMinOpacity]=useState('0.2');
  const [delegate, setDelegate] = useState(''), [delegateEnd, setDelegateEnd] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null), drawing = useRef(false);
  async function load() { const [m,s,u,b] = await Promise.all([apiClient.get<Mark[]>('/marks'), apiClient.get<Signature[]>('/marks/signature-profiles'), apiClient.get<typeof users>('/users'), apiClient.get<typeof branches>('/organization/branches')]); setMarks(m); setSignatures(s); setUsers(u); setBranches(b); }
  useEffect(() => { load().catch(e => setMessage(e.message)); }, []);
  async function run(action: () => Promise<unknown>) { setBusy(true); setMessage(''); try { await action(); await load(); setMessage('Saved on server.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); } }
  function startEdit(m: Mark) { setEdit(m); setName(m.displayName); setType(m.type); setBranch(m.branchId || ''); setRoles(m.permittedRoleKeys.join(', ')); setAllowedUsers(m.permittedUserIds); setDocTypes(m.allowedDocumentTypes.join(', ')); setMatterTypes(m.allowedMatterTypes.join(', ')); setApproval(m.requiresApproval); setApprovalRoles(m.approvalRoleKeys.join(', ')); setFrom(m.effectiveFrom?.slice(0,16) || ''); setTo(m.effectiveTo?.slice(0,16) || ''); setFile(null); setMinRotation(String(m.minRotationDegrees??0));setMaxRotation(String(m.maxRotationDegrees??0));setMinOpacity(String(m.minOpacity??0.2)); }
  async function saveMark() {
    const config = { minRotationDegrees:Number(minRotation),maxRotationDegrees:Number(maxRotation),minOpacity:Number(minOpacity),displayName: name, branchId: branch || null, permittedRoleKeys: split(roles), permittedUserIds: allowedUsers, allowedDocumentTypes: split(docTypes), allowedMatterTypes: split(matterTypes), requiresApproval: approval, approvalRoleKeys: approval ? split(approvalRoles) : [], effectiveFrom: from ? new Date(from).toISOString() : null, effectiveTo: to ? new Date(to).toISOString() : null };
    let id = edit?.id;
    if (!id) { const created = await apiClient.post<Mark>('/marks', { ...config, branchId: branch || undefined, type, description: 'Uploaded firm artwork', intendedUse: 'Document branding and controlled application' }); id = created.id; setEdit({...created,versions:[]}); }
    await apiClient.patch(`/marks/${id}`, config);
    if (file) { const data = new FormData(); data.append('file', file); await apiClient.post(`/marks/${id}/versions`, data); }
    setFile(null); setEdit(null); setName('');
  }
  async function uploadSignature() {
    let asset = file;
    if (sigMode !== 'upload') {
      const c = canvas.current!;
      if (sigMode === 'typed') { const ctx = c.getContext('2d')!; ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle = '#152238'; ctx.font = 'italic 42px Georgia'; ctx.fillText(typed, 15, 75, 565); }
      const blob = await new Promise<Blob | null>(resolve => c.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not capture signature');
      asset = new File([blob], 'signature.png', { type: 'image/png' });
    }
    if (!asset) throw new Error('Choose or create a signature image');
    const data = new FormData(); data.append('file', asset); await apiClient.post(`/marks/signature-profiles/${sigId}/assets`, data); setFile(null);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) { const c = e.currentTarget, ctx = c.getContext('2d')!, rect = c.getBoundingClientRect(); const x = (e.clientX - rect.left) * c.width / rect.width, y = (e.clientY - rect.top) * c.height / rect.height; if (e.type === 'pointerdown') { drawing.current = true; c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(x,y); } else if (drawing.current) { ctx.strokeStyle='#152238'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineTo(x,y); ctx.stroke(); } }
  const input = (label: string, value: string, set: (s:string)=>void, kind='text') => <label className="block text-sm">{label}<input className="admin-input mt-1" type={kind} value={value} onChange={e=>set(e.target.value)} /></label>;
  return <div className="admin-tab-content space-y-5">
    <h2 className="admin-section-title">Firm artwork & signature representations</h2>
    <p className="text-sm">Files are versioned and stored privately. Applying an image creates a new draft document; it is not certificate-based signing.</p>
    <div className="flex gap-2"><button className="admin-btn-secondary" onClick={()=>setSection('marks')}>Logos & stamps</button><button className="admin-btn-secondary" onClick={()=>setSection('signatures')}>Signatures</button></div>
    <p role="status">{busy ? 'Saving…' : message}</p>
    {section === 'marks' ? <>
      <div className="grid gap-3 md:grid-cols-2">{marks.map(m=><article key={m.id} className="admin-card space-y-2"><h3 className="font-semibold">{m.displayName}</h3><p>{words(m.type)} · {m.active ? 'Available' : 'Retired'}</p>
        {m.versions.length ? <div className="flex flex-wrap gap-3">{m.versions.map(v=><figure key={v.id}><img className="w-20 h-20 object-contain bg-white rounded p-1" src={apiUrl(`/marks/versions/${v.id}/preview`)} alt={`${m.displayName} version ${v.version}`} /><figcaption className="text-xs">Version {v.version}</figcaption></figure>)}</div> : <p>No uploaded artwork.</p>}
        {canManage && <div className="flex gap-2"><button className="admin-btn-secondary" onClick={()=>startEdit(m)}>Edit / upload version</button><button className="admin-btn-secondary" disabled={busy} onClick={()=>run(()=>apiClient.patch(`/marks/${m.id}`,{active:!m.active}))}>{m.active?'Retire':'Reactivate'}</button></div>}
      </article>)}</div>{!marks.length && <p>No firm marks registered.</p>}
      {canManage && <form className="admin-card space-y-3" onSubmit={e=>{e.preventDefault(); void run(saveMark);}}><h3 className="font-semibold">{edit?'Edit mark':'Register artwork'}</h3><div className="grid gap-3 md:grid-cols-2">
        {input('Display name',name,setName)}<label>Category<select className="admin-input" value={type} disabled={!!edit} onChange={e=>setType(e.target.value)}>{types.map(t=><option key={t}>{t}</option>)}</select></label>
        <label>Branch<select className="admin-input" value={branch} onChange={e=>setBranch(e.target.value)}><option value="">Whole firm</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        {input('Allowed role keys (comma separated; blank = unrestricted)',roles,setRoles)}
        <label>Authorized users<select multiple className="admin-input" value={allowedUsers} onChange={e=>setAllowedUsers([...e.target.selectedOptions].map(o=>o.value))}>{users.map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select></label>
        {input('Document types (comma separated; blank = all)',docTypes,setDocTypes)}{input('Matter types (comma separated; blank = all)',matterTypes,setMatterTypes)}
        {input('Effective from',from,setFrom,'datetime-local')}{input('Effective until',to,setTo,'datetime-local')}{input('Minimum rotation (degrees)',minRotation,setMinRotation,'number')}{input('Maximum rotation (degrees)',maxRotation,setMaxRotation,'number')}{input('Minimum opacity',minOpacity,setMinOpacity,'number')}
      </div><label className="flex gap-2"><input type="checkbox" checked={approval} onChange={e=>setApproval(e.target.checked)} />Require application approval</label>{approval && input('Approval role keys',approvalRoles,setApprovalRoles)}
      <label className="block">Artwork (PNG/JPEG, maximum 5 MiB)<input type="file" accept="image/png,image/jpeg" onChange={e=>setFile(e.target.files?.[0]??null)} /></label>
      <button className="admin-btn-primary" disabled={busy || name.trim().length<2 || (!edit && !file)}>Save artwork</button>{edit && <button type="button" className="admin-btn-secondary" onClick={()=>{setEdit(null);setName('');setFile(null);}}>Cancel edit</button>}
      </form>}
    </> : <>
      <div className="grid gap-3 md:grid-cols-2">{signatures.map(s=><article className="admin-card space-y-2" key={s.id}><h3>{s.professionalDisplayName}</h3><p>{s.approvalStatus}</p><div className="flex gap-2 flex-wrap">{s.versions.map(v=><figure key={v.id}><img className="w-32 h-16 bg-white object-contain" src={apiUrl(`/marks/signature-versions/${v.id}/preview`)} alt={`Signature version ${v.version}`} /><figcaption>v{v.version} {v.active?'Current':'Previous'}</figcaption></figure>)}</div>{canManage && <button className="admin-btn-secondary" disabled={busy || !s.versions.length} onClick={()=>run(()=>apiClient.post('/marks/signature-profiles',{userId:s.userId,professionalDisplayName:s.professionalDisplayName,typedSignatureAllowed:s.typedSignatureAllowed,approvalStatus:s.approvalStatus==='APPROVED'?'RETIRED':'APPROVED'}))}>{s.approvalStatus==='APPROVED'?'Retire profile':'Approve current version'}</button>}</article>)}</div>
      {canManage && <><form className="admin-card space-y-3" onSubmit={e=>{e.preventDefault();void run(()=>apiClient.post('/marks/signature-profiles',{userId:sigUser,professionalDisplayName:sigName,typedSignatureAllowed:true,approvalStatus:'PENDING'}));}}><h3>Create signature profile</h3><select aria-label="Signature owner" className="admin-input" value={sigUser} onChange={e=>setSigUser(e.target.value)}><option value="">Choose staff member</option>{users.map(u=><option value={u.id} key={u.id}>{u.fullName}</option>)}</select>{input('Professional display name',sigName,setSigName)}<button disabled={busy || !sigUser || !sigName} className="admin-btn-primary">Save profile</button></form>
      <section className="admin-card space-y-3"><h3>Add signature version</h3><select aria-label="Signature profile" className="admin-input" value={sigId} onChange={e=>setSigId(e.target.value)}><option value="">Choose profile</option>{signatures.map(s=><option key={s.id} value={s.id}>{s.professionalDisplayName}</option>)}</select><select aria-label="Signature input method" className="admin-input" value={sigMode} onChange={e=>setSigMode(e.target.value)}><option value="upload">Upload image</option><option value="draw">Draw signature</option><option value="typed">Typed representation</option></select>
      {sigMode==='upload'?<input type="file" aria-label="Signature image" accept="image/png,image/jpeg" onChange={e=>setFile(e.target.files?.[0]??null)} />:<>{sigMode==='typed'&&input('Signature text',typed,setTyped)}<canvas ref={canvas} width={600} height={130} className="bg-white rounded w-full max-w-xl touch-none" aria-label="Draw signature here" onPointerDown={move} onPointerMove={move} onPointerUp={()=>{drawing.current=false;}} onPointerCancel={()=>{drawing.current=false;}} /><button className="admin-btn-secondary" onClick={()=>canvas.current?.getContext('2d')?.clearRect(0,0,600,130)}>Clear drawing</button></>}
      <button className="admin-btn-primary" disabled={busy||!sigId||(sigMode==='typed'&&!typed.trim())} onClick={()=>run(uploadSignature)}>Upload version for approval</button>
      <h3>Time-limited delegation</h3><select aria-label="Delegate" className="admin-input" value={delegate} onChange={e=>setDelegate(e.target.value)}><option value="">Choose delegate</option>{users.map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select>{input('Delegation expires',delegateEnd,setDelegateEnd,'datetime-local')}<button className="admin-btn-secondary" disabled={busy||!sigId||!delegate||!delegateEnd} onClick={()=>run(()=>apiClient.post('/marks/signature-delegations',{delegatorProfileId:sigId,delegateUserId:delegate,allowedActions:['APPLY'],startsAt:new Date().toISOString(),endsAt:new Date(delegateEnd).toISOString(),reason:'Explicit staff signature delegation'}))}>Save delegation</button>
      {signatures.find(s=>s.id===sigId)?.delegationsFrom.map(g=><div key={g.id} className="text-sm">{users.find(u=>u.id===g.delegateUserId)?.fullName || "Delegate"} ? expires {new Date(g.endsAt).toLocaleString()} ? {g.revokedAt?"Revoked":new Date(g.endsAt)<new Date()?"Expired":<button className="admin-btn-secondary" disabled={busy} onClick={()=>run(()=>apiClient.post(`/marks/signature-delegations/${g.id}/revoke`,{}))}>Revoke delegation</button>}</div>)}
      </section></>}
    </>}
  </div>;
}
