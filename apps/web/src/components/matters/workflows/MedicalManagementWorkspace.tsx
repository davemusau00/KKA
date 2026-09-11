import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  FileCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { runtimeConfig } from '../../../config/runtime';
import { MedicalCaseData, Matter, InjuryRecord, MedicalReportRequest } from '../../../types';

interface MedicalManagementWorkspaceProps {
  matter: Matter;
}

export const MedicalManagementWorkspace: React.FC<MedicalManagementWorkspaceProps> = ({ matter }) => {
  const { medicalCases, updateMedicalCase } = useApp();

  const data: MedicalCaseData = medicalCases[matter.id] || {
    injuries: [
      {
        id: 'inj-1',
        bodyPart: 'Right Lower Limb (Tibia/Fibula)',
        description: 'Compound comminuted fracture with soft tissue degloving',
        severity: 'severe',
        permanentEffects: 'Permanent 20% functional impairment and limp',
      },
      {
        id: 'inj-2',
        bodyPart: 'Head / Cervical Spine',
        description: 'Blunt trauma concussion with chronic neck strain & whiplash syndrome',
        severity: 'moderate',
        permanentEffects: 'Intermittent headaches and restricted cervical rotation',
      },
    ],
    medicalProviders: [
      {
        id: 'mp-1',
        facilityName: 'Avenue Hospital Parklands',
        doctorName: 'Dr. Joseph Karanja',
        specialty: 'Trauma & Emergency Care',
        contact: '+254 711 029384',
      },
    ],
    treatmentEpisodes: [
      {
        id: 'te-1',
        facilityName: 'Avenue Hospital',
        admissionDate: matter.openedAt.slice(0, 10),
        dischargeDate: matter.openedAt.slice(0, 10),
        treatmentSummary: 'Open reduction and internal fixation (ORIF) with intramedullary nail',
        costAmount: 285400,
        receiptNumber: 'REC-AVE-8819',
      },
    ],
    p3Form: {
      issuedByDoctor: 'Dr. Joseph Karanja (Police Surgeon)',
      policeStationRef: 'Industrial Area Police Station',
      dateExamined: matter.openedAt.slice(0, 10),
      degreeOfHarm: 'Grievous Harm',
      status: 'certified',
    },
    imagingAndRecords: [
      {
        id: 'img-1',
        title: 'Plain X-Rays Right Tibia/Fibula (AP & Lateral)',
        facility: 'Avenue Hospital Imaging',
        reportDate: matter.openedAt.slice(0, 10),
        findings: 'Severe comminuted mid-shaft fracture of tibia with overriding fibula fracture.',
      },
    ],
    medicalReportRequests: [
      {
        id: 'rep-1',
        doctorName: 'Dr. Pravin Patel, MBChB, MMed (Ortho)',
        specialty: 'Consultant Orthopaedic Surgeon',
        facility: 'Upper Hill Medical Chambers, Nairobi',
        requestedAt: matter.openedAt.slice(0, 10),
        feeAmount: 25000,
        status: 'complete',
        permanentDisabilityPercent: 25,
        futureTreatmentEstimate: 180000,
        futureTreatmentNotes: 'Hardware in situ. Will require hardware removal and physical rehabilitation.',
        notes: 'Final medicolegal examination report on file.',
      },
    ],
    permanentDisabilityOverallPercent: 25,
    futureTreatmentEstimateTotal: 180000,
    totalMedicalExpensesIncurred: 285400,
  };

  const safeData: MedicalCaseData = runtimeConfig.enableDemoMode ? data : {
    injuries: [], medicalProviders: [], treatmentEpisodes: [],
    p3Form: { issuedByDoctor: '', policeStationRef: '', dateExamined: '', degreeOfHarm: 'Harm', status: 'requested' },
    imagingAndRecords: [], medicalReportRequests: [], permanentDisabilityOverallPercent: 0,
    futureTreatmentEstimateTotal: 0, totalMedicalExpensesIncurred: 0,
  };
  const [localData, setLocalData] = useState<MedicalCaseData>(safeData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New injury form
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [injuryForm, setInjuryForm] = useState<Partial<InjuryRecord>>({
    bodyPart: '',
    description: '',
    severity: 'moderate',
    permanentEffects: '',
  });

  // New doctor report request form
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState<Partial<MedicalReportRequest>>({
    doctorName: '',
    specialty: 'Consultant Orthopaedic Surgeon',
    facility: 'Nairobi',
    feeAmount: 0,
    status: 'requested',
    permanentDisabilityPercent: 0,
    futureTreatmentEstimate: 0,
    futureTreatmentNotes: '',
  });

  const handleSave = () => {
    if (!runtimeConfig.enableDemoMode) return;
    updateMedicalCase(matter.id, localData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddInjury = () => {
    if (!injuryForm.bodyPart?.trim()) return;
    const newInj: InjuryRecord = {
      id: `inj-${Date.now()}`,
      bodyPart: injuryForm.bodyPart,
      description: injuryForm.description || 'Documented trauma',
      severity: injuryForm.severity || 'moderate',
      permanentEffects: injuryForm.permanentEffects || '',
    };
    setLocalData((prev) => ({
      ...prev,
      injuries: [...prev.injuries, newInj],
    }));
    setShowInjuryForm(false);
    setInjuryForm({
      bodyPart: '',
      description: '',
      severity: 'moderate',
      permanentEffects: '',
    });
  };

  const handleRemoveInjury = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      injuries: prev.injuries.filter((i) => i.id !== id),
    }));
  };

  const handleAddReport = () => {
    if (!reportForm.doctorName?.trim()) return;
    const newRep: MedicalReportRequest = {
      id: `rep-${Date.now()}`,
      doctorName: reportForm.doctorName,
      specialty: reportForm.specialty || 'Consultant Surgeon',
      facility: reportForm.facility || 'Nairobi',
      requestedAt: new Date().toISOString().slice(0, 10),
      feeAmount: Number(reportForm.feeAmount) || 25000,
      status: reportForm.status || 'complete',
      permanentDisabilityPercent: Number(reportForm.permanentDisabilityPercent) || 0,
      futureTreatmentEstimate: Number(reportForm.futureTreatmentEstimate) || 0,
      futureTreatmentNotes: reportForm.futureTreatmentNotes || 'Comprehensive examination completed.',
    };
    setLocalData((prev) => ({
      ...prev,
      medicalReportRequests: [...prev.medicalReportRequests, newRep],
    }));
    setShowReportForm(false);
    setReportForm({
      doctorName: '',
      specialty: 'Consultant Orthopaedic Surgeon',
      facility: 'Nairobi',
      feeAmount: 25000,
      status: 'complete',
      permanentDisabilityPercent: 20,
      futureTreatmentEstimate: 150000,
      futureTreatmentNotes: '',
    });
  };

  const handleRemoveReport = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      medicalReportRequests: prev.medicalReportRequests.filter((r) => r.id !== id),
    }));
  };

  return (
    <div className="space-y-6 text-xs">
      {!runtimeConfig.enableDemoMode && <p role="status" className="border border-amber-800 bg-amber-950/30 text-amber-200 rounded-lg p-3">No server medical record is connected to this workspace. Example injuries, treatment, reports, and disability findings are hidden.</p>}
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
              Stage 4: Medical Examination &amp; Disability Assessment
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Injury Log, P3 Police Surgeon Form &amp; Medicolegal Expert Reports
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Medical File Synced
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!runtimeConfig.enableDemoMode}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Medical Record</span>
          </button>
        </div>
      </div>

      {/* Grid: P3 Form & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P3 Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Police P3 Medical Form</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">P3 Degree of Harm</label>
                <select
                  value={localData.p3Form.degreeOfHarm}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      p3Form: {
                        ...localData.p3Form,
                        degreeOfHarm: e.target.value as MedicalCaseData['p3Form']['degreeOfHarm'],
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Harm">Harm</option>
                  <option value="Grievous Harm">Grievous Harm</option>
                  <option value="Maim">Maim</option>
                  <option value="Dangerous Harm">Dangerous Harm</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Police Surgeon / Doctor</label>
                <input
                  type="text"
                  value={localData.p3Form.issuedByDoctor}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      p3Form: { ...localData.p3Form, issuedByDoctor: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Police Station Ref</label>
                <input
                  type="text"
                  value={localData.p3Form.policeStationRef}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      p3Form: { ...localData.p3Form, policeStationRef: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">P3 Status</label>
                <select
                  value={localData.p3Form.status}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      p3Form: {
                        ...localData.p3Form,
                        status: e.target.value as MedicalCaseData['p3Form']['status'],
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="requested">Requested</option>
                  <option value="received">Received</option>
                  <option value="certified">Certified on File</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Prognosis & Disability Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Overall Permanent Disability &amp; Treatment Estimates</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Assessed Overall Disability (%)</label>
                <input
                  type="number"
                  value={localData.permanentDisabilityOverallPercent || 0}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      permanentDisabilityOverallPercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Future Treatment Cost (KES)</label>
                <input
                  type="number"
                  value={localData.futureTreatmentEstimateTotal || 0}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      futureTreatmentEstimateTotal: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Total Medical Expenses Incurred to Date (KES)</label>
              <input
                type="number"
                value={localData.totalMedicalExpensesIncurred || 0}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    totalMedicalExpensesIncurred: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Injury Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>3. Itemized Injury Dossier</span>
          </h3>

          <button
            onClick={() => setShowInjuryForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Injury Entry</span>
          </button>
        </div>

        {/* Modal: New Injury */}
        {showInjuryForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Add Injury</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Anatomical Site *</label>
                <input
                  type="text"
                  placeholder="e.g. Left Femur"
                  value={injuryForm.bodyPart || ''}
                  onChange={(e) => setInjuryForm({ ...injuryForm, bodyPart: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Severity</label>
                <select
                  value={injuryForm.severity}
                  onChange={(e) =>
                    setInjuryForm({
                      ...injuryForm,
                      severity: e.target.value as InjuryRecord['severity'],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="catastrophic">Catastrophic</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Medical Diagnosis</label>
              <input
                type="text"
                placeholder="e.g. Spiral fracture of distal third of femur"
                value={injuryForm.description || ''}
                onChange={(e) => setInjuryForm({ ...injuryForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInjuryForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddInjury}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg"
              >
                Add Injury
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {localData.injuries.map((inj) => (
            <div
              key={inj.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-xs">{inj.bodyPart}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 text-slate-300 border border-slate-700">
                    {inj.severity}
                  </span>
                </div>
                <div className="text-slate-400 text-xs">{inj.description}</div>
              </div>

              <button
                onClick={() => handleRemoveInjury(inj.id)}
                className="p-1 text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Medicolegal Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>4. Specialist Medicolegal Reports</span>
          </h3>

          <button
            onClick={() => setShowReportForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expert Report</span>
          </button>
        </div>

        {/* Modal: New Report */}
        {showReportForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Add Medicolegal Report</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Pravin Patel"
                  value={reportForm.doctorName || ''}
                  onChange={(e) => setReportForm({ ...reportForm, doctorName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Consultant Orthopaedic Surgeon"
                  value={reportForm.specialty || ''}
                  onChange={(e) => setReportForm({ ...reportForm, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Assessed Disability (%)</label>
                <input
                  type="number"
                  value={reportForm.permanentDisabilityPercent || 0}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      permanentDisabilityPercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Future Medical Cost (KES)</label>
                <input
                  type="number"
                  value={reportForm.futureTreatmentEstimate || 0}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      futureTreatmentEstimate: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Key Findings / Prognosis</label>
              <textarea
                rows={2}
                placeholder="Summary of prognosis, scars, ranges of motion, etc."
                value={reportForm.futureTreatmentNotes || ''}
                onChange={(e) =>
                  setReportForm({ ...reportForm, futureTreatmentNotes: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddReport}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
              >
                Add Report
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {localData.medicalReportRequests.map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">{rep.doctorName}</div>
                  <div className="text-[10px] text-slate-400">{rep.specialty} &bull; {rep.facility}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {rep.permanentDisabilityPercent}% Disability
                  </span>
                  <button
                    onClick={() => handleRemoveReport(rep.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-300 text-xs">{rep.futureTreatmentNotes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
