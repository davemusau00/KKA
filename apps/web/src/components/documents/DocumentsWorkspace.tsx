import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Upload,
  Clock,
  ShieldCheck,
  CheckCircle,
  Eye,
  Filter,
  FileUp,
  Lock,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { LegalDocument } from '../../types';

export const DocumentsWorkspace: React.FC = () => {
  const {
    documents,
    matters,
    createDocument,
    currentUser,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docMatterId, setDocMatterId] = useState(matters[0]?.id || '');
  const [docCategory, setDocCategory] = useState<LegalDocument['category']>('Pleadings');
  const [docType, setDocType] = useState('Plaint');
  const [confidentiality, setConfidentiality] = useState<LegalDocument['confidentialityLevel']>('standard');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState<number>(185420);
  const [versionNotes, setVersionNotes] = useState('');

  const filteredDocs = documents.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string>('');
  const [selectedFileMime, setSelectedFileMime] = useState<string>('application/pdf');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      setSelectedFileMime(file.type || 'application/pdf');
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedFileDataUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docMatterId) return;

    createDocument({
      matterId: docMatterId,
      title: docTitle,
      category: docCategory,
      documentType: docType,
      confidentialityLevel: confidentiality,
      ownerUserId: currentUser.id,
      initialFile: {
        filename: selectedFileName || `${docTitle}.pdf`,
        size: selectedFileSize || 10240,
        mimeType: selectedFileMime,
        fileDataUrl: selectedFileDataUrl || undefined,
        changeSummary: versionNotes || 'Initial document upload',
      },
    });

    setShowUploadModal(false);
    setDocTitle('');
    setSelectedFileName('');
    setSelectedFileDataUrl('');
    setVersionNotes('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Digital Document Vault
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {documents.length} Stored Documents &bull; Versioned
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Documents, Pleadings &amp; Court Filings
          </h1>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md transition self-start sm:self-auto"
        >
          <FileUp className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search document title, legal pleadings, court filings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none text-xs"
        >
          <option value="all">All Document Categories</option>
          <option value="Pleadings">Pleadings &amp; Court Filings</option>
          <option value="Medical">Medical Reports</option>
          <option value="Police & Evidence">Police &amp; Evidence</option>
          <option value="Correspondence">Correspondence &amp; Demand Letters</option>
          <option value="Court Receipts">Court Receipts &amp; Fees</option>
          <option value="Identification">Client Identification &amp; KYC</option>
        </select>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const matter = matters.find((m) => m.id === doc.matterId);
          const currentVersion = doc.versions.find((v) => v.id === doc.currentVersionId) || doc.versions[0];

          return (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                    {doc.documentType}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      currentVersion?.status === 'filed'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : currentVersion?.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : currentVersion?.status === 'signed'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {currentVersion?.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 line-clamp-2">{doc.title}</h3>

                {matter && (
                  <button
                    onClick={() => {
                      setSelectedMatterId(matter.id);
                      setActiveWorkspace('matters');
                    }}
                    className="font-mono text-amber-400 hover:underline text-[11px] block"
                  >
                    {matter.internalReference} — {matter.title}
                  </button>
                )}

                <div className="text-slate-400 text-[11px] space-y-0.5 pt-1">
                  <div>Latest: {currentVersion?.originalFilename || `${doc.title}.pdf`}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    v{currentVersion?.versionNumber || 1}.0 &bull; {((currentVersion?.fileSizeBytes || 150000) / 1024).toFixed(0)} KB &bull; {doc.category}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(doc.updatedAt || doc.versions[0]?.createdAt || Date.now()).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preview &amp; History</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleUploadSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileUp className="w-4 h-4 text-amber-600 dark:text-blue-400" />
                Upload Legal Document
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* File drop area */}
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-center transition cursor-pointer relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <div className="text-xs text-slate-200 font-medium">
                {selectedFileName ? selectedFileName : 'Click to select or drag and drop document'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">PDF, DOCX, scanned images up to 50MB</p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-xs">Document Title *</label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Plaint and Statement of Claim"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 text-xs">Associated Matter *</label>
                <select
                  value={docMatterId}
                  onChange={(e) => setDocMatterId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-xs font-mono"
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.internalReference} — {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-xs">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-xs"
                >
                  <option value="Pleadings">Pleadings</option>
                  <option value="Medical">Medical Reports</option>
                  <option value="Police & Evidence">Police &amp; Evidence</option>
                  <option value="Correspondence">Correspondence</option>
                  <option value="Court Receipts">Court Receipts</option>
                  <option value="Identification">Identification</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 text-xs">Document Type</label>
                <input
                  type="text"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="e.g. Plaint, Affidavit, Police Abstract"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-xs">Confidentiality</label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-xs"
                >
                  <option value="standard">Standard (All Staff)</option>
                  <option value="restricted">Restricted (Assigned Team)</option>
                  <option value="partner_only">Partner Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-xs">Version Notes</label>
              <input
                type="text"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="e.g. Initial draft submitted for verification"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload &amp; Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
