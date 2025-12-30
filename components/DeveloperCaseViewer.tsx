import React, { useState, useEffect } from 'react';
import { XCircleIcon, DocumentTextIcon } from './Icons';
import { getAllTeachingCases } from '../utils/database';
import { useTranslations } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const DeveloperCaseViewer: React.FC = () => {
  const { t } = useTranslations();
  const { currentTheme } = useTheme();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [filterOrgan, setFilterOrgan] = useState<string>('');
  const [filterDisease, setFilterDisease] = useState<string>('');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const caseData = await getAllTeachingCases();
      setCases(caseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    if (filterOrgan && caseItem.organCategory !== filterOrgan) return false;
    if (filterDisease && caseItem.diseaseClassification !== filterDisease) return false;
    return true;
  });

  const organs = Array.from(new Set(cases.map(c => c.organCategory)));
  const diseases = Array.from(new Set(cases.map(c => c.diseaseClassification).filter(Boolean)));
  const selectedCase = selectedCaseId ? cases.find(c => c.id === selectedCaseId) : null;

  return (
    <div className={`h-full flex flex-col ${currentTheme.background} text-white`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-900/50">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DocumentTextIcon className="h-6 w-6 text-blue-400" />
          Developer Case Viewer
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          View and manage all stored teaching cases ({cases.length} total)
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex gap-4 p-4 overflow-hidden">
        {/* Left Panel - Case List */}
        <div className="flex flex-col gap-4 w-96 border border-gray-700 rounded-lg bg-gray-900/30 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-700 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">Filter by Organ</label>
              <select
                value={filterOrgan}
                onChange={(e) => {
                  setFilterOrgan(e.target.value);
                  setSelectedCaseId(null);
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Organs</option>
                {organs.map(organ => (
                  <option key={organ} value={organ}>{organ}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">Filter by Disease</label>
              <select
                value={filterDisease}
                onChange={(e) => {
                  setFilterDisease(e.target.value);
                  setSelectedCaseId(null);
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Diseases</option>
                {diseases.map(disease => (
                  <option key={disease} value={disease}>{disease || 'Unknown'}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadCases}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Case List */}
          <div className="flex-grow overflow-y-auto px-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">{error}</div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No cases found</div>
            ) : (
              filteredCases.map(caseItem => (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedCaseId(caseItem.id)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    selectedCaseId === caseItem.id
                      ? 'bg-blue-600/30 border-blue-500'
                      : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold text-sm">{caseItem.studyNumber}</div>
                  <div className="text-xs text-gray-400 mt-1">{caseItem.organCategory}</div>
                  <div className="text-xs text-blue-300 mt-1">{caseItem.diseaseClassification || 'Unclassified'}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Case Details */}
        <div className="flex-grow flex flex-col border border-gray-700 rounded-lg bg-gray-900/30 overflow-hidden">
          {selectedCase ? (
            <>
              {/* Case Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold">Study #{selectedCase.studyNumber}</h3>
                    <div className="text-sm text-gray-400 mt-2">
                      <p>Organ: <span className="text-blue-300 font-semibold">{selectedCase.organCategory}</span></p>
                      <p>Disease: <span className="text-green-300 font-semibold">{selectedCase.diseaseClassification || 'Unclassified'}</span></p>
                      {selectedCase.diseaseConfidence && (
                        <p>Confidence: <span className="text-yellow-300 font-semibold">{Math.round(selectedCase.diseaseConfidence * 100)}%</span></p>
                      )}
                      <p>Created: <span className="text-gray-300">{new Date(selectedCase.createdAt).toLocaleString()}</span></p>
                      {selectedCase.patientPesel && (
                        <p>PESEL: <span className="text-gray-300 font-mono">{selectedCase.patientPesel}</span></p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCaseId(null)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Reports Tabs */}
              <div className="flex-grow overflow-y-auto flex flex-col">
                <div className="flex border-b border-gray-700">
                  {selectedCase.originalReport && (
                    <button className="flex-1 px-4 py-2 border-b-2 border-red-500 text-red-300 font-semibold text-sm">
                      Original
                    </button>
                  )}
                  {selectedCase.aiImprovedReport && (
                    <button className="flex-1 px-4 py-2 text-gray-400 hover:text-white text-sm">
                      AI Improved
                    </button>
                  )}
                  {selectedCase.finalUserReport && (
                    <button className="flex-1 px-4 py-2 text-gray-400 hover:text-white text-sm">
                      Final User
                    </button>
                  )}
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                  <div className="space-y-4">
                    {/* Original Report */}
                    {selectedCase.originalReport && (
                      <div>
                        <h4 className="font-semibold text-red-300 mb-2">Original Report</h4>
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm font-mono text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {selectedCase.originalReport}
                        </div>
                      </div>
                    )}

                    {/* AI Improved Report */}
                    {selectedCase.aiImprovedReport && (
                      <div>
                        <h4 className="font-semibold text-green-300 mb-2">AI Improved Report</h4>
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-sm font-mono text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {selectedCase.aiImprovedReport}
                        </div>
                      </div>
                    )}

                    {/* Final User Report */}
                    {selectedCase.finalUserReport && (
                      <div>
                        <h4 className="font-semibold text-blue-300 mb-2">Final User Report</h4>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-sm font-mono text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {selectedCase.finalUserReport}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-400">
              <p>Select a case to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperCaseViewer;
