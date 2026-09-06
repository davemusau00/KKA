import React, { useState } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Save, Edit2, Hash, FileText, Landmark, Clock } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { BrandingEditor } from './BrandingEditor';

export const FirmProfileTab: React.FC = () => {
  const { firmSettings, updateFirmSettings } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(firmSettings.firmProfile);

  const handleSave = () => {
    updateFirmSettings({ firmProfile: draft });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(firmSettings.firmProfile);
    setEditing(false);
  };

  const fp = editing ? draft : firmSettings.firmProfile;

  const Field: React.FC<{
    label: string;
    value: string;
    field: keyof typeof draft;
    icon?: React.ReactNode;
    multiline?: boolean;
  }> = ({ label, value, field, icon, multiline }) => (
    <div className="admin-field-group">
      <label className="admin-field-label">
        {icon && <span className="admin-field-icon">{icon}</span>}
        {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            className="admin-input"
            value={value}
            rows={2}
            onChange={(e) => setDraft((p) => ({ ...p, [field]: e.target.value }))}
          />
        ) : (
          <input
            className="admin-input"
            value={value}
            onChange={(e) => setDraft((p) => ({ ...p, [field]: e.target.value }))}
          />
        )
      ) : (
        <p className="admin-field-value">{value || <span className="text-gray-500 italic">Not set</span>}</p>
      )}
    </div>
  );

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Firm Profile &amp; Organisation</h2>
          <p className="admin-section-desc">Official registration details, contact information, and regulatory identifiers</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button className="admin-btn-ghost" onClick={handleCancel}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSave}>
                <Save size={14} /> Save Changes
              </button>
            </>
          ) : (
            <button className="admin-btn-secondary" onClick={() => setEditing(true)}>
              <Edit2 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Identity */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Building2 size={15} /> Firm Identity</h3>
          <BrandingEditor />
          <div className="space-y-4">
            <Field label="Firm Name" value={fp.firmName} field="firmName" />
            <Field label="Tagline" value={fp.firmTagline} field="firmTagline" multiline />
            <Field label="LSK Firm Registration No." value={fp.lskFirmRegistrationNo} field="lskFirmRegistrationNo" icon={<FileText size={13} />} />
            <Field label="KRA PIN" value={fp.kraPin} field="kraPin" icon={<Hash size={13} />} />
            <Field label="VAT Registration No." value={fp.vatRegistrationNo} field="vatRegistrationNo" icon={<Landmark size={13} />} />
          </div>
        </div>

        {/* Address */}
        <div className="admin-card">
          <h3 className="admin-card-title"><MapPin size={15} /> Head Office Address</h3>
          <div className="space-y-4">
            <Field label="Physical Building" value={fp.physicalBuilding} field="physicalBuilding" />
            <Field label="Floor &amp; Wing / Suite" value={fp.floorAndWing} field="floorAndWing" />
            <Field label="Street / Highway" value={fp.headOfficeAddress} field="headOfficeAddress" />
            <Field label="City" value={fp.city} field="city" />
            <Field label="Postal Address" value={fp.postalAddress} field="postalAddress" />
          </div>
        </div>

        {/* Contact */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Phone size={15} /> Contact Information</h3>
          <div className="space-y-4">
            <Field label="Primary Phone" value={fp.primaryPhone} field="primaryPhone" icon={<Phone size={13} />} />
            <Field label="Hotline / Emergency" value={fp.hotlinePhone} field="hotlinePhone" icon={<Phone size={13} />} />
            <Field label="Primary Email" value={fp.primaryEmail} field="primaryEmail" icon={<Mail size={13} />} />
            <Field label="Billing / Accounts Email" value={fp.billingEmail} field="billingEmail" icon={<Mail size={13} />} />
            <Field label="Website URL" value={fp.websiteUrl} field="websiteUrl" icon={<Globe size={13} />} />
          </div>
        </div>

        {/* Court Rules */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Clock size={15} /> Court &amp; Operations Defaults</h3>
          <div className="space-y-4">
            <div className="admin-field-group">
              <label className="admin-field-label">Default Court Station</label>
              {editing ? (
                <input className="admin-input" value={firmSettings.courtRules.defaultCourtStation}
                  onChange={(e) => updateFirmSettings({
                    courtRules: { ...firmSettings.courtRules, defaultCourtStation: e.target.value }
                  })}
                />
              ) : (
                <p className="admin-field-value">{firmSettings.courtRules.defaultCourtStation}</p>
              )}
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Statutory Limitation Warning (days)</label>
              <p className="admin-field-value font-mono text-amber-400">{firmSettings.courtRules.statutoryLimitationWarningDays} days before limitation</p>
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Filing Deadline Notice</label>
              <p className="admin-field-value font-mono text-amber-400">{firmSettings.courtRules.filingDeadlineNoticeHours}h advance notice</p>
            </div>
            <div className="space-y-2">
              {[
                { key: 'enableJudiciarySync', label: 'Judiciary CTS Sync' },
                { key: 'autoPollMentions', label: 'Auto-Poll Cause List Mentions' },
                { key: 'enforceCourtHolidays', label: 'Enforce Court Holidays Calendar' },
                { key: 'strictCourtAttireDressCodeNotice', label: 'Strict Attire Reminders' },
              ].map(({ key, label }) => (
                <div key={key} className="admin-toggle-row">
                  <span className="admin-toggle-label">{label}</span>
                  <button
                    onClick={() => editing && updateFirmSettings({
                      courtRules: { ...firmSettings.courtRules, [key]: !(firmSettings.courtRules as unknown as Record<string, boolean>)[key] }
                    })}
                    className={`admin-toggle ${(firmSettings.courtRules as unknown as Record<string, boolean>)[key] ? 'active' : ''} ${!editing ? 'opacity-60 cursor-default' : ''}`}
                  >
                    <span className="admin-toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
