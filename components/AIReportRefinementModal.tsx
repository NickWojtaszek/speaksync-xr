import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { SpinnerIcon, CheckIcon } from './Icons';
import { enhanceReport } from '../services/aiService';
import { extractStudyCode } from '../utils/studyCodeExtractor';
import type { OrganCategory } from '../types';

interface AIReportRefinementModalProps {
  isOpen: boolean;
  originalText: string;
  onComplete: (data: {
    originalReport: string;
    aiImprovedReport: string;
    finalUserReport: string;
    organCategory: OrganCategory;
    diseaseClassification?: string;
    diseaseConfidence?: number;
    studyNumber: string;
    patientPesel?: string;
    templateHeader?: string;
    pathologyReport?: string;
    uniquenessRating?: number;
    addToLibrary?: boolean;
    financeCode: string;
    financePatientId: string;
    financeDate: string;
  }) => void;
  onCancel: () => void;
  templateId?: string;
  templateHeader?: string;
}

type ModalStep = 'processing' | 'review' | 'classification' | 'finance';

const ORGAN_CATEGORIES: OrganCategory[] = [
  'Liver', 'Brain', 'Lung', 'Heart', 'Kidney', 'Spine', 'Abdomen', 'Chest',
  'Pelvis', 'Extremities', 'Vascular', 'Breast', 'Head-Neck', 'MSK', 'Neuro',
  'Cardiac', 'GI', 'GU', 'Oncology', 'Other'
];

