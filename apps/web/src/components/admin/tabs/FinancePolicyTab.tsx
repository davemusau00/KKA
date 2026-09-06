import React, { useState } from 'react';
import { DollarSign, Percent, Users, Landmark, CreditCard, Save, Edit2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

const CURRENCY_OPTIONS = ['KES', 'USD', 'GBP', 'EUR'];

export const FinancePolicyTab: React.FC = () => {
  const { firmSettings, updateFirmSettings } = useApp();
  const [editing, setEditing] = useState(false);
  const [fp, setFp] = useState({ ...firmSettings.financePolicies });

  const handleSave = () => {
    updateFirmSettings({ financePolicies: fp });
    setEditing(false);
  };

  const handleCancel = () => {
    setFp({ ...firmSettings.financePolicies });
    setEditing(false);
  };

  const active = editing ? fp : firmSettings.financePolicies;

  const HourlyRateRow: React.FC<{ roleKey: keyof typeof fp.hourlyRates; label: string }> = ({ roleKey, label }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
      <span className="text-sm text-gray-300">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">KES</span>
          <input
            type="number"
            className="admin-input w-32 text-right font-mono"
            value={fp.hourlyRates[roleKey]}
            onChange={(e) => setFp((p) => ({
              ...p,
              hourlyRates: { ...p.hourlyRates, [roleKey]: Number(e.target.value) }
            }))}
          />
          <span className="text-xs text-gray-500">/hr</span>
        </div>
      ) : (
        <span className="font-mono text-amber-400 font-bold">
          KES {active.hourlyRates[roleKey].toLocaleString()}/hr
        </span>
      )}
    </div>
  );

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Finance Policies &amp; Rate Cards</h2>
          <p className="admin-section-desc">Currency, VAT, advocate hourly rates, petty cash limits, and bank account configurations</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button className="admin-btn-ghost" onClick={handleCancel}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSave}><Save size={14} /> Save</button>
            </>
          ) : (
            <button className="admin-btn-secondary" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit</button>
          )}
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Currency & VAT */}
        <div className="admin-card">
          <h3 className="admin-card-title"><DollarSign size={15} /> Currency &amp; Tax Configuration</h3>
          <div className="space-y-4">
            <div className="admin-field-group">
              <label className="admin-field-label">Primary Currency</label>
              {editing ? (
                <select className="admin-input" value={fp.currencyCode} onChange={(e) => setFp((p) => ({ ...p, currencyCode: e.target.value }))}>
                  {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <p className="admin-field-value font-bold text-xl text-amber-400">{active.currencyCode}</p>
              )}
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label flex items-center gap-1">
                <Percent size={12} /> VAT Rate
              </label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="number" className="admin-input w-24" value={fp.vatRatePercent} onChange={(e) => setFp((p) => ({ ...p, vatRatePercent: Number(e.target.value) }))} />
                  <span className="text-gray-400">%</span>
                </div>
              ) : (
                <p className="admin-field-value font-bold text-xl text-emerald-400">{active.vatRatePercent}%</p>
              )}
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Max Petty Cash (without Partner approval)</label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">KES</span>
                  <input type="number" className="admin-input flex-1 font-mono" value={fp.maxPettyCashDisbursementWithoutPartner} onChange={(e) => setFp((p) => ({ ...p, maxPettyCashDisbursementWithoutPartner: Number(e.target.value) }))} />
                </div>
              ) : (
                <p className="admin-field-value font-mono text-rose-400">KES {active.maxPettyCashDisbursementWithoutPartner.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* ARO Hourly Rates */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Users size={15} /> Advocate &amp; Staff Hourly Rates</h3>
          <p className="text-xs text-gray-500 mb-4">Rates used for automatic time-billing calculations and fee note generation</p>
          <div className="space-y-2">
            <HourlyRateRow roleKey="senior_partner" label="Senior Partner / Senior Counsel" />
            <HourlyRateRow roleKey="advocate" label="Associate Advocate" />
            <HourlyRateRow roleKey="paralegal" label="Paralegal / Legal Clerk" />
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="admin-card col-span-full">
          <h3 className="admin-card-title"><Landmark size={15} /> Firm Bank Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Trust Account */}
            <div className="p-4 rounded-xl bg-amber-900/10 border border-amber-700/30">
              <p className="text-xs font-semibold text-amber-400 mb-3">Client Trust Account (CTA)</p>
              <div className="space-y-2">
                <div className="admin-field-group">
                  <label className="admin-field-label">Bank</label>
                  {editing ? (
                    <input className="admin-input text-sm" value={fp.clientTrustAccountBank} onChange={(e) => setFp((p) => ({ ...p, clientTrustAccountBank: e.target.value }))} />
                  ) : (
                    <p className="text-sm text-gray-300">{active.clientTrustAccountBank}</p>
                  )}
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Account Number</label>
                  {editing ? (
                    <input className="admin-input font-mono text-sm" value={fp.clientTrustAccountNumber} onChange={(e) => setFp((p) => ({ ...p, clientTrustAccountNumber: e.target.value }))} />
                  ) : (
                    <p className="font-mono text-sm text-amber-300">{active.clientTrustAccountNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Office Operations Account */}
            <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/30">
              <p className="text-xs font-semibold text-blue-400 mb-3">Office Operations Account</p>
              <div className="space-y-2">
                <div className="admin-field-group">
                  <label className="admin-field-label">Bank</label>
                  {editing ? (
                    <input className="admin-input text-sm" value={fp.officeOperationsAccountBank} onChange={(e) => setFp((p) => ({ ...p, officeOperationsAccountBank: e.target.value }))} />
                  ) : (
                    <p className="text-sm text-gray-300">{active.officeOperationsAccountBank}</p>
                  )}
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Account Number</label>
                  {editing ? (
                    <input className="admin-input font-mono text-sm" value={fp.officeOperationsAccountNumber} onChange={(e) => setFp((p) => ({ ...p, officeOperationsAccountNumber: e.target.value }))} />
                  ) : (
                    <p className="font-mono text-sm text-blue-300">{active.officeOperationsAccountNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* M-Pesa Paybill */}
            <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-700/30">
              <p className="text-xs font-semibold text-emerald-400 mb-3">M-Pesa Paybill</p>
              <div className="space-y-2">
                <div className="admin-field-group">
                  <label className="admin-field-label">Paybill Number</label>
                  {editing ? (
                    <input className="admin-input font-mono text-sm" value={fp.defaultMpesaPaybill} onChange={(e) => setFp((p) => ({ ...p, defaultMpesaPaybill: e.target.value }))} />
                  ) : (
                    <p className="font-mono text-2xl font-bold text-emerald-300">{active.defaultMpesaPaybill}</p>
                  )}
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Account Reference Format</label>
                  {editing ? (
                    <select className="admin-input text-sm" value={fp.defaultMpesaAccountRef} onChange={(e) => setFp((p) => ({ ...p, defaultMpesaAccountRef: e.target.value }))}>
                      <option value="MATTER_REF">Matter Reference</option>
                      <option value="CLIENT_ID">Client ID</option>
                      <option value="FEE_NOTE_NO">Fee Note Number</option>
                    </select>
                  ) : (
                    <p className="text-sm text-emerald-300 font-mono">{active.defaultMpesaAccountRef}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
