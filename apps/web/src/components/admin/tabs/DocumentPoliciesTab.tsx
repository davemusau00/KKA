import React, { useState } from 'react';
import { FileText, Shield, Droplets, HardDrive, Archive, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

const ALLOWED_MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF Documents',
  'application/msword': 'Word (.doc)',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
  'image/jpeg': 'JPEG Images',
  'image/png': 'PNG Images',
  'application/vnd.ms-excel': 'Excel (.xls)',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
  'text/plain': 'Plain Text (.txt)',
};

const SIZE_OPTIONS = [
  { bytes: 10485760, label: '10 MB' },
  { bytes: 20971520, label: '20 MB' },
  { bytes: 26214400, label: '25 MB (recommended)' },
  { bytes: 52428800, label: '50 MB' },
  { bytes: 104857600, label: '100 MB' },
];

export const DocumentPoliciesTab: React.FC = () => {
  const { firmSettings, updateFirmSettings } = useApp();
  const [editing, setEditing] = useState(false);
  const [dp, setDp] = useState({ ...firmSettings.documentPolicies });

  const handleSave = () => {
    updateFirmSettings({ documentPolicies: dp });
    setEditing(false);
  };

  const handleCancel = () => {
    setDp({ ...firmSettings.documentPolicies });
    setEditing(false);
  };

  const toggleMime = (mime: string) => {
    if (!editing) return;
    const current = dp.allowedMimeTypes || [];
    const updated = current.includes(mime)
      ? current.filter((m) => m !== mime)
      : [...current, mime];
    setDp((p) => ({ ...p, allowedMimeTypes: updated }));
  };

  const activeDp = editing ? dp : firmSettings.documentPolicies;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Document &amp; Archival Policies</h2>
          <p className="admin-section-desc">Control document standards, watermarks, upload restrictions, and Kenya LSK 7-year retention schedule</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button className="admin-btn-ghost" onClick={handleCancel}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSave}><Save size={14} /> Save Policies</button>
            </>
          ) : (
            <button className="admin-btn-secondary" onClick={() => setEditing(true)}>Edit Policies</button>
          )}
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Advocate Sign-off & Watermarks */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Shield size={15} /> Document Controls</h3>
          <div className="space-y-4">
            <div className="admin-toggle-row">
              <div>
                <span className="admin-toggle-label">Mandatory Advocate Sign-Off</span>
                <p className="text-xs text-gray-500 mt-0.5">All outgoing documents require advocate approval before delivery</p>
              </div>
              <button
                onClick={() => editing && setDp((p) => ({ ...p, mandatoryAdvocateSignOff: !p.mandatoryAdvocateSignOff }))}
                className={`admin-toggle ${activeDp.mandatoryAdvocateSignOff ? 'active' : ''} ${!editing ? 'cursor-default' : ''}`}
              >
                <span className="admin-toggle-knob" />
              </button>
            </div>

            <div className="admin-toggle-row">
              <div>
                <span className="admin-toggle-label">Enable Watermark on Drafts</span>
                <p className="text-xs text-gray-500 mt-0.5">Automatically overlay watermark text on all draft documents</p>
              </div>
              <button
                onClick={() => editing && setDp((p) => ({ ...p, enableWatermarkOnDrafts: !p.enableWatermarkOnDrafts }))}
                className={`admin-toggle ${activeDp.enableWatermarkOnDrafts ? 'active' : ''} ${!editing ? 'cursor-default' : ''}`}
              >
                <span className="admin-toggle-knob" />
              </button>
            </div>

            {activeDp.enableWatermarkOnDrafts && (
              <div className="admin-field-group">
                <label className="admin-field-label"><Droplets size={12} /> Watermark Text</label>
                {editing ? (
                  <input className="admin-input" value={dp.watermarkText} onChange={(e) => setDp((p) => ({ ...p, watermarkText: e.target.value }))} />
                ) : (
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-xs font-mono text-amber-300 text-center opacity-60 tracking-widest">{activeDp.watermarkText}</p>
                  </div>
                )}
              </div>
            )}

            <div className="admin-toggle-row">
              <div>
                <span className="admin-toggle-label">Enforce Court Barcode Seal</span>
                <p className="text-xs text-gray-500 mt-0.5">Require Judiciary CTS barcode on all filed documents</p>
              </div>
              <button
                onClick={() => editing && setDp((p) => ({ ...p, enforceCourtBarcodeSeal: !p.enforceCourtBarcodeSeal }))}
                className={`admin-toggle ${activeDp.enforceCourtBarcodeSeal ? 'active' : ''} ${!editing ? 'cursor-default' : ''}`}
              >
                <span className="admin-toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Restrictions */}
        <div className="admin-card">
          <h3 className="admin-card-title"><HardDrive size={15} /> Upload Restrictions</h3>
          <div className="space-y-4">
            <div className="admin-field-group">
              <label className="admin-field-label">Maximum Upload File Size</label>
              {editing ? (
                <select className="admin-input" value={dp.maxUploadFileSizeBytes} onChange={(e) => setDp((p) => ({ ...p, maxUploadFileSizeBytes: Number(e.target.value) }))}>
                  {SIZE_OPTIONS.map(({ bytes, label }) => <option key={bytes} value={bytes}>{label}</option>)}
                </select>
              ) : (
                <p className="admin-field-value font-mono text-amber-400">
                  {SIZE_OPTIONS.find((s) => s.bytes === activeDp.maxUploadFileSizeBytes)?.label || `${(activeDp.maxUploadFileSizeBytes / 1048576).toFixed(1)} MB`}
                </p>
              )}
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Permitted File Types</label>
              <div className="space-y-2">
                {Object.entries(ALLOWED_MIME_LABELS).map(([mime, label]) => {
                  const isAllowed = (activeDp.allowedMimeTypes || []).includes(mime);
                  return (
                    <div key={mime} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]">
                      <span className="text-sm text-gray-300">{label}</span>
                      <button
                        onClick={() => toggleMime(mime)}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                          isAllowed
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-gray-700/40 text-gray-500'
                        } ${!editing ? 'cursor-default' : ''}`}
                      >
                        {isAllowed ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {isAllowed ? 'Allowed' : 'Blocked'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Retention Policy */}
        <div className="admin-card col-span-full">
          <h3 className="admin-card-title"><Archive size={15} /> Archival Retention Schedule</h3>
          <div className="flex items-start gap-8">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-4">
                Under the Law Society of Kenya Advocates Act and professional conduct rules, client files and matter records must be retained for a minimum period after matter closure.
              </p>
              <div className="admin-field-group">
                <label className="admin-field-label">Retention Period</label>
                {editing ? (
                  <select className="admin-input w-48" value={dp.archivalRetentionYears} onChange={(e) => setDp((p) => ({ ...p, archivalRetentionYears: Number(e.target.value) }))}>
                    {[5, 6, 7, 10, 15, 20].map((y) => <option key={y} value={y}>{y} years {y === 7 ? '(LSK minimum)' : ''}</option>)}
                  </select>
                ) : (
                  <p className="admin-field-value text-emerald-400 font-bold text-2xl">{activeDp.archivalRetentionYears} years</p>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="p-4 rounded-lg bg-amber-900/10 border border-amber-700/30">
                <p className="text-xs font-semibold text-amber-300 mb-2">LSK Retention Requirements</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Minimum 7 years for closed civil matters</li>
                  <li>• Permanent retention for criminal conviction records</li>
                  <li>• 10 years for real property conveyancing files</li>
                  <li>• 15 years for probate and administration files</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <p className="text-xs text-gray-500">Current setting applies to all practice areas. Longer-retention files are automatically flagged before archival date.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
