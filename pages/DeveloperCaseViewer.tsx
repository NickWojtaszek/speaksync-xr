import React, { useState, useEffect } from 'react';
import { useTeachingCase } from '../context/TeachingCaseContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslations } from '../context/LanguageContext';
import type { TeachingCase } from '../types';

const DeveloperCaseViewer: React.FC = () => {
  const { cases, loading, stats, refreshCases } = useTeachingCase();
  const { currentTheme } = useTheme();
  const { t } = useTranslations();
  const [selectedCase, setSelectedCase] = useState<TeachingCase | null>(null);
  const [filter, setFilter] = useState<'all' | string>('all');

  useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  const organs = Object.keys(stats.byOrgan).sort();
  const filteredCases = filter === 'all'
    ? cases
    : cases.filter(c => c.organCategory === filter);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: currentTheme.colors.bgPrimary }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 border-b px-6 py-4"
        style={{
          backgroundColor: currentTheme.colors.bgSecondary,
          borderBottomColor: currentTheme.colors.borderColor
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.textPrimary }}>
          🔬 Developer Case Viewer
        </h1>
        <p className="text-sm mt-1" style={{ color: currentTheme.colors.textMuted }}>
          View and inspect teaching cases stored in the database
        </p>
      </div>

      {/* Stats Bar */}
      <div
        className="flex-shrink-0 border-b px-6 py-3"
        style={{
          backgroundColor: currentTheme.colors.bgSecondary,
          borderBottomColor: currentTheme.colors.borderColor
        }}
      >
        <div className="flex items-center gap-6">
          <div>
            <span className="text-sm" style={{ color: currentTheme.colors.textMuted }}>
              Total Cases:
            </span>
            <span className="ml-2 text-lg font-bold" style={{ color: currentTheme.colors.accentPrimary }}>
              {stats.total}
            </span>
          </div>
          <div>
            <span className="text-sm" style={{ color: currentTheme.colors.textMuted }}>
              Organs:
            </span>
            <span className="ml-2 text-lg font-bold" style={{ color: currentTheme.colors.accentPrimary }}>
              {organs.length}
            </span>
          </div>
          <div>
            <span className="text-sm" style={{ color: currentTheme.colors.textMuted }}>
              Diseases:
            </span>
            <span className="ml-2 text-lg font-bold" style={{ color: currentTheme.colors.accentPrimary }}>
              {Object.keys(stats.byDisease).length}
            </span>
          </div>
          <button
            onClick={refreshCases}
            className="ml-auto px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentTheme.colors.buttonPrimary,
              color: '#fff'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="flex-shrink-0 border-b px-6 py-3"
        style={{
          backgroundColor: currentTheme.colors.bgSecondary,
          borderBottomColor: currentTheme.colors.borderColor
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'all' ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: filter === 'all'
                ? currentTheme.colors.accentPrimary
                : currentTheme.colors.bgTertiary,
              color: filter === 'all' ? '#fff' : currentTheme.colors.textSecondary,
              ringColor: currentTheme.colors.accentPrimary
            }}
          >
            All ({stats.total})
          </button>
          {organs.map(organ => (
            <button
              key={organ}
              onClick={() => setFilter(organ)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === organ ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: filter === organ
                  ? currentTheme.colors.accentPrimary
                  : currentTheme.colors.bgTertiary,
                color: filter === organ ? '#fff' : currentTheme.colors.textSecondary,
                ringColor: currentTheme.colors.accentPrimary
              }}
            >
              {organ} ({stats.byOrgan[organ]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow min-h-0 grid grid-rows-1 grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 overflow-hidden p-4">
        {/* Case Details - Left 2/3 */}
        <div className="overflow-y-auto p-6 border-r" style={{ borderRightColor: currentTheme.colors.borderColor }}>
          {selectedCase ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.textPrimary }}>
                  Case #{selectedCase.id}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: currentTheme.colors.textMuted }}>Created:</span>
                    <span className="ml-2 font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                      {new Date(selectedCase.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: currentTheme.colors.textMuted }}>Study #:</span>
                    <span className="ml-2 font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                      {selectedCase.studyNumber}
                    </span>
                  </div>
                  {selectedCase.patientPesel && (
                    <div>
                      <span style={{ color: currentTheme.colors.textMuted }}>PESEL:</span>
                      <span className="ml-2 font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                        {selectedCase.patientPesel}
                      </span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: currentTheme.colors.textMuted }}>Organ:</span>
                    <span className="ml-2 font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                      {selectedCase.organCategory}
                    </span>
                  </div>
                  {selectedCase.diseaseClassification && (
                    <div className="col-span-2">
                      <span style={{ color: currentTheme.colors.textMuted }}>Disease:</span>
                      <span className="ml-2 font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                        {selectedCase.diseaseClassification}
                      </span>
                      {selectedCase.diseaseConfidence && (
                        <span className="ml-2 text-xs" style={{ color: currentTheme.colors.textMuted }}>
                          ({Math.round(selectedCase.diseaseConfidence * 100)}% confidence)
                        </span>
                      )}
                    </div>
                  )}
                  {selectedCase.uniquenessRating && (
                    <div className="col-span-2">
                      <span style={{ color: currentTheme.colors.textMuted }}>Uniqueness:</span>
                      <span className="ml-2 inline-flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= selectedCase.uniquenessRating!
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-600'
                            }`}
                            fill={star <= selectedCase.uniquenessRating! ? 'currentColor' : 'none'}
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
                        ))}
                        <span className="ml-2 text-sm font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                          ({selectedCase.uniquenessRating}/5)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pathology Report */}
              {selectedCase.pathologyReport && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 pb-1 border-b" style={{ color: currentTheme.colors.textPrimary, borderBottomColor: currentTheme.colors.borderColor }}>
                    Pathology Report
                  </h3>
                  <div
                    className="p-3 rounded-md text-sm font-mono whitespace-pre-wrap"
                    style={{
                      backgroundColor: currentTheme.colors.bgSecondary,
                      color: currentTheme.colors.textSecondary
                    }}
                  >
                    {selectedCase.pathologyReport}
                  </div>
                </div>
              )}

              {/* Reports */}
              <div className="space-y-4">
                {/* Original Report */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 pb-1 border-b" style={{ color: currentTheme.colors.textPrimary, borderBottomColor: currentTheme.colors.borderColor }}>
                    Original Report
                  </h3>
                  <div
                    className="p-3 rounded-md text-sm font-mono whitespace-pre-wrap"
                    style={{
                      backgroundColor: currentTheme.colors.bgSecondary,
                      color: currentTheme.colors.textSecondary
                    }}
                  >
                    {selectedCase.originalReport}
                  </div>
                </div>

                {/* AI Improved Report */}
                {selectedCase.aiImprovedReport && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 pb-1 border-b" style={{ color: currentTheme.colors.textPrimary, borderBottomColor: currentTheme.colors.borderColor }}>
                      AI Improved Report
                    </h3>
                    <div
                      className="p-3 rounded-md text-sm font-mono whitespace-pre-wrap"
                      style={{
                        backgroundColor: currentTheme.colors.bgSecondary,
                        color: currentTheme.colors.textSecondary
                      }}
                    >
                      {selectedCase.aiImprovedReport}
                    </div>
                  </div>
                )}

                {/* Final User Report */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 pb-1 border-b" style={{ color: currentTheme.colors.textPrimary, borderBottomColor: currentTheme.colors.borderColor }}>
                    Final User Report
                  </h3>
                  <div
                    className="p-3 rounded-md text-sm font-mono whitespace-pre-wrap"
                    style={{
                      backgroundColor: currentTheme.colors.bgSecondary,
                      color: currentTheme.colors.textSecondary
                    }}
                  >
                    {selectedCase.finalUserReport}
                  </div>
                </div>

                {/* Raw JSON */}
                <details>
                  <summary
                    className="text-sm font-semibold cursor-pointer hover:underline"
                    style={{ color: currentTheme.colors.textMuted }}
                  >
                    View Raw JSON
                  </summary>
                  <pre
                    className="mt-2 p-3 rounded-md text-xs overflow-x-auto"
                    style={{
                      backgroundColor: currentTheme.colors.bgSecondary,
                      color: currentTheme.colors.textSecondary
                    }}
                  >
                    {JSON.stringify(selectedCase, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ) : (
            <div
              className="h-full flex items-center justify-center text-center"
              style={{ color: currentTheme.colors.textMuted }}
            >
              <div>
                <div className="text-4xl mb-4">📋</div>
                <p>Select a case from the list to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Cases List - Right 1/3 */}
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center" style={{ color: currentTheme.colors.textMuted }}>
              Loading cases...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-6 text-center" style={{ color: currentTheme.colors.textMuted }}>
              No cases found
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: currentTheme.colors.borderColor }}>
              {filteredCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedCase?.id === c.id ? 'ring-2 ring-inset' : ''
                  }`}
                  style={{
                    backgroundColor: selectedCase?.id === c.id
                      ? currentTheme.colors.bgSecondary
                      : currentTheme.colors.bgPrimary,
                    ringColor: currentTheme.colors.accentPrimary
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: currentTheme.colors.textPrimary }}>
                        Case #{c.id}
                      </div>
                      <div className="text-xs mt-1" style={{ color: currentTheme.colors.textMuted }}>
                        {c.organCategory} • {c.diseaseClassification || 'Unclassified'}
                      </div>
                      <div className="text-xs mt-1" style={{ color: currentTheme.colors.textMuted }}>
                        Study: {c.studyNumber}
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: currentTheme.colors.textMuted }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperCaseViewer;
