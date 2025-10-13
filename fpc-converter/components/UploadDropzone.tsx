'use client';

import { useCallback } from 'react';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function UploadDropzone({ onFilesSelected, disabled }: UploadDropzoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );

      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelected(Array.from(files));
      }
    },
    [onFilesSelected]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        disabled
          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
          : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".xlsx,.xls"
        multiple
        onChange={handleFileInput}
        disabled={disabled}
      />
      <label
        htmlFor="file-upload"
        className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
        </p>
        <p className="mt-2 text-xs text-gray-500">Excel files (.xlsx, .xls)</p>
        <p className="mt-1 text-xs text-gray-500">Multiple files allowed</p>
      </label>
    </div>
  );
}