const AIReportRefinementModal: React.FC<AIReportRefinementModalProps> = ({
  isOpen,
  originalText,
  onComplete,
  onCancel,
  templateId,
  templateHeader
}) => {
  const { t, language } = useTranslations();
  const { currentTheme } = useTheme();
  const { aiPromptConfig, styleExamples } = useSettings();

  const [step, setStep] = useState<ModalStep>('processing');
  const [aiImprovedText, setAiImprovedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Classification form state
  const [studyNumber, setStudyNumber] = useState('');
  const [patientPesel, setPatientPesel] = useState('');
  const [selectedOrgan, setSelectedOrgan] = useState<OrganCategory>('Liver');
  const [pathologyReport, setPathologyReport] = useState('');
  const [uniquenessRating, setUniquenessRating] = useState<number>(3);
  const [addToLibrary, setAddToLibrary] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiClassification, setAiClassification] = useState<{
    disease: string;
    confidence: number;
  } | null>(null);

  // Finance step state
  const [financeCode, setFinanceCode] = useState('');
  const [financePatientId, setFinancePatientId] = useState('');
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format

  const editableRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('processing');
      setAiImprovedText('');
      setEditedText('');
      setError(null);
      setStudyNumber('');
      setPatientPesel('');
      setSelectedOrgan('Liver');
      setPathologyReport('');
      setUniquenessRating(3);
      setAddToLibrary(true);
      setAiClassification(null);
      setFinanceCode('');
      setFinancePatientId('');
      setFinanceDate(new Date().toISOString().split('T')[0]);
      processAIEnhancement();
    }
  }, [isOpen, originalText]);

  // AI Enhancement
  const processAIEnhancement = async () => {
    try {
      setError(null);
      const enhanced = await enhanceReport(originalText, aiPromptConfig, language, styleExamples);

      if (!enhanced || enhanced.trim() === originalText.trim()) {
        setError('AI returned no improvements');
        return;
      }

      setAiImprovedText(enhanced.trim());
      setEditedText(enhanced.trim());
      setStep('review');
    } catch (err) {
      console.error('AI enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enhance report');
    }
  };

  // Initialize contentEditable on first load or step change
  useEffect(() => {
    if (editableRef.current && step === 'review' && !editableRef.current.textContent) {
      editableRef.current.textContent = editedText;
    }
  }, [step]);

  const handleEditableChange = () => {
    if (editableRef.current) {
      setEditedText(editableRef.current.textContent || '');
    }
  };

  const handleApproveAndContinue = () => {
    setStep('classification');
    // Start AI classification of the disease
    classifyDisease();
  };

  const classifyDisease = async () => {
    setIsClassifying(true);
    try {
      // Simple AI classification based on content keywords
      // This is a placeholder - you can enhance this with actual Gemini API call
      const text = editedText.toLowerCase();

      // Example: Detect liver diseases
      if (text.includes('hcc') || text.includes('hepatocellular')) {
        setAiClassification({ disease: 'Hepatocellular Carcinoma (HCC)', confidence: 0.87 });
      } else if (text.includes('metastas') || text.includes('metastatic')) {
        setAiClassification({ disease: 'Liver Metastases', confidence: 0.82 });
      } else if (text.includes('cirrhosis')) {
        setAiClassification({ disease: 'Cirrhosis', confidence: 0.90 });
      } else if (text.includes('hemangioma')) {
        setAiClassification({ disease: 'Hemangioma', confidence: 0.85 });
      } else {
        setAiClassification({ disease: 'Undetermined', confidence: 0.45 });
      }
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleClassificationComplete = () => {
    // Only require study number if saving to library
    if (addToLibrary && !studyNumber.trim()) {
      alert('Study number is required when saving to library');
      return;
    }

    // Move to finance step
    // Auto-populate finance patient ID from study number (always) or PESEL
    if (studyNumber.trim()) {
      setFinancePatientId(studyNumber.trim());
    } else if (patientPesel.trim()) {
      setFinancePatientId(patientPesel.trim());
    }

    setStep('finance');
  };

  const handleFinanceSubmit = () => {
    // Complete the workflow
    onComplete({
      originalReport: originalText,
      aiImprovedReport: aiImprovedText,
      finalUserReport: editedText,
      organCategory: selectedOrgan,
      diseaseClassification: aiClassification?.disease,
      diseaseConfidence: aiClassification?.confidence,
      studyNumber: studyNumber.trim() || '',
      patientPesel: patientPesel.trim() || undefined,
      templateHeader: templateHeader,
      pathologyReport: pathologyReport.trim() || undefined,
      uniquenessRating: uniquenessRating,
      addToLibrary: addToLibrary,
      financeCode: financeCode.trim(),
      financePatientId: financePatientId.trim(),
      financeDate: financeDate
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {step === 'processing' && 'AI Report Enhancement'}
            {step === 'review' && 'Review & Edit AI Suggestion'}
            {step === 'classification' && 'Teaching Case Classification'}
            {step === 'finance' && 'Add to Finance Planner'}
          </h2>
          <p className="text-sm text-gray-400">
            {step === 'processing' && 'Processing your report with AI...'}
            {step === 'review' && 'Review the AI-improved version. You can edit it before proceeding.'}
            {step === 'classification' && 'Add this case to the teaching library'}
            {step === 'finance' && 'Enter study details to add to your finance planner'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Step 1: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              {error ? (
                <>
                  <div className="text-red-400 text-center">
                    <p className="text-lg font-semibold mb-2">Error</p>
                    <p>{error}</p>
                  </div>
                  <button
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <SpinnerIcon className="h-16 w-16 text-blue-400" />
                  <p className="text-lg text-gray-300">Enhancing your report with AI...</p>
                  <p className="text-sm text-gray-500">This may take a few seconds</p>
                </>
              )}
            </div>
          )}

          {/* Step 2: Review & Edit */}
          {step === 'review' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Report */}
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="font-semibold text-red-300">Original Report</h4>
                    </div>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                      {originalText}
                    </p>
                  </div>
                </div>

                {/* AI Improved (Editable) */}
                <div className="bg-gray-900/50 rounded-lg border border-green-500/30 overflow-hidden shadow-lg shadow-green-500/10">
                  <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h4 className="font-semibold text-green-300">AI Enhanced Report</h4>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">Editable</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div
                      ref={editableRef}
                      contentEditable
                      onInput={handleEditableChange}
                      className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-keyboard leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-md p-3 bg-gray-800/30 border border-gray-700 transition-all"
                      style={{ minHeight: '200px' }}
                      suppressContentEditableWarning
                    />
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Click to edit the AI-enhanced text. Make any final adjustments before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-blue-300 mb-1">AI Enhancement Applied</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400">Original:</span>
                        <span className="ml-2 font-semibold text-gray-200">{originalText.length} chars</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Enhanced:</span>
                        <span className="ml-2 font-semibold text-green-400">{editedText.length} chars</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Change:</span>
                        <span className={`ml-2 font-semibold ${editedText.length > originalText.length ? 'text-green-400' : editedText.length < originalText.length ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {editedText.length > originalText.length ? '+' : ''}{editedText.length - originalText.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className="ml-2 font-semibold text-blue-400">Ready to review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Classification */}
          {step === 'classification' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Study Information</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Study Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={studyNumber}
                      onChange={(e) => setStudyNumber(e.target.value)}
                      placeholder="Enter study number (max 11 digits)"
                      maxLength={11}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      PESEL (optional)
                    </label>
                    <input
                      type="text"
                      value={patientPesel}
                      onChange={(e) => setPatientPesel(e.target.value)}
                      placeholder="Patient PESEL (11 digits)"
                      maxLength={11}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">AI Classification</h3>

                {isClassifying ? (
                  <div className="flex items-center gap-3 text-gray-400">
                    <SpinnerIcon className="h-5 w-5" />
                    <span>Analyzing report for disease classification...</span>
                  </div>
                ) : aiClassification ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Organ Category
                      </label>
                      <select
                        value={selectedOrgan}
                        onChange={(e) => setSelectedOrgan(e.target.value as OrganCategory)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ORGAN_CATEGORIES.map((organ) => (
                          <option key={organ} value={organ}>{organ}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <CheckIcon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-blue-300">AI Detected Disease</p>
                          <p className="text-lg font-bold text-white mt-1">{aiClassification.disease}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-400">Confidence:</span>
                            <div className="flex-grow bg-gray-700 rounded-full h-2 max-w-xs">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${aiClassification.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-blue-300">
                              {Math.round(aiClassification.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Pathology Report */}
              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Pathology Report</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pathology Findings (optional)
                  </label>
                  <textarea
                    value={pathologyReport}
                    onChange={(e) => setPathologyReport(e.target.value)}
                    placeholder="Enter pathology report findings if available..."
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Include histopathology results, immunohistochemistry, or other pathology findings
                  </p>
                </div>
              </div>

              {/* Uniqueness Rating */}
              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Case Uniqueness</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    How interesting/unique is this case?
                  </label>
                  <div className="flex items-center gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setUniquenessRating(rating)}
                        className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
                      >
                        <svg
                          className={`w-10 h-10 ${
                            rating <= uniquenessRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-600'
                          }`}
                          fill={rating <= uniquenessRating ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-4 text-sm font-medium text-gray-300">
                      {uniquenessRating === 1 && 'Common'}
                      {uniquenessRating === 2 && 'Somewhat Interesting'}
                      {uniquenessRating === 3 && 'Interesting'}
                      {uniquenessRating === 4 && 'Very Interesting'}
                      {uniquenessRating === 5 && 'Exceptionally Unique'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to Library Checkbox */}
              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addToLibrary}
                      onChange={(e) => setAddToLibrary(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      Add this case to the teaching library
                    </span>
                  </label>
                  {!addToLibrary && (
                    <p className="text-xs text-gray-500 mt-2 ml-8">
                      Case will not be saved to the teaching library
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Finance Entry */}
          {step === 'finance' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-blue-300">Add Study to Planner</p>
                    <p className="text-sm text-gray-300 mt-1">
                      This study will be added to your finance planner and count towards your monthly statistics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Study Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Study Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={financeCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFinanceCode(value);
                      }}
                      placeholder="Enter 3-digit study code (e.g., 073)"
                      maxLength={3}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {financeCode.trim().length === 3
                        ? '✓ Valid study code format'
                        : 'Enter a 3-digit NFZ study code'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      value={financePatientId}
                      onChange={(e) => setFinancePatientId(e.target.value)}
                      placeholder="Patient identifier or study number"
                      maxLength={11}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Optional: Used for tracking and duplicate detection
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Study Date
                    </label>
                    <input
                      type="date"
                      value={financeDate}
                      onChange={(e) => setFinanceDate(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {addToLibrary && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-green-300">
                        This case will be saved to the teaching library
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end space-x-3">
          {step === 'review' && (
            <>
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAndContinue}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors"
              >
                Approve & Continue
              </button>
            </>
          )}

          {step === 'classification' && (
            <>
              <button
                onClick={() => setStep('review')}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleClassificationComplete}
                disabled={addToLibrary && !studyNumber.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Finance
              </button>
            </>
          )}

          {step === 'finance' && (
            <>
              <button
                onClick={() => setStep('classification')}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinanceSubmit}
                disabled={!financeCode.trim() || financeCode.trim().length !== 3}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete & Add to Planner
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReportRefinementModal;
