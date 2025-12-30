import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TeachingCase, TeachingCaseInput, OrganCategory } from '../types';
import {
  initializeDatabase,
  insertTeachingCase,
  getAllTeachingCases,
  getTeachingCasesByOrgan,
  getTeachingCasesByDisease,
  getTeachingCaseById,
  deleteTeachingCase as dbDeleteTeachingCase,
  getTeachingCaseStats,
  exportDatabaseFile,
  importDatabaseFile
} from '../utils/database';
import { useAuth } from './AuthContext';

interface TeachingCaseContextType {
  // State
  cases: TeachingCase[];
  loading: boolean;
  stats: {
    total: number;
    byOrgan: Record<string, number>;
    byDisease: Record<string, number>;
  };

  // CRUD Operations
  addCase: (caseData: TeachingCaseInput) => Promise<number>;
  getCaseById: (id: number) => Promise<TeachingCase | undefined>;
  getCasesByOrgan: (organ: OrganCategory) => Promise<TeachingCase[]>;
  getCasesByDisease: (disease: string) => Promise<TeachingCase[]>;
  deleteCase: (id: number) => Promise<void>;
  refreshCases: () => Promise<void>;

  // Export/Import
  exportDatabase: () => Promise<Blob>;
  importDatabase: (file: File) => Promise<void>;
}

const TeachingCaseContext = createContext<TeachingCaseContextType | undefined>(undefined);

export const TeachingCaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<TeachingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byOrgan: {} as Record<string, number>,
    byDisease: {} as Record<string, number>
  });

  // Initialize database and load cases on mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await initializeDatabase();
        await refreshCases();
      } catch (error) {
        console.error('Failed to initialize teaching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Refresh cases and stats from database
  const refreshCases = useCallback(async () => {
    try {
      const allCases = await getAllTeachingCases();
      setCases(allCases);

      const statistics = await getTeachingCaseStats();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to refresh teaching cases:', error);
    }
  }, []);

  // Add a new teaching case
  const addCase = useCallback(async (caseData: TeachingCaseInput): Promise<number> => {
    try {
      const id = await insertTeachingCase({
        ...caseData,
        authorId: currentUser?.id || null
      });
      await refreshCases();
      console.log('✅ Teaching case added:', id);
      return id;
    } catch (error) {
      console.error('Failed to add teaching case:', error);
      throw error;
    }
  }, [currentUser, refreshCases]);

  // Get case by ID
  const getCaseById = useCallback(async (id: number): Promise<TeachingCase | undefined> => {
    try {
      return await getTeachingCaseById(id);
    } catch (error) {
      console.error('Failed to get teaching case:', error);
      return undefined;
    }
  }, []);

  // Get cases by organ
  const getCasesByOrgan = useCallback(async (organ: OrganCategory): Promise<TeachingCase[]> => {
    try {
      return await getTeachingCasesByOrgan(organ);
    } catch (error) {
      console.error('Failed to get cases by organ:', error);
      return [];
    }
  }, []);

  // Get cases by disease
  const getCasesByDisease = useCallback(async (disease: string): Promise<TeachingCase[]> => {
    try {
      return await getTeachingCasesByDisease(disease);
    } catch (error) {
      console.error('Failed to get cases by disease:', error);
      return [];
    }
  }, []);

  // Delete a case
  const deleteCase = useCallback(async (id: number): Promise<void> => {
    try {
      await dbDeleteTeachingCase(id);
      await refreshCases();
      console.log('✅ Teaching case deleted:', id);
    } catch (error) {
      console.error('Failed to delete teaching case:', error);
      throw error;
    }
  }, [refreshCases]);

  // Export database as file
  const exportDatabase = useCallback(async (): Promise<Blob> => {
    try {
      return await exportDatabaseFile();
    } catch (error) {
      console.error('Failed to export database:', error);
      throw error;
    }
  }, []);

  // Import database from file
  const importDatabase = useCallback(async (file: File): Promise<void> => {
    try {
      await importDatabaseFile(file);
      await refreshCases();
      console.log('✅ Database imported successfully');
    } catch (error) {
      console.error('Failed to import database:', error);
      throw error;
    }
  }, [refreshCases]);

  const value: TeachingCaseContextType = {
    cases,
    loading,
    stats,
    addCase,
    getCaseById,
    getCasesByOrgan,
    getCasesByDisease,
    deleteCase,
    refreshCases,
    exportDatabase,
    importDatabase
  };

  return (
    <TeachingCaseContext.Provider value={value}>
      {children}
    </TeachingCaseContext.Provider>
  );
};

export const useTeachingCase = (): TeachingCaseContextType => {
  const context = useContext(TeachingCaseContext);
  if (context === undefined) {
    throw new Error('useTeachingCase must be used within a TeachingCaseProvider');
  }
  return context;
};
