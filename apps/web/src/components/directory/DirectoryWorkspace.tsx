import React, { useState, useMemo } from 'react';
import {
  Building,
  Building2,
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  ExternalLink,
  CheckCircle2,
  Tag,
  CreditCard,
  Briefcase,
  Trash2,
  Edit3,
  Scale,
  Car,
  HeartPulse,
  UserCheck,
  Download,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DirectoryCategory, DirectoryContact } from '../../types';

export const DirectoryWorkspace: React.FC = () => {
  const { directoryContacts, addDirectoryContact, updateDirectoryContact, deleteDirectoryContact, matters } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<DirectoryContact | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // New Contact Form State
  const [formData, setFormData] = useState<Partial<DirectoryContact>>({
    name: '',
    category: 'insurer',
    subcategory: '',
    organizationName: '',
    registrationNumber: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    physicalAddress: '',
    city: 'Nairobi',
    contactPersonName: '',
    contactPersonRole: '',
    contactPersonPhone: '',
    notes: '',
    tags: [],
    isActive: true,
  });

  const categories: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'All Organizations', icon: Building2 },
    { id: 'insurer', label: 'Insurers', icon: Shield },
    { id: 'hospital', label: 'Hospitals', icon: HeartPulse },
    { id: 'doctor', label: 'Doctors', icon: UserCheck },
    { id: 'police_station', label: 'Police Stations', icon: Building },
    { id: 'process_server', label: 'Process Servers', icon: FileText },
    { id: 'opposing_firm', label: 'Opposing Law Firms', icon: Scale },
    { id: 'advocate', label: 'Advocates', icon: Users },
    { id: 'expert', label: 'Experts', icon: Briefcase },
    { id: 'court', label: 'Courts', icon: Scale },
    { id: 'vendor', label: 'Vendors', icon: Tag },
    { id: 'employer', label: 'Employers', icon: Car },
  ];

  const filteredContacts = useMemo(() => {
    return directoryContacts.filter((contact) => {
      const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
      const matchesSearch =
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.primaryPhone.includes(searchQuery) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [directoryContacts, selectedCategory, searchQuery]);

  const handleSaveNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.category) return;

    const newContact: DirectoryContact = {
      id: `dir-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category as DirectoryCategory,
      subcategory: formData.subcategory || '',
      organizationName: formData.organizationName || formData.name,
      registrationNumber: formData.registrationNumber || '',
      primaryPhone: formData.primaryPhone || '',
      secondaryPhone: formData.secondaryPhone || '',
      email: formData.email || '',
      physicalAddress: formData.physicalAddress || '',
      city: formData.city || 'Nairobi',
      contactPersonName: formData.contactPersonName || '',
      contactPersonRole: formData.contactPersonRole || '',
      contactPersonPhone: formData.contactPersonPhone || '',
      notes: formData.notes || '',
      tags: formData.tags || [],
      isActive: true,
      mattersCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDirectoryContact(newContact);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      category: 'insurer',
      subcategory: '',
      organizationName: '',
      registrationNumber: '',
      primaryPhone: '',
      secondaryPhone: '',
      email: '',
      physicalAddress: '',
      city: 'Nairobi',
      contactPersonName: '',
      contactPersonRole: '',
      contactPersonPhone: '',
      notes: '',
      tags: [],
      isActive: true,
    });
  };

  const getCategoryBadgeClass = (category: DirectoryCategory) => {
    switch (category) {
      case 'insurer':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'hospital':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      case 'doctor':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'police_station':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'process_server':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'opposing_firm':
        return 'bg-red-950/80 text-red-300 border-red-800/80';
      case 'court':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-xs tracking-wider">
              Central Master Directory
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
              {directoryContacts.length} Verified Entities
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Third-Party Organizations &amp; Contacts
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Standardized registry for Insurers, Hospitals, Police Bases, Doctors, Courts, and Process Servers. Prevents spelling discrepancies across matters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization / Contact</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count =
            cat.id === 'all'
              ? directoryContacts.length
              : directoryContacts.filter((c) => c.category === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all border ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/30 font-semibold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-amber-800 text-amber-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & View Mode Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by entity name, registration no, city, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredContacts.length} of {directoryContacts.length}
          </span>
          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'bg-slate-950 text-slate-400'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-slate-800 text-amber-400' : 'bg-slate-950 text-slate-400'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all duration-200 cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${getCategoryBadgeClass(
                      contact.category
                    )}`}
                  >
                    {contact.category.replace('_', ' ')}
                  </span>
                  {contact.mattersCount ? (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {contact.mattersCount} active matters
                    </span>
                  ) : null}
                </div>

                <h3 className="font-serif font-bold text-slate-100 text-base mt-2 group-hover:text-amber-400 transition-colors">
                  {contact.name}
                </h3>
                {contact.subcategory && (
                  <p className="text-xs text-slate-400 mt-0.5">{contact.subcategory}</p>
                )}
                {contact.registrationNumber && (
                  <div className="text-[11px] font-mono text-amber-500/90 mt-1">
                    Reg: {contact.registrationNumber}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                {contact.contactPersonName && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {contact.contactPersonName} {contact.contactPersonRole ? `(${contact.contactPersonRole})` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono text-[12px]">{contact.primaryPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{contact.physicalAddress}, {contact.city}</span>
                </div>
              </div>

              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {contact.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Entity Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Primary Contact</th>
                  <th className="p-3">Phone &amp; Email</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 text-right">Matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <td className="p-3 font-medium text-slate-100 font-serif">
                      <div>{contact.name}</div>
                      {contact.registrationNumber && (
                        <span className="text-[10px] font-mono text-amber-500">
                          {contact.registrationNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getCategoryBadgeClass(
                          contact.category
                        )}`}
                      >
                        {contact.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {contact.contactPersonName || '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      <div>{contact.primaryPhone}</div>
                      <div className="text-slate-500">{contact.email}</div>
                    </td>
                    <td className="p-3 text-slate-400">
                      {contact.city}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-400">
                      {contact.mattersCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side Drawer: Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono uppercase font-semibold border ${getCategoryBadgeClass(
                    selectedContact.category
                  )}`}
                >
                  {selectedContact.category.replace('_', ' ')}
                </span>
                <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {selectedContact.name}
                </h2>
                {selectedContact.organizationName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedContact.organizationName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Contact Actions */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${selectedContact.primaryPhone}`}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center gap-2 text-slate-200 transition"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Call Entity</div>
                  <div className="text-xs font-mono font-bold">{selectedContact.primaryPhone}</div>
                </div>
              </a>

              <a
                href={`mailto:${selectedContact.email}`}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center gap-2 text-slate-200 transition"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Email Entity</div>
                  <div className="text-xs truncate font-mono">{selectedContact.email}</div>
                </div>
              </a>
            </div>

            {/* Entity Information */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <h4 className="font-mono uppercase font-bold text-slate-400 text-[10px]">
                Corporate &amp; Registration Particulars
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Registration / Code</span>
                  <span className="font-mono text-slate-200">{selectedContact.registrationNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">City / Station</span>
                  <span className="text-slate-200">{selectedContact.city}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Physical Address</span>
                <span className="text-slate-200">{selectedContact.physicalAddress || 'N/A'}</span>
              </div>
              {selectedContact.postalAddress && (
                <div>
                  <span className="text-slate-500 block text-[10px]">Postal Address</span>
                  <span className="text-slate-200">{selectedContact.postalAddress}</span>
                </div>
              )}
            </div>

            {/* Key Contact Person */}
            {selectedContact.contactPersonName && (
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <h4 className="font-mono uppercase font-bold text-slate-400 text-[10px]">
                  Assigned Liaison Officer
                </h4>
                <div className="font-semibold text-slate-200">{selectedContact.contactPersonName}</div>
                <div className="text-slate-400">{selectedContact.contactPersonRole}</div>
                {selectedContact.contactPersonPhone && (
                  <div className="font-mono text-slate-300 text-[11px]">{selectedContact.contactPersonPhone}</div>
                )}
              </div>
            )}

            {/* Bank Details */}
            {selectedContact.bankDetails && (
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <h4 className="font-mono uppercase font-bold text-slate-400 text-[10px]">
                  Settlement &amp; Bank Account
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank:</span>
                  <span className="text-slate-200 font-medium">{selectedContact.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account No:</span>
                  <span className="text-slate-200 font-mono">{selectedContact.bankDetails.accountNumber}</span>
                </div>
                {selectedContact.bankDetails.paybillNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paybill:</span>
                    <span className="text-slate-200 font-mono">{selectedContact.bankDetails.paybillNumber}</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedContact.notes && (
              <div className="space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <h4 className="font-mono uppercase font-bold text-slate-400 text-[10px]">Operational Notes</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedContact.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  deleteDirectoryContact(selectedContact.id);
                  setSelectedContact(null);
                }}
                className="px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/50 rounded-lg transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entity</span>
              </button>

              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Organization Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-lg">
                  Register Directory Organization / Entity
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Standardize third-party reference data across the entire practice.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Entity Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CIC General Insurance Limited"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as DirectoryCategory })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 capitalize"
                  >
                    <option value="insurer">Insurer</option>
                    <option value="hospital">Hospital</option>
                    <option value="doctor">Doctor</option>
                    <option value="police_station">Police Station</option>
                    <option value="process_server">Process Server</option>
                    <option value="opposing_firm">Opposing Law Firm</option>
                    <option value="advocate">Advocate</option>
                    <option value="expert">Expert</option>
                    <option value="court">Court</option>
                    <option value="vendor">Vendor</option>
                    <option value="employer">Employer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Registration / IRA / LSK / Station Code</label>
                  <input
                    type="text"
                    placeholder="e.g. IRA/02/014"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Subcategory / Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Motor Commercial & PSV"
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Primary Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+254 20 282 3000"
                    value={formData.primaryPhone || ''}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="claims@insurer.co.ke"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Physical Building &amp; Street</label>
                  <input
                    type="text"
                    placeholder="e.g. CIC Plaza, Mara Road, Upper Hill"
                    value={formData.physicalAddress || ''}
                    onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">City / Station</label>
                  <input
                    type="text"
                    value={formData.city || 'Nairobi'}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Edwin Otieno"
                    value={formData.contactPersonName || ''}
                    onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Claims Litigation Manager"
                    value={formData.contactPersonRole || ''}
                    onChange={(e) => setFormData({ ...formData, contactPersonRole: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Liaison Direct Phone</label>
                  <input
                    type="text"
                    placeholder="+254 711 345 678"
                    value={formData.contactPersonPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Operational Notes &amp; Statutory Demands</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Requires Section 10 statutory notice before payout; accepts without-prejudice negotiation."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-amber-950/40"
                >
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
