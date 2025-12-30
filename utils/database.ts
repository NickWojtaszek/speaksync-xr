import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import type { TeachingCase, TeachingCaseInput } from '../types';

let db: SqlJsDatabase | null = null;
let SQL: any = null;

const DB_KEY = 'speaksync_teaching_cases_db';

/**
 * Initialize the database connection and create tables if needed
 */
export async function initializeDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  try {
    // Initialize sql.js
    if (!SQL) {
      SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
    }

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem(DB_KEY);
    if (savedDb) {
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uint8Array);
      console.log('✅ Teaching cases database loaded from storage');
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('✅ New teaching cases database created');
    }

    // Create teaching_cases table
    db.run(`
      CREATE TABLE IF NOT EXISTS teaching_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        -- Report Content
        original_report TEXT NOT NULL,
        ai_improved_report TEXT,
        final_user_report TEXT NOT NULL,

        -- Classification
        organ_category TEXT NOT NULL,
        disease_classification TEXT,
        disease_confidence REAL,

        -- Patient/Study Identification
        study_number TEXT NOT NULL,
        patient_pesel TEXT,

        -- Template Information
        template_id TEXT,
        template_header TEXT,

        -- Additional Case Information
        pathology_report TEXT,
        uniqueness_rating INTEGER,

        -- Metadata
        created_at TEXT NOT NULL,
        author_id TEXT,
        tags TEXT,
        notes TEXT
      )
    `);

    // Create indexes for better query performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_organ ON teaching_cases(organ_category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_disease ON teaching_cases(disease_classification)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_study_number ON teaching_cases(study_number)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON teaching_cases(created_at)`);

    // Run migrations for existing databases
    try {
      // Check if pathology_report column exists
      const tableInfo = db.exec(`PRAGMA table_info(teaching_cases)`);
      const columns = tableInfo[0]?.values.map(row => row[1] as string) || [];

      if (!columns.includes('pathology_report')) {
        console.log('🔄 Migrating database: adding pathology_report column');
        db.run(`ALTER TABLE teaching_cases ADD COLUMN pathology_report TEXT`);
      }

      if (!columns.includes('uniqueness_rating')) {
        console.log('🔄 Migrating database: adding uniqueness_rating column');
        db.run(`ALTER TABLE teaching_cases ADD COLUMN uniqueness_rating INTEGER`);
      }
    } catch (migrationError) {
      console.warn('⚠️ Migration warning:', migrationError);
    }

    // Save to localStorage
    saveDatabase();

    return db;

  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save database to localStorage
 */
export function saveDatabase(): void {
  if (!db) return;

  try {
    const data = db.export();
    const buffer = Array.from(data);
    localStorage.setItem(DB_KEY, JSON.stringify(buffer));
  } catch (error) {
    console.error('❌ Failed to save database:', error);
  }
}

/**
 * Get the active database connection
 */
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Insert a new teaching case into the database
 */
export async function insertTeachingCase(caseData: TeachingCaseInput): Promise<number> {
  const database = await getDatabase();

  database.run(`
    INSERT INTO teaching_cases (
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    caseData.originalReport,
    caseData.aiImprovedReport || null,
    caseData.finalUserReport,
    caseData.organCategory,
    caseData.diseaseClassification || null,
    caseData.diseaseConfidence || null,
    caseData.studyNumber,
    caseData.patientPesel || null,
    caseData.templateId || null,
    caseData.templateHeader || null,
    caseData.pathologyReport || null,
    caseData.uniquenessRating || null,
    new Date().toISOString(),
    caseData.authorId || null,
    caseData.tags ? JSON.stringify(caseData.tags) : null,
    caseData.notes || null
  ]);

  // Get last inserted ID
  const result = database.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0] as number;

  saveDatabase();
  return id;
}

/**
 * Get all teaching cases from the database
 */
export async function getAllTeachingCases(): Promise<TeachingCase[]> {
  const database = await getDatabase();
  const result = database.exec('SELECT * FROM teaching_cases ORDER BY created_at DESC');

  if (result.length === 0) return [];

  return rowsToObjects<TeachingCase>(result[0]);
}

/**
 * Get teaching cases by organ category
 */
export async function getTeachingCasesByOrgan(organ: string): Promise<TeachingCase[]> {
  const database = await getDatabase();
  const result = database.exec('SELECT * FROM teaching_cases WHERE organ_category = ? ORDER BY created_at DESC', [organ]);

  if (result.length === 0) return [];

  return rowsToObjects<TeachingCase>(result[0]);
}

/**
 * Get teaching cases by disease classification
 */
export async function getTeachingCasesByDisease(disease: string): Promise<TeachingCase[]> {
  const database = await getDatabase();
  const result = database.exec('SELECT * FROM teaching_cases WHERE disease_classification = ? ORDER BY created_at DESC', [disease]);

  if (result.length === 0) return [];

  return rowsToObjects<TeachingCase>(result[0]);
}

/**
 * Get a single teaching case by ID
 */
export async function getTeachingCaseById(id: number): Promise<TeachingCase | undefined> {
  const database = await getDatabase();
  const result = database.exec('SELECT * FROM teaching_cases WHERE id = ?', [id]);

  if (result.length === 0) return undefined;

  const cases = rowsToObjects<TeachingCase>(result[0]);
  return cases[0];
}

/**
 * Delete a teaching case by ID
 */
export async function deleteTeachingCase(id: number): Promise<boolean> {
  const database = await getDatabase();
  database.run('DELETE FROM teaching_cases WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

/**
 * Get statistics about teaching cases
 */
export async function getTeachingCaseStats(): Promise<{
  total: number;
  byOrgan: Record<string, number>;
  byDisease: Record<string, number>;
}> {
  const database = await getDatabase();

  // Total count
  const totalResult = database.exec('SELECT COUNT(*) as count FROM teaching_cases');
  const total = totalResult.length > 0 ? (totalResult[0].values[0][0] as number) : 0;

  // By organ
  const organResult = database.exec('SELECT organ_category, COUNT(*) as count FROM teaching_cases GROUP BY organ_category');
  const byOrgan: Record<string, number> = {};
  if (organResult.length > 0) {
    organResult[0].values.forEach(row => {
      byOrgan[row[0] as string] = row[1] as number;
    });
  }

  // By disease
  const diseaseResult = database.exec('SELECT disease_classification, COUNT(*) as count FROM teaching_cases WHERE disease_classification IS NOT NULL GROUP BY disease_classification');
  const byDisease: Record<string, number> = {};
  if (diseaseResult.length > 0) {
    diseaseResult[0].values.forEach(row => {
      byDisease[row[0] as string] = row[1] as number;
    });
  }

  return { total, byOrgan, byDisease };
}

/**
 * Helper function to convert sql.js result rows to objects
 */
function rowsToObjects<T>(result: { columns: string[]; values: any[][] }): T[] {
  return result.values.map(row => {
    const obj: any = {};
    result.columns.forEach((col, i) => {
      obj[toCamelCase(col)] = row[i];
    });
    return obj as T;
  });
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Export database as file for sharing with teaching curriculum app
 */
export async function exportDatabaseFile(): Promise<Blob> {
  const database = await getDatabase();
  const data = database.export();
  return new Blob([data], { type: 'application/x-sqlite3' });
}

/**
 * Import database from file
 */
export async function importDatabaseFile(file: File): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
  }

  db = new SQL.Database(uint8Array);
  saveDatabase();
  console.log('✅ Database imported successfully');
}
