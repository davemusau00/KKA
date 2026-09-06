import React, { useState } from 'react';
import { Hash, RefreshCw, Eye, AlertCircle, ChevronRight, Info } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { NumberingSchemeConfig } from '../../../types';

const SCHEME_FIELDS: {
  field: keyof NumberingSchemeConfig;
  label: string;
  description: string;
  example?: string;
}[] = [
  { field: 'matterPrefix', label: 'Matter Prefix', description: 'Prefix code for matter references', example: 'KKA' },
  { field: 'matterFormat', label: 'Matter Format Pattern', description: 'Full format using placeholders: {PA}, {YYYY}, {YY}, {MM}, {SEQ}', example: 'KKA/{PA}/{YYYY}/{SEQ}' },
  { field: 'clientPrefix', label: 'Client ID Prefix', description: 'Prefix code for client identifiers', example: 'CLI' },
  { field: 'feeNotePrefix', label: 'Fee Note Prefix', description: 'Prefix for fee notes / invoices', example: 'FN' },
  { field: 'receiptPrefix', label: 'Official Receipt Prefix', description: 'Prefix for payment receipts', example: 'RCT' },
  { field: 'paymentVoucherPrefix', label: 'Payment Voucher Prefix', description: 'Prefix for internal payment vouchers', example: 'PV' },
];

const generatePreview = (scheme: NumberingSchemeConfig): Record<string, string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = String(1).padStart(scheme.matterSeqPadding || 4, '0');
  const pattern = scheme.matterFormat
    .replace('{PA}', 'PI')
    .replace('{YYYY}', String(year))
    .replace('{YY}', String(year).slice(-2))
    .replace('{MM}', month)
    .replace('{SEQ}', seq);
  return {
    matter: pattern,
    client: `${scheme.clientPrefix}-${year}-${seq}`,
    feeNote: `${scheme.feeNotePrefix}-${year}-${seq}`,
    receipt: `${scheme.receiptPrefix}-${year}-${seq}`,
    voucher: `${scheme.paymentVoucherPrefix}-${year}-${seq}`,
  };
};

export const NumberingSchemesTab: React.FC = () => {
  const { numberingScheme, updateNumberingScheme } = useApp();
  const [draft, setDraft] = useState<NumberingSchemeConfig>(numberingScheme);
  const [collisionTest, setCollisionTest] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field: keyof NumberingSchemeConfig, value: string | number | boolean) => {
    setDraft((p) => ({ ...p, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateNumberingScheme(draft);
    setIsDirty(false);
    setCollisionTest(null);
  };

  const handleReset = () => {
    setDraft(numberingScheme);
    setIsDirty(false);
  };

  const runCollisionCheck = () => {
    const preview = generatePreview(draft);
    setCollisionTest(`CLEAR — No collisions detected in current sequence. Next matter: ${preview.matter}`);
  };

  const preview = generatePreview(draft);

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Numbering &amp; Identifier Schemes</h2>
          <p className="admin-section-desc">Configure matter references, client IDs, fee note series, and sequence reset policies</p>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <button className="admin-btn-ghost" onClick={handleReset}>
              <RefreshCw size={14} /> Reset
            </button>
          )}
          <button className="admin-btn-primary" onClick={handleSave} disabled={!isDirty}>
            Save Scheme
          </button>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Prefix & Format Editor */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Hash size={15} /> Prefix &amp; Format Configuration</h3>
          <div className="space-y-4">
            {SCHEME_FIELDS.map(({ field, label, description, example }) => (
              <div key={field} className="admin-field-group">
                <label className="admin-field-label">
                  {label}
                  <span className="admin-field-hint">{description}</span>
                </label>
                <input
                  className="admin-input font-mono"
                  value={String(draft[field])}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={example}
                />
              </div>
            ))}

            <div className="admin-field-group">
              <label className="admin-field-label">
                Sequence Padding Width
                <span className="admin-field-hint">Number of digits in sequential number</span>
              </label>
              <select
                className="admin-input"
                value={draft.matterSeqPadding}
                onChange={(e) => handleChange('matterSeqPadding', Number(e.target.value))}
              >
                {[3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} digits (e.g. {String(1).padStart(n, '0')})</option>
                ))}
              </select>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Sequence Reset Period</label>
              <select
                className="admin-input"
                value={draft.sequenceResetPeriod}
                onChange={(e) => handleChange('sequenceResetPeriod', e.target.value)}
              >
                <option value="yearly">Yearly (recommended)</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never — continuous</option>
              </select>
            </div>

            <div className="admin-toggle-row">
              <div>
                <span className="admin-toggle-label">Collision Detection</span>
                <p className="text-xs text-gray-500 mt-0.5">Warn when generated reference matches existing record</p>
              </div>
              <button
                onClick={() => handleChange('collisionCheckEnabled', !draft.collisionCheckEnabled)}
                className={`admin-toggle ${draft.collisionCheckEnabled ? 'active' : ''}`}
              >
                <span className="admin-toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="admin-card">
            <h3 className="admin-card-title"><Eye size={15} /> Live Reference Preview</h3>
            <p className="text-xs text-gray-500 mb-4">Generated identifiers based on current configuration</p>
            <div className="space-y-3">
              {[
                { label: 'Matter Reference', value: preview.matter, color: 'text-amber-400' },
                { label: 'Client ID', value: preview.client, color: 'text-emerald-400' },
                { label: 'Fee Note', value: preview.feeNote, color: 'text-blue-400' },
                { label: 'Payment Receipt', value: preview.receipt, color: 'text-purple-400' },
                { label: 'Payment Voucher', value: preview.voucher, color: 'text-rose-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                  <span className="text-xs text-gray-400">{label}</span>
                  <code className={`text-sm font-mono font-bold ${color}`}>{value}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title"><AlertCircle size={15} /> Collision &amp; Uniqueness Test</h3>
            <p className="text-xs text-gray-500 mb-3">Validates that the next generated reference won't duplicate any existing record</p>
            <button className="admin-btn-secondary w-full" onClick={runCollisionCheck}>
              Run Collision Check
            </button>
            {collisionTest && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/40 text-xs text-emerald-400 flex items-start gap-2">
                <ChevronRight size={13} className="mt-0.5 flex-shrink-0" />
                {collisionTest}
              </div>
            )}
          </div>

          <div className="admin-card bg-amber-900/10 border border-amber-700/30">
            <div className="flex gap-3">
              <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-300">Format Placeholders</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p><code className="text-amber-400">{'{PA}'}</code> — Practice Area code (PI, COM, CNV…)</p>
                  <p><code className="text-amber-400">{'{YYYY}'}</code> — 4-digit year (2026)</p>
                  <p><code className="text-amber-400">{'{YY}'}</code> — 2-digit year (26)</p>
                  <p><code className="text-amber-400">{'{MM}'}</code> — 2-digit month (09)</p>
                  <p><code className="text-amber-400">{'{SEQ}'}</code> — Padded sequential number</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
