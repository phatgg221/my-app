'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentType } from '@prisma/client';
import {
  VendorItem,
  VendorDocumentItem,
  fetchVendorDocuments,
  uploadVendorDocument,
} from '@/services/client/vendorClientService';
import {
  X,
  FileText,
  UploadCloud,
  FileCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface DocumentsModalProps {
  vendor: VendorItem | null;
  onClose: () => void;
  onDocumentsUpdated?: () => void;
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  BUSINESS_LICENSE: 'Business License',
  IDENTITY_DOCUMENT: 'Identity Document (ID/Passport)',
  OTHER: 'Other Document',
};

const DOC_TYPE_BADGES: Record<DocumentType, string> = {
  BUSINESS_LICENSE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  IDENTITY_DOCUMENT: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  OTHER: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
};

export default function DocumentsModal({
  vendor,
  onClose,
  onDocumentsUpdated,
}: DocumentsModalProps) {
  const [documents, setDocuments] = useState<VendorDocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.BUSINESS_LICENSE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!vendor) return;
    try {
      setLoading(true);
      const docs = await fetchVendorDocuments(vendor.id);
      setDocuments(docs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      console.error('Failed to load documents:', message);
      setErrorMessage('Failed to load vendor documents from storage.');
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  useEffect(() => {
    if (!vendor) return;

    let ignore = false;

    fetchVendorDocuments(vendor.id)
      .then((docs) => {
        if (!ignore) {
          setDocuments(docs);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load documents';
        console.error('Failed to load documents:', message);
        if (!ignore) {
          setErrorMessage('Failed to load vendor documents from storage.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [vendor]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await uploadVendorDocument(vendor.id, selectedFile, selectedType);

      setSuccessMessage(`"${selectedFile.name}" successfully uploaded to MinIO storage.`);
      setSelectedFile(null);

      // Reload list and notify parent
      await loadDocuments();
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload failed:', message);
      setErrorMessage(message);
    } finally {
      setUploading(false);
    }
  };

  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Vendor Documents & KYC Repository</h2>
              <p className="text-xs text-slate-400">
                Vendor: <span className="font-semibold text-slate-200">{vendor.name}</span> • Region: {vendor.region}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Form */}
          <form
            onSubmit={handleUpload}
            className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4.5 space-y-4"
          >
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-orange-400" />
              Attach New Document (MinIO S3)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Document Classification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                  className="w-full bg-slate-900 text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Choose File
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  className="w-full text-xs text-slate-300 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 file:cursor-pointer bg-slate-900 border border-slate-700 rounded-xl p-1.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading to S3...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload & Attach
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Existing Documents List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Existing Documents ({documents.length})
            </h3>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="text-xs font-medium">Fetching documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-8 text-center bg-slate-800/30 border border-dashed border-slate-800 rounded-xl text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-600 mb-1.5" />
                <p className="text-xs font-medium">No documents attached to this vendor yet.</p>
                <p className="text-[11px] text-slate-500">Upload business licenses or IDs using the form above.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => {
                  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-700/60 text-slate-300 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                                DOC_TYPE_BADGES[doc.type] || 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {DOC_TYPE_LABELS[doc.type] || doc.type}
                            </span>
                            <span className="text-[11px] text-slate-400">Uploaded {uploadDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Download Link */}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
