import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Study,
  Report,
  TeachingCase,
  VerificationRecord,
  AccountingRecord,
  UserSettings
} from '../types';

/**
 * Supabase Storage Service
 *
 * Handles all data persistence using Supabase backend.
 * Automatically falls back to localStorage if Supabase is not configured.
 */

export class SupabaseStorageService {
  private static fallbackToLocalStorage = !isSupabaseConfigured();

  // ============================================================================
  // USER SETTINGS
  // ============================================================================

  static async saveSettings(userId: string, settings: UserSettings): Promise<void> {
    if (this.fallbackToLocalStorage) {
      localStorage.setItem(`speaksync_settings_${userId}`, JSON.stringify(settings));
      return;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving settings to Supabase:', error);
      throw error;
    }
  }

  static async loadSettings(userId: string): Promise<UserSettings | null> {
    if (this.fallbackToLocalStorage) {
      const data = localStorage.getItem(`speaksync_settings_${userId}`);
      return data ? JSON.parse(data) : null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error loading settings from Supabase:', error);
      return null;
    }

    return data?.settings || null;
  }

  // ============================================================================
  // STUDIES
  // ============================================================================

  static async saveStudies(userId: string, studies: Study[]): Promise<void> {
    if (this.fallbackToLocalStorage) {
      localStorage.setItem(`speaksync_studies_${userId}`, JSON.stringify(studies));
      return;
    }

    // Delete existing studies for this user
    await supabase
      .from('studies')
      .delete()
      .eq('user_id', userId);

    // Insert new studies
    const studiesData = studies.map(study => ({
      user_id: userId,
      study_code: study.code,
      patient_id: study.patientId || null,
      description: study.description || null,
      points: study.points || null,
      study_date: study.date || null,
    }));

    const { error } = await supabase
      .from('studies')
      .insert(studiesData);

    if (error) {
      console.error('Error saving studies to Supabase:', error);
      throw error;
    }
  }

  static async loadStudies(userId: string): Promise<Study[]> {
    if (this.fallbackToLocalStorage) {
      const data = localStorage.getItem(`speaksync_studies_${userId}`);
      return data ? JSON.parse(data) : [];
    }

    const { data, error } = await supabase
      .from('studies')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading studies from Supabase:', error);
      return [];
    }

    return data.map(row => ({
      code: row.study_code,
      patientId: row.patient_id,
      description: row.description,
      points: row.points,
      date: row.study_date,
    }));
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  static async saveReports(reports: Report[]): Promise<void> {
    if (this.fallbackToLocalStorage) {
      localStorage.setItem('speaksync_reports', JSON.stringify(reports));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // For simplicity, we'll store reports as JSONB
    // In production, you might want a more normalized structure
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings: { reports },
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving reports to Supabase:', error);
      throw error;
    }
  }

  static async loadReports(): Promise<Report[]> {
    if (this.fallbackToLocalStorage) {
      const data = localStorage.getItem('speaksync_reports');
      return data ? JSON.parse(data) : [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single();

    if (error) return [];
    return data?.settings?.reports || [];
  }

  // ============================================================================
  // TEACHING CASES
  // ============================================================================

  static async saveTeachingCase(userId: string, teachingCase: TeachingCase): Promise<void> {
    if (this.fallbackToLocalStorage) {
      // Fallback to localStorage (existing implementation)
      const cases = this.loadAllTeachingCases(userId);
      const index = cases.findIndex(c => c.id === teachingCase.id);
      if (index >= 0) {
        cases[index] = teachingCase;
      } else {
        cases.push(teachingCase);
      }
      localStorage.setItem(`speaksync_teaching_cases_${userId}`, JSON.stringify(cases));
      return;
    }

    const { error } = await supabase
      .from('teaching_cases')
      .upsert({
        id: teachingCase.id,
        user_id: userId,
        study_number: teachingCase.studyNumber,
        original_report: teachingCase.originalReport,
        ai_improved_report: teachingCase.aiImprovedReport,
        final_report: teachingCase.finalReport,
        organ_classification: teachingCase.organClassification,
        disease_classification: teachingCase.diseaseClassification,
        confidence_score: teachingCase.confidenceScore,
        tags: teachingCase.tags,
        notes: teachingCase.notes,
        uniqueness_rating: teachingCase.uniquenessRating,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving teaching case to Supabase:', error);
      throw error;
    }
  }

  static loadAllTeachingCases(userId: string): TeachingCase[] {
    if (this.fallbackToLocalStorage) {
      const data = localStorage.getItem(`speaksync_teaching_cases_${userId}`);
      return data ? JSON.parse(data) : [];
    }

    // Note: This is synchronous for backward compatibility
    // In practice, you should use async version
    console.warn('loadAllTeachingCases should be async when using Supabase');
    return [];
  }

  static async loadAllTeachingCasesAsync(userId: string): Promise<TeachingCase[]> {
    if (this.fallbackToLocalStorage) {
      const data = localStorage.getItem(`speaksync_teaching_cases_${userId}`);
      return data ? JSON.parse(data) : [];
    }

    const { data, error } = await supabase
      .from('teaching_cases')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading teaching cases from Supabase:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      studyNumber: row.study_number,
      originalReport: row.original_report,
      aiImprovedReport: row.ai_improved_report,
      finalReport: row.final_report,
      organClassification: row.organ_classification,
      diseaseClassification: row.disease_classification,
      confidenceScore: row.confidence_score,
      tags: row.tags,
      notes: row.notes,
      uniquenessRating: row.uniqueness_rating,
      createdAt: row.created_at,
    }));
  }

  // ============================================================================
  // HELPER: Get Current User ID
  // ============================================================================

  static async getCurrentUserId(): Promise<string | null> {
    if (this.fallbackToLocalStorage) {
      return 'local-user'; // Fallback user ID for localStorage
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }
}
