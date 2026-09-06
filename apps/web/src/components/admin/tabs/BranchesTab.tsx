import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  MapPin,
  Phone,
  Mail,
  Users,
  Briefcase,
  X,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Branch } from '../../../types';

export const BranchesTab: React.FC = () => {
  const {
    branches,
    users,
    matters,
    createBranch,
    updateBranch,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');

  const openCreateModal = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchCode('');
    setBranchAddress('');
    setBranchPhone('+254 ');
    setBranchEmail('');
    setShowModal(true);
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setBranchName(b.name);
    setBranchCode(b.code);
    setBranchAddress(b.address);
    setBranchPhone(b.phone);
    setBranchEmail(b.email);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) return;

    if (editingBranch) {
      updateBranch(editingBranch.id, {
        name: branchName.trim(),
        code: branchCode.trim().toUpperCase(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
      });
    } else {
      createBranch({
        name: branchName.trim(),
        code: branchCode.trim().toUpperCase(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        isActive: true,
      });
    }

    setShowModal(false);
  };

  return (
    <div className="admin-tab-content">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Firm Office Locations &amp; Regional Branch Registries</span>
          </h2>
          <p className="admin-section-desc">
            Manage multi-branch operations with independent registry codes, court jurisdictions, and staff allocations.
          </p>
        </div>

        <button onClick={openCreateModal} className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add New Branch Office</span>
        </button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => {
          const assignedStaff = users.filter((u) => u.homeBranchId === b.id);
          const activeMatters = matters.filter((m) => m.originatingBranchId === b.id);

          return (
            <div
              key={b.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-100">{b.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase font-semibold border border-slate-700">
                        Code: {b.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                        Active Registry
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Edit Branch Information"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-slate-400 text-xs space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{b.address || 'Address not registered'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{b.phone || 'Phone not set'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{b.email || 'Email not set'}</span>
                  </div>
                </div>
              </div>

              {/* Roster & Matters Metrics */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-base font-bold text-slate-100 font-mono">
                      {assignedStaff.length}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>Resident Staff</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {activeMatters.length}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 text-amber-500" />
                      <span>Active Matters</span>
                    </div>
                  </div>
                </div>

                {assignedStaff.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[10px] text-slate-500 font-mono mr-1">Staff:</span>
                    {assignedStaff.slice(0, 4).map((s) => (
                      <img
                        key={s.id}
                        src={s.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                        alt={s.fullName}
                        title={`${s.fullName} (${s.jobTitle})`}
                        className="w-6 h-6 rounded-full object-cover border border-slate-700"
                      />
                    ))}
                    {assignedStaff.length > 4 && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                        +{assignedStaff.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create/Edit Branch */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingBranch ? `Edit ${editingBranch.name}` : 'Create New Firm Branch'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="admin-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="admin-field-group">
                <label className="admin-field-label">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kisumu Branch Office"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Branch Code (3-5 Letters) *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="KSM"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  className="admin-input font-mono uppercase"
                />
                <span className="admin-field-hint">Used in matter numbering sequence KKA/{"{PA}"}/{"{BRANCH}"}/{"{YEAR}"}</span>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Physical Address</label>
                <input
                  type="text"
                  placeholder="Mega Plaza, 3rd Floor, Oginga Odinga St, Kisumu"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="admin-field-group">
                  <label className="admin-field-label">Telephone</label>
                  <input
                    type="tel"
                    placeholder="+254 57 202 1100"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Official Registry Email</label>
                  <input
                    type="email"
                    placeholder="kisumu@kklaw.co.ke"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                >
                  {editingBranch ? 'Save Branch Changes' : 'Create Branch Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
