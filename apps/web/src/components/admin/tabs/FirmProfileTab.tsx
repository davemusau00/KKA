import React, { useState } from 'react';
import { Building2, MapPin, Save, Edit2 } from 'lucide-react';
import { FirmIdentityWriteSchema, LegalEntityWriteSchema, BranchContactWriteSchema } from '@contracts/organization';
import { useApp } from '../../../context/AppContext';
import { useOrganizationProfile, useSaveOrganizationProfile } from '../../../lib/queries/organization';
import { BrandingEditor } from './BrandingEditor';

interface FieldDefinition { key: string; label: string; max: number; required?: boolean; type?: 'email' | 'text' }
type SaveInput = Parameters<ReturnType<typeof useSaveOrganizationProfile>['mutateAsync']>[0];

function ProfileFields({ title, fields, values, editable, toInput }: {
  title: string; fields: FieldDefinition[]; values: Record<string, string>; editable: boolean;
  toInput: (draft: Record<string, string>) => SaveInput;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values);
  // Pin the version seen when editing starts, even if the query later refetches.
  const [buildInput, setBuildInput] = useState(() => toInput);
  const [error, setError] = useState('');
  const save = useSaveOrganizationProfile();
  const fieldPrefix = title.toLowerCase().replace(/\s+/g, '-');
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { await save.mutateAsync(buildInput(draft)); setEditing(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save profile.'); }
  };
  return <form onSubmit={onSubmit} aria-label={title} className="space-y-4">
    {fields.map(field => <div className="admin-field-group" key={field.key}>
      <label className="admin-field-label" htmlFor={fieldPrefix + '-' + field.key}>{field.label}</label>
      {editing ? <input id={fieldPrefix + '-' + field.key} className="admin-input" type={field.type || 'text'}
        required={field.required} minLength={field.required ? 2 : undefined} maxLength={field.max}
        disabled={save.isPending} value={draft[field.key] || ''}
        onChange={event => setDraft(previous => ({ ...previous, [field.key]: event.target.value }))} />
        : <p className="admin-field-value">{values[field.key] || 'Not set'}</p>}
    </div>)}
    {error && <p role="alert">{error}</p>}
    {save.isSuccess && !editing && <p role="status">{title} saved.</p>}
    <div className="flex flex-wrap gap-2">
      {editable && (editing ? <>
        <button key="save" type="submit" className="admin-btn-primary" disabled={save.isPending}><Save size={14} />{save.isPending ? 'Saving…' : 'Save ' + title.toLowerCase()}</button>
        <button type="button" className="admin-btn-ghost" disabled={save.isPending} onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
      </> : <button key="edit" type="button" className="admin-btn-secondary" onClick={event => { event.preventDefault(); setDraft(values); setBuildInput(() => toInput); setEditing(true); save.reset(); }}><Edit2 size={14} />Edit {title.toLowerCase()}</button>)}
    </div>
  </form>;
}

export const FirmProfileTab: React.FC = () => {
  const { hasUserPermission } = useApp();
  const canManage = hasUserPermission('admin.settings_manage');
  const canManageBranches = hasUserPermission('admin.branches_manage');
  const profile = useOrganizationProfile(canManage);
  const [entityId, setEntityId] = useState('');
  const [branchId, setBranchId] = useState('');
  const firm = profile.data;
  const entity = firm?.legalEntities.find(row => row.id === entityId);
  const branch = firm?.branches.find(row => row.id === branchId);

  return <div className="admin-tab-content">
    <div className="admin-section-header"><div>
      <h2 className="admin-section-title">Firm Profile &amp; Organisation</h2>
      <p className="admin-section-desc">Saved firm identity, legal entity registration and branch contacts.</p>
    </div></div>
    <div className="admin-card"><BrandingEditor /></div>
    {!canManage ? <p role="status">Organization profile access requires settings management permission.</p>
      : profile.isPending ? <p role="status">Loading organization profile…</p>
      : profile.isError ? <div role="alert"><p>Organization profile could not be loaded. {profile.error.message}</p><button className="admin-btn-secondary" onClick={() => profile.refetch()}>Reload profile</button></div>
      : firm && <>
        <button className="admin-btn-ghost" disabled={profile.isFetching} onClick={() => profile.refetch()}>Reload profile</button>
        <div className="admin-grid-2">
          <section className="admin-card">
            <h3 className="admin-card-title"><Building2 size={15} />Firm Identity</h3>
            <ProfileFields title="Firm identity" fields={[{ key: 'name', label: 'Firm name', max: 200, required: true }, { key: 'shortName', label: 'Short name', max: 100 }]}
              values={{ name: firm.name, shortName: firm.shortName || '' }} editable={canManage}
              toInput={draft => ({ kind: 'firm', data: FirmIdentityWriteSchema.parse({ ...draft, expectedUpdatedAt: firm.updatedAt }) })} />
            <p className="admin-section-desc mt-4">Timezone: {firm.timezone} · Locale: {firm.locale} · Currency: {firm.currency}</p>
          </section>
          <section className="admin-card">
            <h3 className="admin-card-title"><Building2 size={15} />Legal Entity Registration</h3>
            <label className="admin-field-label" htmlFor="profile-entity">Legal entity</label>
            <select id="profile-entity" className="admin-input mb-4" value={entityId} onChange={event => setEntityId(event.target.value)}>
              <option value="">Select a legal entity</option>
              {firm.legalEntities.map(row => <option key={row.id} value={row.id}>{row.name}{row.active ? '' : ' (inactive)'}</option>)}
            </select>
            {!firm.legalEntities.length && <p>No legal entities configured.</p>}
            {entity && <ProfileFields key={entity.id} title="Legal entity" editable={canManage && entity.active}
              fields={[{ key: 'name', label: 'Registered entity name', max: 200, required: true }, { key: 'registrationNo', label: 'Registration number', max: 100 }, { key: 'kraPin', label: 'KRA PIN', max: 50 }, { key: 'vatRegistration', label: 'VAT registration number', max: 100 }]}
              values={{ name: entity.name, registrationNo: entity.registrationNo || '', kraPin: entity.kraPin || '', vatRegistration: entity.vatRegistration || '' }}
              toInput={draft => ({ kind: 'legalEntity', id: entity.id, data: LegalEntityWriteSchema.parse({ ...draft, expectedUpdatedAt: entity.updatedAt }) })} />}
          </section>
          <section className="admin-card">
            <h3 className="admin-card-title"><MapPin size={15} />Branch Contact Information</h3>
            <label className="admin-field-label" htmlFor="profile-branch">Branch contact record</label>
            <select id="profile-branch" className="admin-input mb-4" value={branchId} onChange={event => setBranchId(event.target.value)}>
              <option value="">Select a branch</option>
              {firm.branches.map(row => <option key={row.id} value={row.id}>{row.code} — {row.name}{row.active ? '' : ' (inactive)'}</option>)}
            </select>
            {!firm.branches.length && <p>No branches configured.</p>}
            {branch && <ProfileFields key={branch.id} title="Branch contacts" editable={canManageBranches && branch.active}
              fields={[{ key: 'address', label: 'Physical address', max: 500 }, { key: 'postalAddress', label: 'Postal address', max: 300 }, { key: 'phone', label: 'Phone', max: 50 }, { key: 'email', label: 'Email', max: 254, type: 'email' }]}
              values={{ address: branch.address || '', postalAddress: branch.postalAddress || '', phone: branch.phone || '', email: branch.email || '' }}
              toInput={draft => ({ kind: 'branch', id: branch.id, data: BranchContactWriteSchema.parse({ ...draft, expectedUpdatedAt: branch.updatedAt }) })} />}
          </section>
        </div>
      </>}
  </div>;
};
