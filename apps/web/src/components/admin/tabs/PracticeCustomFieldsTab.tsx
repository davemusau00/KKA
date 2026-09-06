import React, { useState } from 'react';
import { Layers, Plus, Trash2, Tag, ListFilter, ToggleLeft, ToggleRight, X, Type, Hash, Calendar, ChevronDown } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CustomFieldDefinition } from '../../../types';

const PRACTICE_AREAS = [
  { id: 'PI', label: 'Personal Injury & Motor Claims', color: 'text-amber-400' },
  { id: 'COM', label: 'Commercial Litigation', color: 'text-blue-400' },
  { id: 'CNV', label: 'Conveyancing & Real Property', color: 'text-emerald-400' },
  { id: 'FAM', label: 'Family Law & Matrimonial', color: 'text-rose-400' },
  { id: 'CRM', label: 'Criminal Defense', color: 'text-purple-400' },
  { id: 'EMP', label: 'Employment & Labour', color: 'text-cyan-400' },
];

const FIELD_TYPE_ICONS: Record<CustomFieldDefinition['fieldType'], React.ReactNode> = {
  text: <Type size={13} />,
  number: <Hash size={13} />,
  currency: <span className="text-xs font-bold">KES</span>,
  date: <Calendar size={13} />,
  select: <ChevronDown size={13} />,
  boolean: <ToggleRight size={13} />,
};

const FIELD_TYPE_COLORS: Record<CustomFieldDefinition['fieldType'], string> = {
  text: 'bg-blue-900/30 text-blue-300',
  number: 'bg-purple-900/30 text-purple-300',
  currency: 'bg-emerald-900/30 text-emerald-300',
  date: 'bg-amber-900/30 text-amber-300',
  select: 'bg-rose-900/30 text-rose-300',
  boolean: 'bg-cyan-900/30 text-cyan-300',
};

