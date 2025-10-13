'use client';

import { useState, useMemo } from 'react';
import { OutputRow } from '@/lib/types';

interface RowsPreviewProps {
  rows: OutputRow[];
}

const ROWS_PER_PAGE = 50;

export default function RowsPreview({ rows }: RowsPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    
    const term = searchTerm.toLowerCase();
    return rows.filter(row => 
      row.Title.toLowerCase().includes(term) ||
      row.Date.includes(term) ||
      row.Timezone.toLowerCase().includes(term) ||
      row.Region.toLowerCase().includes(term) ||
      (row.Subtitle && row.Subtitle.toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const endIdx = startIdx + ROWS_PER_PAGE;
  const currentRows = filteredRows.slice(startIdx, endIdx);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data to preview. Upload Excel files to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{filteredRows.length}</span> rows
          {searchTerm && <span> (filtered from {rows.length})</span>}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Season
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Episode
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtitle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text Color
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                BG Color
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timezone
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.Region}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.Date}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row['Start Time']}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row['End Time']}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Title}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.Season}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.Episode}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{row.Subtitle}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: row['Text Color'] }}
                    />
                    <span className="text-xs text-gray-600">{row['Text Color']}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: row['BG Color'] }}
                    />
                    <span className="text-xs text-gray-600">{row['BG Color']}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.Timezone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

