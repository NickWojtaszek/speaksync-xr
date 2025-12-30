/**
 * Data Export Utility
 *
 * Exports all teaching cases from SQLite (browser localStorage)
 * to a format that can be imported into PostgreSQL
 */

import { getAllCases } from './database';
import type { TeachingCase } from '../types';

/**
 * Export all teaching cases as JSON
 */
export async function exportCasesAsJSON(): Promise<string> {
  const cases = await getAllCases();
  return JSON.stringify(cases, null, 2);
}

/**
 * Export teaching cases as SQL INSERT statements for PostgreSQL
 */
export async function exportCasesAsSQL(): Promise<string> {
  const cases = await getAllCases();

  const sqlStatements = cases.map(c => {
    // Escape single quotes in text fields
    const escape = (str: string | null | undefined) => {
      if (!str) return 'NULL';
      return `'${str.replace(/'/g, "''")}'`;
    };

    const escapeNumber = (num: number | null | undefined) => {
      if (num === null || num === undefined) return 'NULL';
      return num.toString();
    };

    return `INSERT INTO teaching_cases (
      original_report,
      ai_improved_report,
      final_user_report,
      organ_category,
      disease_classification,
      disease_confidence,
      study_number,
      patient_pesel,
      template_id,
      template_header,
      pathology_report,
      uniqueness_rating,
      created_at,
      author_id,
      tags,
      notes
    ) VALUES (
      ${escape(c.originalReport)},
      ${escape(c.aiImprovedReport)},
      ${escape(c.finalUserReport)},
      ${escape(c.organCategory)},
      ${escape(c.diseaseClassification)},
      ${escapeNumber(c.diseaseConfidence)},
      ${escape(c.studyNumber)},
      ${escape(c.patientPesel)},
      ${escape(c.templateId)},
      ${escape(c.templateHeader)},
      ${escape(c.pathologyReport)},
      ${escapeNumber(c.uniquenessRating)},
      ${escape(c.createdAt)},
      ${escape(c.authorId)},
      ${c.tags ? escape(JSON.stringify(c.tags)) : 'NULL'},
      ${escape(c.notes)}
    );`;
  }).join('\n\n');

  return `-- Teaching Cases Export
-- Generated: ${new Date().toISOString()}
-- Total cases: ${cases.length}

BEGIN;

${sqlStatements}

COMMIT;
`;
}

/**
 * Download exported data as a file
 */
export function downloadExport(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export cases as JSON file download
 */
export async function exportAndDownloadJSON() {
  const json = await exportCasesAsJSON();
  const timestamp = new Date().toISOString().split('T')[0];
  downloadExport(json, `teaching-cases-${timestamp}.json`, 'application/json');
  console.log('✅ Teaching cases exported as JSON');
}

/**
 * Export cases as SQL file download
 */
export async function exportAndDownloadSQL() {
  const sql = await exportCasesAsSQL();
  const timestamp = new Date().toISOString().split('T')[0];
  downloadExport(sql, `teaching-cases-${timestamp}.sql`, 'text/plain');
  console.log('✅ Teaching cases exported as SQL');
}

/**
 * Get export statistics
 */
export async function getExportStats() {
  const cases = await getAllCases();

  const stats = {
    totalCases: cases.length,
    byOrgan: {} as Record<string, number>,
    byDisease: {} as Record<string, number>,
    withPathology: cases.filter(c => c.pathologyReport).length,
    withUniquenessRating: cases.filter(c => c.uniquenessRating).length,
    dateRange: {
      earliest: cases.length > 0 ? new Date(Math.min(...cases.map(c => new Date(c.createdAt).getTime()))).toISOString() : null,
      latest: cases.length > 0 ? new Date(Math.max(...cases.map(c => new Date(c.createdAt).getTime()))).toISOString() : null
    }
  };

  // Count by organ
  cases.forEach(c => {
    stats.byOrgan[c.organCategory] = (stats.byOrgan[c.organCategory] || 0) + 1;
  });

  // Count by disease
  cases.forEach(c => {
    if (c.diseaseClassification) {
      stats.byDisease[c.diseaseClassification] = (stats.byDisease[c.diseaseClassification] || 0) + 1;
    }
  });

  return stats;
}

// Browser console helpers
if (typeof window !== 'undefined') {
  (window as any).exportCasesJSON = exportAndDownloadJSON;
  (window as any).exportCasesSQL = exportAndDownloadSQL;
  (window as any).getExportStats = getExportStats;

  console.log(`
📦 Data Export Utilities Available:

  exportCasesJSON()  - Download cases as JSON
  exportCasesSQL()   - Download cases as SQL INSERT statements
  getExportStats()   - View export statistics

Example:
  await exportCasesJSON()
  await exportCasesSQL()
  await getExportStats()
  `);
}
