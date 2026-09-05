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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { LegalDocument } from '../../types';

export const DocumentsWorkspace: React.FC = () => {
  const {
    documents,
    matters,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);

  const filteredDocs = documents.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
          <option value="all">All Categories</option>
          <option value="pleading">Court Pleadings</option>
          <option value="evidence">Evidence &amp; Police Reports</option>
          <option value="correspondence">Demand Letters &amp; Notices</option>
          <option value="internal_memo">Internal Legal Memos</option>
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
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    currentVersion?.status === 'filed'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : currentVersion?.status === 'approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
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
                    {matter.internalReference}
                  </button>
                )}

                <div className="text-slate-400 text-[11px] space-y-0.5 pt-1">
                  <div>Latest: {currentVersion?.originalFilename}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    v{currentVersion?.versionNumber}.0 &bull; {(currentVersion?.fileSizeBytes / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(doc.updatedAt).toLocaleDateString()}
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

      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
