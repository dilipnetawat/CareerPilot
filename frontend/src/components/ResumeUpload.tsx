import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

interface ResumeUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  file,
  onFileSelect,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (candidateFile: File) => {
    setValidationError(null);

    if (candidateFile.type !== 'application/pdf' && !candidateFile.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Only PDF documents are supported. Please upload a .pdf file.');
      return;
    }

    if (candidateFile.size > 5 * 1024 * 1024) {
      const sizeMb = (candidateFile.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File size (${sizeMb} MB) exceeds the 5MB limit. Please upload a smaller PDF.`);
      return;
    }

    if (candidateFile.size === 0) {
      setValidationError('The selected file is empty.');
      return;
    }

    onFileSelect(candidateFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={handleInputChange}
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-400 bg-indigo-950/30'
              : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">
            Click to upload your resume or drag &amp; drop
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            PDF format only &bull; Up to 15 pages &bull; Max 5 MB
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">
                {formatFileSize(file.size)} &bull; Ready for extraction
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {validationError && (
        <div className="mt-2.5 flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
