/**
 * Database Adapter
 *
 * Provides a unified interface for database operations that works with both:
 * - SQLite (sql.js) for local development
 * - PostgreSQL for production on Railway
 *
 * Usage:
 * - Development: Uses existing SQLite database.ts
 * - Production: Connects to Railway PostgreSQL via REST API
 */

import type { TeachingCase, TeachingCaseInput } from '../types';

// Detect environment
const isProduction = import.meta.env.VITE_APP_ENV === 'production';
const isDevelopment = !isProduction;

// API endpoint for production database operations
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api.railway.app';

/**
 * Database Adapter Interface
 */
export interface DatabaseAdapter {
  getAllCases(): Promise<TeachingCase[]>;
  getCaseById(id: number): Promise<TeachingCase | null>;
  addCase(caseData: TeachingCaseInput): Promise<number>;
  updateCase(id: number, caseData: Partial<TeachingCaseInput>): Promise<void>;
  deleteCase(id: number): Promise<void>;
  searchCases(query: { organ?: string; disease?: string; studyNumber?: string }): Promise<TeachingCase[]>;
  exportDatabase(): Promise<Uint8Array>;
  importDatabase(data: Uint8Array): Promise<void>;
}

/**
 * Production Database Adapter (PostgreSQL via REST API)
 */
class ProductionDatabaseAdapter implements DatabaseAdapter {
  private async fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllCases(): Promise<TeachingCase[]> {
    return this.fetchAPI('/api/teaching-cases');
  }

  async getCaseById(id: number): Promise<TeachingCase | null> {
    try {
      return await this.fetchAPI(`/api/teaching-cases/${id}`);
    } catch (error) {
      return null;
    }
  }

  async addCase(caseData: TeachingCaseInput): Promise<number> {
    const result = await this.fetchAPI('/api/teaching-cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
    return result.id;
  }

  async updateCase(id: number, caseData: Partial<TeachingCaseInput>): Promise<void> {
    await this.fetchAPI(`/api/teaching-cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(caseData),
    });
  }

  async deleteCase(id: number): Promise<void> {
    await this.fetchAPI(`/api/teaching-cases/${id}`, {
      method: 'DELETE',
    });
  }

  async searchCases(query: { organ?: string; disease?: string; studyNumber?: string }): Promise<TeachingCase[]> {
    const params = new URLSearchParams();
    if (query.organ) params.append('organ', query.organ);
    if (query.disease) params.append('disease', query.disease);
    if (query.studyNumber) params.append('studyNumber', query.studyNumber);

    return this.fetchAPI(`/api/teaching-cases/search?${params.toString()}`);
  }

  async exportDatabase(): Promise<Uint8Array> {
    const response = await fetch(`${API_BASE_URL}/api/database/export`, {
      credentials: 'include',
    });
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    await fetch(`${API_BASE_URL}/api/database/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      credentials: 'include',
      body: data,
    });
  }
}

/**
 * Development Database Adapter (SQLite via sql.js)
 * Delegates to existing database.ts implementation
 */
class DevelopmentDatabaseAdapter implements DatabaseAdapter {
  async getAllCases(): Promise<TeachingCase[]> {
    const { getAllCases } = await import('./database');
    return getAllCases();
  }

  async getCaseById(id: number): Promise<TeachingCase | null> {
    const { getCaseById } = await import('./database');
    return getCaseById(id);
  }

  async addCase(caseData: TeachingCaseInput): Promise<number> {
    const { addCase } = await import('./database');
    return addCase(caseData);
  }

  async updateCase(id: number, caseData: Partial<TeachingCaseInput>): Promise<void> {
    const { updateCase } = await import('./database');
    return updateCase(id, caseData);
  }

  async deleteCase(id: number): Promise<void> {
    const { deleteCase } = await import('./database');
    return deleteCase(id);
  }

  async searchCases(query: { organ?: string; disease?: string; studyNumber?: string }): Promise<TeachingCase[]> {
    const { searchCases } = await import('./database');
    return searchCases(query);
  }

  async exportDatabase(): Promise<Uint8Array> {
    const { exportDatabase } = await import('./database');
    return exportDatabase();
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    const { importDatabase } = await import('./database');
    return importDatabase(data);
  }
}

/**
 * Get the appropriate database adapter based on environment
 */
export function getDatabaseAdapter(): DatabaseAdapter {
  if (isProduction) {
    console.log('🚀 Using Production Database (PostgreSQL)');
    return new ProductionDatabaseAdapter();
  } else {
    console.log('💻 Using Development Database (SQLite)');
    return new DevelopmentDatabaseAdapter();
  }
}

/**
 * Singleton instance
 */
let adapterInstance: DatabaseAdapter | null = null;

export function getDatabase(): DatabaseAdapter {
  if (!adapterInstance) {
    adapterInstance = getDatabaseAdapter();
  }
  return adapterInstance;
}
