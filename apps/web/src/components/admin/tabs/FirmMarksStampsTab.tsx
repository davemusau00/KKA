import React, { useState } from 'react';
import {
  Stamp, Plus, Edit2, Trash2, Shield, Star, StarOff, CheckCircle2,
  PenLine, Fingerprint, BadgeCheck, X, User, ChevronDown
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { FirmMarkAsset, FirmMarkType, SignatureProfile, RoleId } from '../../../types';
import { ALL_ROLES_LIST } from './StaffDirectoryTab';

const MARK_TYPE_LABELS: Record<FirmMarkType, string> = {
  firm_seal: 'Official Firm Seal',
  branch_seal: 'Branch Registry Seal',
  logo: 'Firm Logo',
  received_stamp: 'RECEIVED Stamp',
  paid_stamp: 'PAID Stamp',
  approved_stamp: 'APPROVED Stamp',
  certified_copy_stamp: 'CERTIFIED COPY Stamp',
  confidential_stamp: 'CONFIDENTIAL Stamp',
  draft_stamp: 'DRAFT Stamp',
  filed_stamp: 'FILED COPY Stamp',
};

const COLOR_MAP: Record<string, string> = {
  gold: 'bg-yellow-900/30 border-yellow-600/40 text-yellow-300',
  emerald: 'bg-emerald-900/30 border-emerald-600/40 text-emerald-300',
  rose: 'bg-rose-900/30 border-rose-600/40 text-rose-300',
  blue: 'bg-blue-900/30 border-blue-600/40 text-blue-300',
  slate: 'bg-slate-700/30 border-slate-500/40 text-slate-300',
  amber: 'bg-amber-900/30 border-amber-600/40 text-amber-300',
};

const SIG_TYPE_LABELS: Record<SignatureProfile['signatureType'], string> = {
  scanned_image: 'Scanned Image Upload',
  drawn: 'Digital Drawn Signature',
  typed_legal: 'Typed Legal Block',
};

export const FirmMarksStampsTab: React.FC = () => {
  const { firmMarks, signatureProfiles, branches, createFirmMark, updateFirmMark, deleteFirmMark, createSignatureProfile, deleteSignatureProfile, updateSignatureProfile } = useApp();
  const [activeSection, setActiveSection] = useState<'marks' | 'signatures'>('marks');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);
  const [editingMark, setEditingMark] = useState<FirmMarkAsset | null>(null);

  const [markForm, setMarkForm] = useState<Partial<FirmMarkAsset>>({
    name: '',
    markType: 'firm_seal',
    description: '',
    textBadge: '',
    colorScheme: 'gold',
    authorizedRoleIds: ['managing_partner'],
    isDefault: false,
  });

  const [sigForm, setSigForm] = useState<Partial<SignatureProfile>>({
    userId: '',
    advocateName: '',
    title: '',
    barAdmissionNumber: '',
    signatureType: 'typed_legal',
    executionBlockText: 'Drawn, Signed & Delivered by:\n[NAME]\nAdvocate of the High Court of Kenya',
    status: 'active',
    appliedCount: 0,
  });

  const openMarkModal = (mark?: FirmMarkAsset) => {
    if (mark) {
      setEditingMark(mark);
      setMarkForm({ ...mark });
    } else {
      setEditingMark(null);
      setMarkForm({ name: '', markType: 'firm_seal', description: '', textBadge: '', colorScheme: 'gold', authorizedRoleIds: ['managing_partner'], isDefault: false });
    }
    setShowMarkModal(true);
  };

  const handleSaveMark = () => {
    if (!markForm.name || !markForm.markType) return;
    if (editingMark) {
      updateFirmMark(editingMark.id, markForm);
    } else {
      createFirmMark({
        name: markForm.name!,
        markType: markForm.markType!,
        description: markForm.description || '',
        textBadge: markForm.textBadge || '',
        colorScheme: markForm.colorScheme || 'gold',
        authorizedRoleIds: markForm.authorizedRoleIds || [],
        isDefault: markForm.isDefault || false,
        branchId: markForm.branchId,
      });
    }
    setShowMarkModal(false);
  };

  const handleSaveSig = () => {
    if (!sigForm.advocateName || !sigForm.barAdmissionNumber) return;
    createSignatureProfile({
      userId: sigForm.userId || '',
      advocateName: sigForm.advocateName!,
      title: sigForm.title || '',
      barAdmissionNumber: sigForm.barAdmissionNumber!,
      signatureType: sigForm.signatureType || 'typed_legal',
      executionBlockText: sigForm.executionBlockText || '',
      status: sigForm.status || 'active',
      appliedCount: 0,
    });
    setShowSigModal(false);
  };

  const toggleRole = (roleId: RoleId) => {
    const current = markForm.authorizedRoleIds || [];
    const updated = current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId];
    setMarkForm((p) => ({ ...p, authorizedRoleIds: updated }));
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Firm Marks, Seals &amp; Stamps Studio</h2>
          <p className="admin-section-desc">Manage official seals, operational stamps, and advocate signature execution blocks</p>
        </div>
        <div className="flex gap-2">
          {activeSection === 'marks' ? (
            <button className="admin-btn-primary" onClick={() => openMarkModal()}>
              <Plus size={14} /> New Mark / Stamp
            </button>
          ) : (
            <button className="admin-btn-primary" onClick={() => setShowSigModal(true)}>
              <Plus size={14} /> New Signature Profile
            </button>
          )}
        </div>
      </div>

      {/* Section Switcher */}
      <div className="flex gap-1 mb-6 p-1 bg-[var(--bg-tertiary)] rounded-xl w-fit">
        {[
          { key: 'marks', label: 'Firm Marks & Stamps', icon: <Stamp size={14} /> },
          { key: 'signatures', label: 'Signature Profiles & Execution Blocks', icon: <PenLine size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as 'marks' | 'signatures')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSection === key
                ? 'bg-[var(--accent-amber)] text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Firm Marks */}
      {activeSection === 'marks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {firmMarks.map((mark) => (
            <div key={mark.id} className={`admin-card border-2 ${COLOR_MAP[mark.colorScheme] || COLOR_MAP.slate}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border flex items-center justify-center ${COLOR_MAP[mark.colorScheme]}`}>
                    {mark.markType === 'firm_seal' || mark.markType === 'logo' ? (
                      <img src="/firm-favicon.png" alt="Seal" className="w-5 h-5 object-contain" />
                    ) : (
                      <Stamp size={18} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{mark.name}</p>
                    <p className="text-xs text-gray-500">{MARK_TYPE_LABELS[mark.markType]}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" onClick={() => openMarkModal(mark)}>
                    <Edit2 size={13} />
                  </button>
                  <button className="p-1.5 hover:bg-rose-900/30 rounded-lg text-gray-400 hover:text-rose-400" onClick={() => deleteFirmMark(mark.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/20 mb-3 flex items-center justify-between gap-2">
                <code className="text-sm font-bold tracking-wider">{mark.textBadge}</code>
                {(mark.markType === 'firm_seal' || mark.markType === 'logo') && (
                  <img src="/firm-favicon.png" alt="Emblem" className="w-6 h-6 object-contain opacity-80" />
                )}
              </div>

              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{mark.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Shield size={11} className="text-gray-500" />
                  <span className="text-xs text-gray-500">{mark.authorizedRoleIds.length} role(s)</span>
                </div>
                {mark.isDefault && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Star size={11} /> Default
                  </span>
                )}
                {mark.branchId && (
                  <span className="text-xs text-gray-500">
                    {branches.find((b) => b.id === mark.branchId)?.name || mark.branchId}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature Profiles */}
      {activeSection === 'signatures' && (
        <div className="space-y-4">
          {signatureProfiles.map((sig) => (
            <div key={sig.id} className="admin-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-sm">
                    {sig.advocateName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{sig.advocateName}</p>
                    <p className="text-xs text-gray-400">{sig.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded">{sig.barAdmissionNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sig.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                        {sig.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Applied</p>
                    <p className="text-lg font-bold text-white">{sig.appliedCount}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                      onClick={() => updateSignatureProfile(sig.id, { status: sig.status === 'active' ? 'suspended' : 'active' })}
                    >
                      {sig.status === 'active' ? <BadgeCheck size={14} /> : <X size={14} />}
                    </button>
                    <button className="p-1.5 hover:bg-rose-900/30 rounded text-gray-400 hover:text-rose-400" onClick={() => deleteSignatureProfile(sig.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <p className="text-xs text-gray-500 mb-1 font-medium">Execution Block Preview</p>
                <pre className="text-sm text-white font-serif whitespace-pre-wrap leading-relaxed">{sig.executionBlockText}</pre>
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Fingerprint size={11} /> {SIG_TYPE_LABELS[sig.signatureType]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mark Modal */}
      {showMarkModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingMark ? 'Edit Mark / Stamp' : 'Register New Mark or Stamp'}</h3>
              <button onClick={() => setShowMarkModal(false)} className="admin-modal-close"><X size={16} /></button>
            </div>
            <div className="admin-modal-body space-y-4">
              <div className="admin-field-group">
                <label className="admin-field-label">Display Name</label>
                <input className="admin-input" value={markForm.name || ''} onChange={(e) => setMarkForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Official Firm Seal — Supreme Court" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="admin-field-group">
                  <label className="admin-field-label">Mark Type</label>
                  <select className="admin-input" value={markForm.markType} onChange={(e) => setMarkForm((p) => ({ ...p, markType: e.target.value as FirmMarkType }))}>
                    {Object.entries(MARK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Color Scheme</label>
                  <select className="admin-input" value={markForm.colorScheme} onChange={(e) => setMarkForm((p) => ({ ...p, colorScheme: e.target.value as FirmMarkAsset['colorScheme'] }))}>
                    {['gold', 'emerald', 'rose', 'blue', 'slate', 'amber'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Badge Text (appears on stamp)</label>
                <input className="admin-input font-mono" value={markForm.textBadge || ''} onChange={(e) => setMarkForm((p) => ({ ...p, textBadge: e.target.value }))} placeholder="e.g. OFFICIAL FIRM SEAL" />
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Description</label>
                <textarea className="admin-input" rows={2} value={markForm.description || ''} onChange={(e) => setMarkForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Authorized Roles</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES_LIST.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleRole(r)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        (markForm.authorizedRoleIds || []).includes(r)
                          ? 'bg-amber-900/40 border-amber-600 text-amber-300'
                          : 'border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {r.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              {branches.length > 0 && (
                <div className="admin-field-group">
                  <label className="admin-field-label">Branch (optional)</label>
                  <select className="admin-input" value={markForm.branchId || ''} onChange={(e) => setMarkForm((p) => ({ ...p, branchId: e.target.value || undefined }))}>
                    <option value="">— All Branches —</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div className="admin-toggle-row">
                <span className="admin-toggle-label">Set as Default for this type</span>
                <button onClick={() => setMarkForm((p) => ({ ...p, isDefault: !p.isDefault }))} className={`admin-toggle ${markForm.isDefault ? 'active' : ''}`}>
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost" onClick={() => setShowMarkModal(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSaveMark}>{editingMark ? 'Update Mark' : 'Register Mark'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSigModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create Signature Profile &amp; Execution Block</h3>
              <button onClick={() => setShowSigModal(false)} className="admin-modal-close"><X size={16} /></button>
            </div>
            <div className="admin-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="admin-field-group">
                  <label className="admin-field-label">Advocate Full Name</label>
                  <input className="admin-input" value={sigForm.advocateName || ''} onChange={(e) => setSigForm((p) => ({ ...p, advocateName: e.target.value }))} placeholder="e.g. Grace Mutua" />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Title / Designation</label>
                  <input className="admin-input" value={sigForm.title || ''} onChange={(e) => setSigForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Litigation Advocate" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="admin-field-group">
                  <label className="admin-field-label">Bar Admission Number</label>
                  <input className="admin-input font-mono" value={sigForm.barAdmissionNumber || ''} onChange={(e) => setSigForm((p) => ({ ...p, barAdmissionNumber: e.target.value }))} placeholder="P.105/XXXX/YYYY" />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Signature Type</label>
                  <select className="admin-input" value={sigForm.signatureType} onChange={(e) => setSigForm((p) => ({ ...p, signatureType: e.target.value as SignatureProfile['signatureType'] }))}>
                    {Object.entries(SIG_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Execution Block Text</label>
                <textarea className="admin-input font-mono text-sm" rows={5} value={sigForm.executionBlockText || ''} onChange={(e) => setSigForm((p) => ({ ...p, executionBlockText: e.target.value }))} />
                <p className="text-xs text-gray-500 mt-1">This text appears verbatim in the "Drawn, Signed &amp; Delivered" clause of pleadings</p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost" onClick={() => setShowSigModal(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSaveSig}>Create Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