export const PracticeCustomFieldsTab: React.FC = () => {
  const { customFields, createCustomField, deleteCustomField, updateCustomField } = useApp();
  const [selectedPA, setSelectedPA] = useState<string>('PI');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<CustomFieldDefinition>>({
    practiceAreaId: 'PI',
    key: '',
    label: '',
    fieldType: 'text',
    required: false,
    description: '',
    options: [],
  });
  const [optionInput, setOptionInput] = useState('');

  const paFields = customFields.filter((f) => f.practiceAreaId === selectedPA);

  const openModal = () => {
    setForm({ practiceAreaId: selectedPA, key: '', label: '', fieldType: 'text', required: false, description: '', options: [] });
    setOptionInput('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.key || !form.label) return;
    createCustomField({
      practiceAreaId: form.practiceAreaId || selectedPA,
      key: form.key!,
      label: form.label!,
      fieldType: form.fieldType || 'text',
      required: form.required || false,
      description: form.description,
      options: form.fieldType === 'select' ? (form.options || []) : undefined,
      stageApplicability: form.stageApplicability,
    });
    setShowModal(false);
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    setForm((p) => ({ ...p, options: [...(p.options || []), optionInput.trim()] }));
    setOptionInput('');
  };

  const removeOption = (index: number) => {
    setForm((p) => ({ ...p, options: (p.options || []).filter((_, i) => i !== index) }));
  };

  const selectedPAInfo = PRACTICE_AREAS.find((pa) => pa.id === selectedPA);

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Practice Areas &amp; Custom Fields Studio</h2>
          <p className="admin-section-desc">Define custom metadata fields per practice area for enhanced matter tracking and reporting</p>
        </div>
        <button className="admin-btn-primary" onClick={openModal}>
          <Plus size={14} /> Add Custom Field
        </button>
      </div>

      <div className="flex gap-6">
        {/* PA Sidebar */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {PRACTICE_AREAS.map((pa) => {
            const count = customFields.filter((f) => f.practiceAreaId === pa.id).length;
            return (
              <button
                key={pa.id}
                onClick={() => setSelectedPA(pa.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                  selectedPA === pa.id
                    ? 'bg-[var(--accent-amber)] text-black font-semibold'
                    : 'hover:bg-[var(--bg-tertiary)] text-gray-400'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{pa.id}</p>
                  <p className="text-xs opacity-75 leading-tight mt-0.5 truncate">{pa.label.split(' ')[0]}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${selectedPA === pa.id ? 'bg-black/20 text-black' : 'bg-[var(--bg-secondary)] text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fields List */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-sm font-bold ${selectedPAInfo?.color}`}>{selectedPAInfo?.id}</div>
            <h3 className="text-sm font-semibold text-white">{selectedPAInfo?.label}</h3>
            <span className="text-xs text-gray-500">{paFields.length} custom field(s)</span>
          </div>

          {paFields.length === 0 ? (
            <div className="admin-empty-state">
              <Layers size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 font-medium">No custom fields defined</p>
              <p className="text-gray-600 text-sm mt-1">Add fields to capture practice-area-specific matter data</p>
              <button className="admin-btn-secondary mt-4" onClick={openModal}>
                <Plus size={14} /> Add First Field
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paFields.map((field) => (
                <div key={field.id} className="admin-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${FIELD_TYPE_COLORS[field.fieldType]}`}>
                        {FIELD_TYPE_ICONS[field.fieldType]}
                        {field.fieldType}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{field.label}</p>
                        <code className="text-xs text-gray-500">{field.key}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {field.required && (
                        <span className="text-xs text-rose-400 bg-rose-900/20 px-2 py-0.5 rounded-full">Required</span>
                      )}
                      {field.stageApplicability && (
                        <span className="text-xs text-gray-500">Stage {field.stageApplicability}</span>
                      )}
                      <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" onClick={() => updateCustomField(field.id, { required: !field.required })}>
                        {field.required ? <ToggleRight size={14} className="text-amber-400" /> : <ToggleLeft size={14} />}
                      </button>
                      <button className="p-1.5 hover:bg-rose-900/30 rounded text-gray-400 hover:text-rose-400" onClick={() => deleteCustomField(field.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-2 ml-[calc(2.5rem+0.75rem)]">{field.description}</p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-[calc(2.5rem+0.75rem)]">
                      {field.options.map((opt) => (
                        <span key={opt} className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded text-gray-400">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Field Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add Custom Field</h3>
              <button onClick={() => setShowModal(false)} className="admin-modal-close"><X size={16} /></button>
            </div>
            <div className="admin-modal-body space-y-4">
              <div className="admin-field-group">
                <label className="admin-field-label">Practice Area</label>
                <select className="admin-input" value={form.practiceAreaId} onChange={(e) => setForm((p) => ({ ...p, practiceAreaId: e.target.value }))}>
                  {PRACTICE_AREAS.map((pa) => <option key={pa.id} value={pa.id}>{pa.label} ({pa.id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="admin-field-group">
                  <label className="admin-field-label">Field Label <span className="text-rose-400">*</span></label>
                  <input className="admin-input" value={form.label || ''} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} placeholder="e.g. Police OB Number" />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Field Key <span className="text-rose-400">*</span></label>
                  <input className="admin-input font-mono text-sm" value={form.key || ''} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} placeholder="e.g. police_ob_number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="admin-field-group">
                  <label className="admin-field-label">Field Type</label>
                  <select className="admin-input" value={form.fieldType} onChange={(e) => setForm((p) => ({ ...p, fieldType: e.target.value as CustomFieldDefinition['fieldType'] }))}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency (KES)</option>
                    <option value="date">Date</option>
                    <option value="select">Select (Dropdown)</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                  </select>
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Stage Applicability</label>
                  <input className="admin-input" type="number" min={1} max={12} value={form.stageApplicability || ''} onChange={(e) => setForm((p) => ({ ...p, stageApplicability: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Stage number (optional)" />
                </div>
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Description / Guidance</label>
                <textarea className="admin-input" rows={2} value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Tooltip shown to staff when filling this field" />
              </div>
              {form.fieldType === 'select' && (
                <div className="admin-field-group">
                  <label className="admin-field-label">Dropdown Options</label>
                  <div className="flex gap-2">
                    <input className="admin-input flex-1" value={optionInput} onChange={(e) => setOptionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOption()} placeholder="Type option and press Enter" />
                    <button className="admin-btn-secondary px-3" onClick={addOption}><Plus size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(form.options || []).map((opt, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded text-gray-300">
                        {opt}
                        <button onClick={() => removeOption(i)} className="text-gray-500 hover:text-rose-400"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="admin-toggle-row">
                <span className="admin-toggle-label">Required Field</span>
                <button onClick={() => setForm((p) => ({ ...p, required: !p.required }))} className={`admin-toggle ${form.required ? 'active' : ''}`}>
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={!form.key || !form.label}>Add Field</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
