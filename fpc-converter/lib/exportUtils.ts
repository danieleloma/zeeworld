/**
 * Export utilities for XLSX, CSV, and JSON formats
 */

import * as XLSX from 'xlsx';
import { OutputRow } from './types';

/**
 * Export rows as XLSX file
 */
export function toXlsx(rows: OutputRow[], fileName: string = 'output.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export rows as CSV file
 */
export function toCsv(rows: OutputRow[], fileName: string = 'output.csv') {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export rows as JSON file
 */
export function toJson(rows: OutputRow[], fileName: string = 'output.json') {
  const json = JSON.stringify(rows, null, 2);
  
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

