'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import UploadDropzone from '@/components/UploadDropzone';
import RowsPreview from '@/components/RowsPreview';
import { parseGrid } from '@/lib/gridParser';
import { convertToRows } from '@/lib/converter';
import { toXlsx, toCsv, toJson } from '@/lib/exportUtils';
import { OutputRow } from '@/lib/types';

export default function Home() {
  const [region, setRegion] = useState('ROA');
  const [timezoneOrder, setTimezoneOrder] = useState('WAT,CAT');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#1A1A1A');
  const [mergeSlots, setMergeSlots] = useState(true);
  const [rows, setRows] = useState<OutputRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);

  const processFiles = async (files: File[]) => {
    console.log('Processing files:', files.map(f => f.name));
    setProcessing(true);
    setIssues([]);
    
    const allRows: OutputRow[] = [];
    const allIssues: string[] = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        const buffer = await file.arrayBuffer();
        console.log(`File buffer size: ${buffer.byteLength} bytes`);
        
        const workbook = XLSX.read(buffer, { cellDates: true });
        console.log(`Workbook sheets:`, workbook.SheetNames);
        
        const parsed = parseGrid(workbook);
        console.log(`Parsed grid:`, parsed);
        
        if (parsed.issues.length > 0) {
          console.log(`Issues found:`, parsed.issues);
          allIssues.push(`${file.name}: ${parsed.issues.join(', ')}`);
        }
        
        const converted = convertToRows(parsed, {
          region,
          timezoneOrder: timezoneOrder.split(',').map(tz => tz.trim()),
          textColor,
          bgColor,
          mergeSlots,
        });
        
        console.log(`Converted rows:`, converted.length, converted.slice(0, 3));
        allRows.push(...converted);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        allIssues.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Total rows: ${allRows.length}, Total issues: ${allIssues.length}`);
    setRows(allRows);
    setIssues(allIssues);
    setProcessing(false);
  };

  const handleExportXlsx = () => {
    if (rows.length === 0) return;
    toXlsx(rows, 'fpc-schedule.xlsx');
  };

  const handleExportCsv = () => {
    if (rows.length === 0) return;
    toCsv(rows, 'fpc-schedule.csv');
  };

  const handleExportJson = () => {
    if (rows.length === 0) return;
    toJson(rows, 'fpc-schedule.json');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FPC Grid → Row Converter</h1>
          <p className="mt-2 text-gray-600">
            Convert FPC grid-format Excel files to row format (XLSX/CSV/JSON)
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Region */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                id="region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., SA, ROA"
              />
            </div>

            {/* Timezone Order */}
            <div>
              <label htmlFor="timezone-order" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone Order
              </label>
              <input
                id="timezone-order"
                type="text"
                value={timezoneOrder}
                onChange={(e) => setTimezoneOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., WAT,CAT"
              />
            </div>

            {/* Text Color */}
            <div>
              <label htmlFor="text-color" className="block text-sm font-medium text-gray-700 mb-1">
                Default Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* BG Color */}
            <div>
              <label htmlFor="bg-color" className="block text-sm font-medium text-gray-700 mb-1">
                Default BG Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Merge Checkbox */}
            <div className="flex items-center">
              <input
                id="merge-slots"
                type="checkbox"
                checked={mergeSlots}
                onChange={(e) => setMergeSlots(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="merge-slots" className="ml-2 block text-sm text-gray-700">
                Merge contiguous 30-min slots
              </label>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
          <UploadDropzone onFilesSelected={processFiles} disabled={processing} />
          {processing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing files...
              </div>
            </div>
          )}
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Issues Detected:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              {issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Export Buttons */}
        {rows.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportXlsx}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Download XLSX
              </button>
              <button
                onClick={handleExportCsv}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download CSV
              </button>
              <button
                onClick={handleExportJson}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Download JSON
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <RowsPreview rows={rows} />
        </div>
      </div>
    </div>
  );
}

