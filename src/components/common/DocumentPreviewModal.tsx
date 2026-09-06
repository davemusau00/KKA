import React from 'react';
import { X, Download, CheckCircle, ShieldCheck, FileText, Clock, ExternalLink } from 'lucide-react';
import { LegalDocument, DocumentVersion } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  document: LegalDocument;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<Props> = ({ document, onClose }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { approveDocumentVersion, markDocumentFiled, currentUser } = useApp();
  const [selectedVersionId, setSelectedVersionId] = React.useState(document.currentVersionId);
  const [showFilingPrompt, setShowFilingPrompt] = React.useState(false);
  const [courtFilingRef, setCourtFilingRef] = React.useState('JUD/2026/EFIL/' + Math.floor(10000 + Math.random() * 90000));

  const currentVersion: DocumentVersion | undefined = 
    document.versions.find((v) => v.id === selectedVersionId) || document.versions[document.versions.length - 1];

  const handleApprove = () => {
    if (!currentVersion) return;
    approveDocumentVersion(document.id, currentVersion.id);
  };

  const handleMarkFiled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersion || !courtFilingRef) return;
    markDocumentFiled(document.id, currentVersion.id, courtFilingRef);
    setShowFilingPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{document.title}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                  {document.documentType}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${
                  currentVersion?.status === 'filed'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                    : currentVersion?.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  {currentVersion?.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Category: {document.category} | Confidentiality: {document.confidentialityLevel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Preview, Right Version Log */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Document Canvas or Live Base64 Preview */}
          <div className="flex-1 bg-slate-950/70 p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-start">
            {currentVersion?.fileDataUrl ? (
              <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center p-2">
                {currentVersion.fileDataUrl.startsWith('data:image/') ? (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xl max-h-full overflow-auto text-center">
                    <img
                      src={currentVersion.fileDataUrl}
                      alt={document.title}
                      className="max-h-[65vh] object-contain rounded-lg shadow mx-auto"
                    />
                    <div className="text-slate-400 text-xs mt-3 flex items-center justify-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentVersion.originalFilename}</span>
                      <span>&bull;</span>
                      <span>{((currentVersion.fileSizeBytes || 0) / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                ) : currentVersion.fileDataUrl.startsWith('data:application/pdf') ? (
                  <div className="w-full h-full min-h-[550px] bg-slate-900 rounded-xl border border-slate-800 p-2 shadow-2xl flex flex-col">
                    <iframe
                      src={currentVersion.fileDataUrl}
                      className="w-full flex-1 rounded-lg border-0 min-h-[500px]"
                      title={document.title}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200 font-mono text-xs overflow-auto max-h-[65vh]">
                    <div className="text-slate-400 text-[10px] mb-2 font-bold uppercase">{currentVersion.originalFilename}</div>
                    <pre className="whitespace-pre-wrap">{currentVersion.contentSnippet || 'Uploaded file content'}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-xl p-8 min-h-[500px] border border-slate-200 flex flex-col justify-between font-serif relative">
                {/* Watermark / Stamp if filed */}
                {currentVersion?.status === 'filed' && (
                  <div className="absolute top-6 right-6 border-2 border-red-600/80 rounded-md p-2 text-center text-red-700 font-sans rotate-6 bg-red-50/70">
                    <div className="text-[10px] uppercase font-bold tracking-widest">Republic of Kenya</div>
                    <div className="text-xs font-black">FILED &amp; STAMPED</div>
                    <div className="text-[9px] font-mono">{currentVersion.courtFilingRef || 'JUD/CTS/2026'}</div>
                    <div className="text-[9px]">{new Date(currentVersion.createdAt).toLocaleDateString()}</div>
                  </div>
                )}

                <div>
                  <div className="text-center border-b pb-4 mb-6">
                    <div className="text-xs font-sans uppercase font-bold text-slate-500 tracking-wider">
                      In the Chief Magistrate&apos;s Court at Nairobi
                    </div>
                    <div className="text-xs font-sans text-slate-600 font-medium">Civil Division</div>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 uppercase tracking-wide">
                      {document.title}
                    </h3>
                    <div className="text-xs font-mono text-slate-500 mt-1">
                      Matter Ref: KKC/PI/2026/00427 | Ver: {currentVersion?.versionNumber}.0
                    </div>
                  </div>

                  <div className="text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                    <p className="font-semibold">BETWEEN:</p>
                    <p className="pl-4">JANE WANJIKU DEMO ................................................................. PLAINTIFF</p>
                    <p className="text-center font-bold my-1">- VERSUS -</p>
                    <p className="pl-4">SWIFT SHUTTLE SACCO LTD &amp; ANOTHER .......................... DEFENDANTS</p>

                    <div className="border-t border-slate-200 pt-3 space-y-2 text-slate-700">
                      <p className="font-semibold text-slate-900">LEGAL STATEMENT / PARTICULARS:</p>
                      <p>
                        1. The Plaintiff is a female adult of sound mind residing in Nairobi County within the Republic of Kenya.
                      </p>
                      <p>
                        2. At all material times, the 1st Defendant was the registered beneficial owner of motor vehicle registration number KBX 492X (Public Service Vehicle).
                      </p>
                      <p>
                        3. On or about 10th July 2026, the Plaintiff was lawfully crossing the Thika Superhighway when the 1st Defendant&apos;s motor vehicle was so negligently, carelessly, and recklessly driven as to cause severe collision with the Plaintiff.
                      </p>
                      <p>
                        4. By reason of the said collision, the Plaintiff sustained severe compound bodily injuries including right tibia/fibula fracture, severe facial contusions, and permanent traumatic incapacitation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Sign-off */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between font-sans text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px]">Drawn &amp; Filed By:</div>
                    <div className="font-semibold text-slate-900">Kariuki Kagunda &amp; Co. Advocates</div>
                    <div className="text-slate-600 text-[11px]">View Park Towers, 5th Floor, Nairobi</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] text-slate-400">Digital Seal Verified</div>
                    <div className="text-slate-500 text-[10px]">{currentVersion?.checksum}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Version Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Version History ({document.versions.length})
              </div>

              <div className="space-y-2">
                {document.versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersionId(v.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                      v.id === selectedVersionId
                        ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">Version {v.versionNumber}.0</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-900 text-slate-400">
                        {v.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1 truncate">{v.originalFilename}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">
                      {new Date(v.createdAt).toLocaleDateString()} | {(v.fileSizeBytes / 1024).toFixed(0)} KB
                    </div>
                    {v.notes && <div className="text-slate-400 text-[11px] mt-1 italic">&ldquo;{v.notes}&rdquo;</div>}
                  </button>
                ))}
              </div>

              {/* Version Controls */}
              <div className="mt-6 space-y-3 pt-4 border-t border-slate-800 text-xs">
                {currentVersion?.status === 'review' && (
                  <button
                    onClick={handleApprove}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve for Signing & Filing
                  </button>
                )}

                {currentVersion?.status === 'approved' && !showFilingPrompt && (
                  <button
                    onClick={() => setShowFilingPrompt(true)}
                    className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <ShieldCheck className="w-4 h-4" /> Record Court E-Filing
                  </button>
                )}

                {showFilingPrompt && (
                  <form onSubmit={handleMarkFiled} className="p-3 bg-slate-800/80 rounded-lg border border-purple-700/50 space-y-2">
                    <label className="block text-[11px] font-medium text-slate-300">
                      Enter Judiciary CTS / Portal Barcode Ref:
                    </label>
                    <input
                      type="text"
                      required
                      value={courtFilingRef}
                      onChange={(e) => setCourtFilingRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-purple-500 outline-none"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFilingPrompt(false)}
                        className="px-2 py-1 rounded text-slate-400 bg-slate-700 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium"
                      >
                        Confirm Filed
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">VPS Storage Driver: Local</span>
              <button
                onClick={() => alert(`Simulating encrypted download of ${currentVersion?.originalFilename}`)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" /> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
