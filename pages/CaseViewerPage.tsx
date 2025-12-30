import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTeachingCase } from '../context/TeachingCaseContext';
import ViewContainer from '../components/ViewContainer';
import type { TeachingCase } from '../types';

const CaseViewerPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const { cases, loading, stats, refreshCases } = useTeachingCase();

  const [selectedCase, setSelectedCase] = useState<TeachingCase | null>(null);
  const [filter, setFilter] = useState<'all' | string>('all');

  useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  const organs = Object.keys(stats.byOrgan).sort();
  const filteredCases = filter === 'all'
    ? cases
    : cases.filter(c => c.organCategory === filter);

  // Right panel content: Case metadata + case list
  const rightPanelContent = (
    <div className="flex flex-col gap-6 h-full overflow-auto">
      {/* Case Metadata Section */}
      <div className="rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: currentTheme.colors.bgTertiary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px' }}>
        <div className="p-4 border-b" style={{ borderBottomColor: currentTheme.colors.borderColor }}>
          <h3 className="font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
            Case Information
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {selectedCase ? (
            <>
              <div>
                <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>Case ID</label>
                <div className="text-sm font-semibold" style={{ color: currentTheme.colors.textPrimary }}>#{selectedCase.id}</div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>Study Number</label>
                <div className="text-sm" style={{ color: currentTheme.colors.textPrimary }}>{selectedCase.studyNumber}</div>
              </div>
              {selectedCase.patientPesel && (
                <div>
                  <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>PESEL</label>
                  <div className="text-sm" style={{ color: currentTheme.colors.textPrimary }}>{selectedCase.patientPesel}</div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>Organ Category</label>
                <div className="text-sm" style={{ color: currentTheme.colors.textPrimary }}>{selectedCase.organCategory}</div>
              </div>
              {selectedCase.diseaseClassification && (
                <div>
                  <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>Disease</label>
                  <div className="text-sm" style={{ color: currentTheme.colors.textPrimary }}>
                    {selectedCase.diseaseClassification}
                    {selectedCase.diseaseConfidence && (
                      <span className="ml-2 text-xs" style={{ color: currentTheme.colors.textMuted }}>
                        ({Math.round(selectedCase.diseaseConfidence * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedCase.uniquenessRating && (
                <div>
                  <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>Uniqueness Rating</label>
                  <div className="flex items-center gap-1 mt-1">
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
                    <span className="ml-2 text-sm" style={{ color: currentTheme.colors.textPrimary }}>
                      {selectedCase.uniquenessRating}/5
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium" style={{ color: currentTheme.colors.textMuted }}>Created</label>
                <div className="text-sm" style={{ color: currentTheme.colors.textPrimary }}>
                  {new Date(selectedCase.createdAt).toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-center py-4" style={{ color: currentTheme.colors.textMuted }}>
              Select a case to view details
            </div>
          )}
        </div>
      </div>

      {/* Case List Section */}
      <div className="rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: currentTheme.colors.bgSecondary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px' }}>
        <div className="p-4 border-b" style={{ borderBottomColor: currentTheme.colors.borderColor, borderBottomWidth: '1px' }}>
          <h2 className="text-lg font-bold" style={{ color: currentTheme.colors.textPrimary }}>
            All Cases ({filteredCases.length})
          </h2>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <p style={{ color: currentTheme.colors.textSecondary }} className="text-sm text-center py-4">
              Loading cases...
            </p>
          ) : filteredCases.length === 0 ? (
            <p style={{ color: currentTheme.colors.textSecondary }} className="text-sm text-center py-4">
              No cases found
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    style={{
                      backgroundColor: isSelected ? currentTheme.colors.bgTertiary : 'transparent',
                      borderColor: isSelected ? currentTheme.colors.borderColor : 'transparent',
                      borderWidth: '1px'
                    }}
                    className="w-full text-left p-3 rounded hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: currentTheme.colors.textPrimary }}>
                        Case #{c.id}
                      </span>
                      <div className="flex flex-col gap-1 items-end">
                        {c.uniquenessRating && (
                          <span className="text-xs font-semibold text-yellow-400">
                            {'⭐'.repeat(c.uniquenessRating)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                      {c.organCategory} • {c.diseaseClassification || 'Unclassified'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ViewContainer
      rightPanel={rightPanelContent}
      leftLabel="cases-main"
      rightLabel="cases-right"
    >
      <div className="p-4 h-full overflow-auto flex flex-col">
        {/* Case Details Display */}
        {selectedCase ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.textPrimary }}>
                Case #{selectedCase.id}
              </h2>
              <p className="text-sm" style={{ color: currentTheme.colors.textMuted }}>
                {selectedCase.organCategory} • {selectedCase.diseaseClassification || 'Unclassified'}
              </p>
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
                    backgroundColor: currentTheme.colors.bgTertiary,
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
                    backgroundColor: currentTheme.colors.bgTertiary,
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
                      backgroundColor: currentTheme.colors.bgTertiary,
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
                    backgroundColor: currentTheme.colors.bgTertiary,
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
                    backgroundColor: currentTheme.colors.bgTertiary,
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
    </ViewContainer>
  );
};

export default CaseViewerPage;
