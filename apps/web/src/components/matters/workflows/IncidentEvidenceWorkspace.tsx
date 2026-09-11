import React, { useState } from 'react';
import {
  Car,
  FileText,
  Users,
  Image,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Building,
  Shield,
  Download,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { runtimeConfig } from '../../../config/runtime';
import { IncidentEvidenceData, Matter, VehicleRecord, WitnessRecord, IncidentExhibit } from '../../../types';

interface IncidentEvidenceWorkspaceProps {
  matter: Matter;
}

export const IncidentEvidenceWorkspace: React.FC<IncidentEvidenceWorkspaceProps> = ({ matter }) => {
  const { incidentEvidence, updateIncidentEvidence } = useApp();

  const data: IncidentEvidenceData = incidentEvidence[matter.id] || {
    incident: {
      date: matter.openedAt.slice(0, 10),
      time: '08:30 AM',
      location: 'Mombasa Road near General Motors Junction, Nairobi',
      description: 'Client was a lawful passenger aboard public service vehicle when third party lorry collided head-on due to excessive speed and lane drift.',
      obNumber: 'OB 44/12/03/2026',
      policeStation: 'Industrial Area Police Station',
      investigatingOfficer: 'IP George Kimani (Badge No. 23819)',
      officerPhone: '+254 722 998811',
      roadConditions: 'Dry tarmac, clear daylight visibility, moderate traffic flow',
    },
    vehicles: [
      {
        id: 'veh-1',
        registrationNumber: 'KBZ 881L',
        makeModel: 'Toyota HiAce Matatu (33-Seater)',
        driverName: 'Ezekiel Omwenga',
        driverLicenseNo: 'DL/2019/88129',
        ownerName: 'Swift Shuttle SACCO Limited',
        insuranceCompany: 'Directline Assurance Ltd',
        policyNumber: 'POL/DL/2026/099182',
        ntsaSearchObtained: true,
        ntsaSearchRef: 'NTSA/LOG/2026/7781',
        notes: 'Driver phone: +254 722 102938. Address: P.O. Box 44102-00100 Nairobi',
      },
      {
        id: 'veh-2',
        registrationNumber: 'KCD 402P',
        makeModel: 'Isuzu FRR Commercial Truck',
        driverName: 'Boniface Mwangi Ndung’u',
        driverLicenseNo: 'DL/2014/19924',
        ownerName: 'Apex Hauliers Kenya Ltd',
        insuranceCompany: 'APA Insurance Ltd',
        policyNumber: 'APA/COMM/2025/44910',
        ntsaSearchObtained: true,
        ntsaSearchRef: 'NTSA/LOG/2026/7782',
        notes: 'Driver phone: +254 733 445566. Address: Enterprise Road, Nairobi',
      },
    ],
    witnesses: [
      {
        id: 'wit-1',
        name: 'Grace Wambui (Fellow Passenger)',
        contact: '+254 711 223344',
        statementRequested: true,
        statementReceived: true,
        statementDate: matter.openedAt.slice(0, 10),
        keyObservations: 'Confirms lorry encroached into passenger vehicle lane; clear line of sight.',
      },
    ],
    exhibits: [
      {
        id: 'exh-1',
        title: 'Certified Police Abstract Form',
        category: 'Police Abstract',
        dateObtained: matter.openedAt.slice(0, 10),
        obtainedBy: 'Harrison Mutiso (Court Clerk)',
        notes: 'Signed and stamped by OCS Industrial Area Police Station.',
      },
      {
        id: 'exh-2',
        title: 'NTSA Search Copy & Motor Vehicle Ownership Certificate',
        category: 'Other Exhibit',
        dateObtained: matter.openedAt.slice(0, 10),
        obtainedBy: 'Harrison Mutiso',
        notes: 'Confirms registered owners at time of collision.',
      },
    ],
  };

  const safeData: IncidentEvidenceData = runtimeConfig.enableDemoMode ? data : {
    incident: { date: '', time: '', location: '', description: '', obNumber: '', policeStation: '', investigatingOfficer: '', officerPhone: '', roadConditions: '' },
    vehicles: [], witnesses: [], exhibits: [],
  };
  const [localData, setLocalData] = useState<IncidentEvidenceData>(safeData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New vehicle form state
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehForm, setVehForm] = useState<Partial<VehicleRecord>>({
    registrationNumber: '',
    makeModel: '',
    driverName: '',
    driverLicenseNo: '',
    ownerName: '',
    insuranceCompany: '',
    policyNumber: '',
    ntsaSearchObtained: false,
    notes: '',
  });

  // New witness form state
  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [witForm, setWitForm] = useState<Partial<WitnessRecord>>({
    name: '',
    contact: '',
    statementRequested: true,
    statementReceived: false,
    keyObservations: '',
  });

  const handleSave = () => {
    if (!runtimeConfig.enableDemoMode) return;
    updateIncidentEvidence(matter.id, localData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddVehicle = () => {
    if (!vehForm.registrationNumber?.trim()) return;
    const newVeh: VehicleRecord = {
      id: `veh-${Date.now()}`,
      registrationNumber: vehForm.registrationNumber.toUpperCase(),
      makeModel: vehForm.makeModel || 'Vehicle',
      driverName: vehForm.driverName || 'Unknown Driver',
      driverLicenseNo: vehForm.driverLicenseNo || '',
      ownerName: vehForm.ownerName || 'Unknown Owner',
    insuranceCompany: vehForm.insuranceCompany || '',
      policyNumber: vehForm.policyNumber || '',
      ntsaSearchObtained: Boolean(vehForm.ntsaSearchObtained),
      ntsaSearchRef: vehForm.ntsaSearchRef || '',
      notes: vehForm.notes || '',
    };
    setLocalData((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, newVeh],
    }));
    setShowVehicleForm(false);
    setVehForm({
      registrationNumber: '',
      makeModel: '',
      driverName: '',
      driverLicenseNo: '',
      ownerName: '',
      insuranceCompany: '',
      policyNumber: '',
      ntsaSearchObtained: false,
      notes: '',
    });
  };

  const handleRemoveVehicle = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
    }));
  };

  const handleAddWitness = () => {
    if (!witForm.name?.trim()) return;
    const newWit: WitnessRecord = {
      id: `wit-${Date.now()}`,
      name: witForm.name,
      contact: witForm.contact || '',
      statementRequested: Boolean(witForm.statementRequested),
      statementReceived: Boolean(witForm.statementReceived),
      statementDate: witForm.statementDate || new Date().toISOString().slice(0, 10),
      keyObservations: witForm.keyObservations || '',
    };
    setLocalData((prev) => ({
      ...prev,
      witnesses: [...prev.witnesses, newWit],
    }));
    setShowWitnessForm(false);
    setWitForm({
      name: '',
      contact: '',
      statementRequested: true,
      statementReceived: false,
      keyObservations: '',
    });
  };

  const handleRemoveWitness = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      witnesses: prev.witnesses.filter((w) => w.id !== id),
    }));
  };

  return (
    <div className="space-y-6 text-xs">
      {!runtimeConfig.enableDemoMode && <p role="status" className="border border-amber-800 bg-amber-950/30 text-amber-200 rounded-lg p-3">No server incident or evidence record is connected to this workspace. Example facts are hidden and no browser-only save is available.</p>}
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
              Stage 3: Evidence, NTSA Search &amp; Police Abstract
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Motor Collision Dossier, Parties, Search Records &amp; Exhibits
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Evidence Synced
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!runtimeConfig.enableDemoMode}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Evidence Dossier</span>
          </button>
        </div>
      </div>

      {/* Grid: Police Station & Incident Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Police Abstract & Station Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Police Station &amp; Occurrence Book (OB) Entry</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Police Station *</label>
                <input
                  type="text"
                  value={localData.incident.policeStation}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      incident: { ...localData.incident, policeStation: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">OB / Incident Number *</label>
                <input
                  type="text"
                  value={localData.incident.obNumber}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      incident: { ...localData.incident, obNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Investigating Officer</label>
                <input
                  type="text"
                  value={localData.incident.investigatingOfficer}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      incident: { ...localData.incident, investigatingOfficer: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Officer Phone</label>
                <input
                  type="text"
                  value={localData.incident.officerPhone || ''}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      incident: { ...localData.incident, officerPhone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Incident Summary &amp; Cause</label>
              <textarea
                rows={3}
                value={localData.incident.description}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    incident: { ...localData.incident, description: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Location & Conditions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Accident Location &amp; Physical Conditions</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Collision Location *</label>
              <input
                type="text"
                value={localData.incident.location}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    incident: { ...localData.incident, location: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Date of Incident</label>
                <input
                  type="date"
                  value={localData.incident.date}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      incident: { ...localData.incident, date: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Time of Collision</label>
                <input
                  type="text"
                  value={localData.incident.time}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      incident: { ...localData.incident, time: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Road &amp; Environmental Conditions</label>
              <input
                type="text"
                value={localData.incident.roadConditions || ''}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    incident: { ...localData.incident, roadConditions: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Involved Vehicles & NTSA Search Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-blue-400" />
            <span>Involved Motor Vehicles &amp; NTSA Search Ownership</span>
          </h3>

          <button
            onClick={() => setShowVehicleForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle Record</span>
          </button>
        </div>

        {/* Modal: New Vehicle */}
        {showVehicleForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Add Motor Vehicle</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Registration No. *</label>
                <input
                  type="text"
                  placeholder="e.g. KDA 123X"
                  value={vehForm.registrationNumber || ''}
                  onChange={(e) => setVehForm({ ...vehForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Make / Model</label>
                <input
                  type="text"
                  placeholder="e.g. Isuzu Bus"
                  value={vehForm.makeModel || ''}
                  onChange={(e) => setVehForm({ ...vehForm, makeModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Insurer</label>
                <input
                  type="text"
                  value={vehForm.insuranceCompany || ''}
                  onChange={(e) => setVehForm({ ...vehForm, insuranceCompany: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={vehForm.driverName || ''}
                  onChange={(e) => setVehForm({ ...vehForm, driverName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={vehForm.ownerName || ''}
                  onChange={(e) => setVehForm({ ...vehForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVehicleForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddVehicle}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
              >
                Add Vehicle
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localData.vehicles.map((v) => (
            <div key={v.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-sm">{v.registrationNumber}</span>
                <button
                  onClick={() => handleRemoveVehicle(v.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-slate-300 text-xs font-medium">{v.makeModel}</div>
              <div className="text-[11px] text-slate-400">Owner: {v.ownerName}</div>
              <div className="text-[11px] text-slate-400">Driver: {v.driverName}</div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Insurer: {v.insuranceCompany}</span>
                <span className={v.ntsaSearchObtained ? 'text-emerald-400' : 'text-amber-500'}>
                  {v.ntsaSearchObtained ? '✓ NTSA Verified' : 'Search Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Eyewitnesses */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eyewitnesses &amp; Witness Statements</span>
          </h3>

          <button
            onClick={() => setShowWitnessForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Eyewitness</span>
          </button>
        </div>

        {/* Modal: New Witness */}
        {showWitnessForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Add Eyewitness</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Witness Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Mwangi"
                  value={witForm.name || ''}
                  onChange={(e) => setWitForm({ ...witForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+254 7..."
                  value={witForm.contact || ''}
                  onChange={(e) => setWitForm({ ...witForm, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Key Observations</label>
              <textarea
                rows={2}
                placeholder="What the witness observed at the scene..."
                value={witForm.keyObservations || ''}
                onChange={(e) => setWitForm({ ...witForm, keyObservations: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWitnessForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWitness}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
              >
                Add Witness
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {localData.witnesses.map((w) => (
            <div
              key={w.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-xs">{w.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{w.contact}</span>
                </div>
                <div className="text-slate-300 text-xs">{w.keyObservations}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${w.statementReceived ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                  {w.statementReceived ? 'Signed Statement on File' : 'Statement Pending'}
                </span>
                <button
                  onClick={() => handleRemoveWitness(w.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
