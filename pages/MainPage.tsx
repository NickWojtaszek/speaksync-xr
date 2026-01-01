import React, { useState, useMemo } from 'react';
import { CogIcon, PlusIcon, LanguageIcon, LibraryIcon, VerticalSplitIcon, HorizontalSplitIcon, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, XCircleIcon, StarIcon, DocumentTextIcon } from '../components/Icons';
import StudyTypesAndTemplatesPanel from '../components/StudyTypesAndTemplatesPanel';
import EditorPanel from '../components/EditorPanel';
import TemplateModal from '../components/TemplateModal';
import InterestingCaseModal from '../components/InterestingCaseModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PlannerView from '../components/planner/PlannerView';
import CaseViewerPage from './CaseViewerPage';
import ReportGenerator from '../components/studyManager/ReportGenerator';
import VerifierDashboard from '../components/VerifierDashboard';
import AccountingDashboard from '../components/AccountingDashboard';
import FinancialReportGenerator from '../components/FinancialReportGenerator';
import ReportSubmissionPage from '../pages/ReportSubmissionPage';
import { RemoteMicrophonePanel } from '../components/RemoteMicrophonePanel';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import UserMenu from '../components/UserMenu';
import ViewContainer from '../components/ViewContainer';

import { useTranslations } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { usePINAuth } from '../context/PINAuthContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import type { Template, RadiologyCode } from '../types';

type MainTab = 'editor' | 'planner' | 'codes' | 'cases' | 'reports' | 'financialReports';

const MainPage: React.FC = () => {
    const { t } = useTranslations();
    const { setView, confirmationState, setConfirmationState, closeConfirmation, templateModal, caseModal } = useApp();
    const { layoutDensity } = useSettings();
    const { radiologyCodes, setRadiologyCodes, studies, personalInfo, setPersonalInfo, generatedReports, addGeneratedReport, deleteGeneratedReport } = useStudy();
    const themeStyles = useThemeStyles();
    const { currentTheme } = useTheme();
    const { currentUser } = usePINAuth();

    // Verifier only has access to reports
    // Accounting has access to reports & financial reports tabs
    // Regular users have access to all tabs
    const isVerifier = currentUser?.role === 'verifier';
    const isAccounting = currentUser?.role === 'accounting';
    const availableTabs: MainTab[] = isVerifier ? ['reports'] : (isAccounting ? ['reports', 'financialReports'] : ['editor', 'planner', 'codes', 'cases', 'reports']);

    const [activeTab, setActiveTab] = useState<MainTab>(isVerifier || isAccounting ? 'reports' : 'editor');
    const [text, setText] = useState<string>('');
    const [comparisonText, setComparisonText] = useState<string>('');
    const [loadedTemplate, setLoadedTemplate] = useState<Template | null>(null);
    const [layoutMode, setLayoutMode] = useState<'normal' | 'split-vertical' | 'split-horizontal'>('normal');
    const [mainLayout, setMainLayout] = useState<'columns' | 'rows'>('columns');
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
    const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);
    const [previewTemplateTitle, setPreviewTemplateTitle] = useState<string>('');
    const [codesEditingCode, setCodesEditingCode] = useState<RadiologyCode | null>(null);
    const [codesFormData, setCodesFormData] = useState<RadiologyCode | null>(null);

    const hasText = useMemo(() => text.replace(/<[^>]*>?/gm, '').trim().length > 0, [text]);
    const hasUnsavedChanges = useMemo(() => {
        // Check if there's any meaningful text content in the editor
        return text.replace(/<[^>]*>?/gm, '').trim().length > 0;
    }, [text]);

    const handleSelectTemplate = (template: Template) => {
        const loadTemplate = () => {
            setText(`<span class="text-template">${template.content}</span>`);
            setLoadedTemplate(template);
            if (activeTab !== 'editor') setActiveTab('editor');
        };

        if (hasUnsavedChanges) {
            setConfirmationState({
                isOpen: true,
                title: 'Load Template?',
                message: 'You have unsaved content in the editor. Loading this template will replace it. Continue?',
                onConfirm: () => {
                    loadTemplate();
                    closeConfirmation();
                }
            });
        } else {
            loadTemplate();
        }
    };

    const handlePreviewTemplate = (template: Template) => {
        if (previewTemplateId === template.id && layoutMode !== 'normal') {
            setComparisonText('');
            setLayoutMode('normal');
            setPreviewTemplateId(null);
            setPreviewTemplateTitle('');
        } else {
            setComparisonText(template.content);
            setPreviewTemplateId(template.id);
            setPreviewTemplateTitle(template.title);
            if (layoutMode === 'normal') {
                setLayoutMode('split-vertical');
            }
        }
    };

    const handleClearEditor = () => {
        if (hasUnsavedChanges) {
            setConfirmationState({
                isOpen: true,
                title: 'Clear Editor?',
                message: 'You have unsaved content in the editor. Are you sure you want to clear it?',
                onConfirm: () => {
                    setText('');
                    setLoadedTemplate(null);
                    closeConfirmation();
                }
            });
        } else {
            setText('');
            setLoadedTemplate(null);
        }
    };

    const handleTabChange = (newTab: MainTab) => {
        if (activeTab === 'editor' && newTab !== 'editor' && hasUnsavedChanges) {
            setConfirmationState({
                isOpen: true,
                title: 'Unsaved Changes',
                message: 'You have unsaved content in the editor. Are you sure you want to leave this tab?',
                onConfirm: () => {
                    setActiveTab(newTab);
                    closeConfirmation();
                }
            });
        } else {
            setActiveTab(newTab);
        }
    };

    const handleOpenModal = () => {
        templateModal.setEditingTemplate(null);
        templateModal.setIsOpen(true);
    };

    const [showRemoteMicTest, setShowRemoteMicTest] = useState(false);

    const handleAddToLibrary = () => {
        caseModal.setEditingCase(null);
        caseModal.setIsCaseModalOpen(true);
    };
    
    const toggleMainLayout = () => {
        setMainLayout(prev => (prev === 'columns' ? 'rows' : 'columns'));
    };

    const handleCycleLayoutMode = () => {
        setLayoutMode(prev => {
            if (prev === 'normal') return 'split-vertical';
            if (prev === 'split-vertical') return 'split-horizontal';
            return 'normal';
        });
    };

    const sidebarWidth = useMemo(() => {
        switch (layoutDensity) {
            case 'compact': return '320px';
            case 'spacious': return '500px';
            default: return '420px';
        }
    }, [layoutDensity]);

    const mainGridClasses = useMemo(() => {
        if (isPanelCollapsed) {
            return 'grid-cols-1';
        }
        // Unified width approach: editor content takes ~66% (lg:w-2/3), sidebar takes ~34% (lg:w-1/3)
        // This matches the planner's proportion and creates consistent app-wide layout
        return mainLayout === 'columns'
            ? `grid-rows-[2fr_1fr] lg:grid-rows-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`
            : 'grid-rows-[2fr_1fr]';
    }, [mainLayout, isPanelCollapsed]);

    const gapClass = layoutDensity === 'compact' ? 'gap-2' : 'gap-4';

    const renderContent = () => {
        switch (activeTab) {
            case 'planner':
                return (
                    <div className="relative w-full h-full">
                        <PlannerView />
                        {import.meta.env.VITE_DEV_BADGES === 'true' && (
                            <div className="absolute bottom-1 left-2 px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-700 text-white opacity-80 pointer-events-none">
                                planner
                            </div>
                        )}
                    </div>
                );
            case 'codes':
                return (
                    <ViewContainer 
                        leftLabel="codes-main" 
                        rightLabel="codes-right"
                        rightPanel={
                            codesEditingCode && codesFormData ? (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-lg font-bold text-white">Edit Code</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
                                        <input
                                            type="text"
                                            value={codesFormData.code}
                                            onChange={(e) => setCodesFormData({...codesFormData, code: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Code</label>
                                        <input
                                            type="text"
                                            value={codesFormData.fullCode}
                                            onChange={(e) => setCodesFormData({...codesFormData, fullCode: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Points</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={codesFormData.points}
                                            onChange={(e) => setCodesFormData({...codesFormData, points: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                        <textarea
                                            value={codesFormData.desc}
                                            onChange={(e) => setCodesFormData({...codesFormData, desc: e.target.value})}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={codesFormData.category}
                                            onChange={(e) => setCodesFormData({...codesFormData, category: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <button
                                            onClick={() => {
                                                if (!codesFormData.code || !codesFormData.desc) {
                                                    alert('Code and Description are required');
                                                    return;
                                                }
                                                const updated = radiologyCodes.map(c =>
                                                    c.code === codesEditingCode.code ? codesFormData : c
                                                );
                                                setRadiologyCodes(updated);
                                                setCodesEditingCode(null);
                                                setCodesFormData(null);
                                            }}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCodesEditingCode(null);
                                                setCodesFormData(null);
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : null
                        }
                    >
                        <div className="p-4 h-full overflow-auto flex flex-col">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('studyManager.codesDictionaryTitle')}</h2>
                            <table className="w-full text-left">
                                <thead className="bg-gray-900/80 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-gray-300">{t('studyManager.table.code')}</th>
                                        <th className="p-3 text-sm font-semibold text-gray-300">Full Code</th>
                                        <th className="p-3 text-sm font-semibold text-gray-300">{t('studyManager.table.points')}</th>
                                        <th className="p-3 text-sm font-semibold text-gray-300">{t('studyManager.table.category')}</th>
                                        <th className="p-3 text-sm font-semibold text-gray-300 w-16">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {radiologyCodes.map(c => (
                                        <tr key={c.code} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                            <td className="p-3 font-mono text-purple-300 font-bold">{c.code}</td>
                                            <td className="p-3 text-gray-300 text-sm">{c.fullCode}</td>
                                            <td className="p-3 text-gray-300">{c.points.toFixed(1)}</td>
                                            <td className="p-3 text-gray-400 text-sm">{c.category}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => {
                                                        setCodesEditingCode(c);
                                                        setCodesFormData({...c});
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ViewContainer>
                );
            case 'cases':
                return (
                    <div className="relative w-full h-full overflow-hidden">
                        <CaseViewerPage />
                    </div>
                );
            case 'financialReports':
                return (
                    <ViewContainer leftLabel="financial-main" rightLabel="financial-right">
                        <div className="p-4 h-full overflow-auto">
                            <FinancialReportGenerator />
                        </div>
                    </ViewContainer>
                );
            case 'reports':
                // Accounting users see the accounting dashboard
                if (isAccounting) {
                    return (
                        <ViewContainer leftLabel="accounting-main" rightLabel="accounting-right">
                            <div className="p-4 h-full overflow-auto">
                                <AccountingDashboard />
                            </div>
                        </ViewContainer>
                    );
                }
                // Verifiers see the verification dashboard
                if (isVerifier) {
                    return (
                        <ViewContainer leftLabel="verifier-main" rightLabel="verifier-right">
                            <div className="p-4 h-full overflow-auto">
                                <VerifierDashboard />
                            </div>
                        </ViewContainer>
                    );
                }
                // Users see report submission page
                return <ReportSubmissionPage />;
            case 'editor':
            default:
                return (
                    <div className={`relative flex-grow min-h-0 grid ${gapClass} ${mainGridClasses} h-full`}>
                        <div className="relative h-full min-h-0 min-w-0">
                            <EditorPanel 
                                text={text} 
                                setText={setText}
                                onClear={handleClearEditor}
                                loadedTemplate={loadedTemplate}
                                layoutMode={layoutMode}
                                setLayoutMode={setLayoutMode}
                                comparisonText={comparisonText}
                                setComparisonText={setComparisonText}
                                comparisonTitle={previewTemplateTitle}
                                remoteAudioStream={remoteAudioStream}
                            />
                            {import.meta.env.VITE_DEV_BADGES === 'true' && (
                                <div className="absolute bottom-1 left-2 px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-700 text-white opacity-80 pointer-events-none">
                                    editor-main
                                </div>
                            )}
                        </div>
                        <div className={`relative ${isPanelCollapsed ? 'hidden' : ''} h-full min-h-0 min-w-0`}>
                            <StudyTypesAndTemplatesPanel 
                                onSelectTemplate={handleSelectTemplate} 
                                onPreviewTemplate={handlePreviewTemplate}
                            />
                            {import.meta.env.VITE_DEV_BADGES === 'true' && (
                                <div className="absolute bottom-1 left-2 px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-700 text-white opacity-80 pointer-events-none">
                                    editor-templates
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleOpenModal} 
                            style={{ backgroundColor: currentTheme.colors.buttonPrimary }} className="fixed bottom-8 right-8 w-16 h-16 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none z-20" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary}
                            aria-label={t('app.addTemplate')}
                        >
                            <PlusIcon />
                        </button>
                    </div>
                );
        }
    };

    return (
        <>
            <main 
              className="h-screen w-screen flex flex-col font-sans overflow-hidden"
              style={{
                ...themeStyles.mainBg,
              }}
            >
                <header 
                  className="flex-shrink-0 flex items-center px-4 py-2 border-b z-10"
                  style={{
                    backgroundColor: themeStyles.header.backgroundColor,
                    borderBottomColor: themeStyles.header.borderBottomColor,
                    borderBottomWidth: '1px',
                  }}
                >
                    <div className="flex items-center gap-6 mr-8">
                        <h1 
                          className="text-xl font-bold whitespace-nowrap"
                          style={{ color: themeStyles.textPrimary.color }}
                        >
                          {t('app.title')}
                        </h1>
                    </div>

                    {/* Navigation Tabs */}
                    <nav 
                      className="flex items-center gap-1 p-1 rounded-lg"
                      style={{ backgroundColor: themeStyles.nav.backgroundColor }}
                    >
                        {availableTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    activeTab === tab
                                    ? null
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                }`}
                            >
                                {tab === 'reports' && isAccounting
                                    ? 'Reports & Accounting'
                                    : tab === 'financialReports'
                                    ? 'Financial Reports'
                                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>

                    <div className="flex-grow"></div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'editor' && (
                            <>
                                <button onClick={handleAddToLibrary} disabled={!hasText} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-yellow-600/20 text-yellow-300 border border-yellow-500/30 rounded-md hover:bg-yellow-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                                    <StarIcon className="h-4 w-4"/> <span className="hidden lg:inline">{t('library.addToLibrary')}</span>
                                </button>
                                <div className="h-6 w-px bg-gray-700 mx-1"></div>
                                <button onClick={handleCycleLayoutMode} title={t('main.toggleLayout')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                                    {layoutMode === 'normal' ? <VerticalSplitIcon className="h-5 w-5" /> : (layoutMode === 'split-vertical' ? <HorizontalSplitIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />)}
                                </button>
                                <button onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                                    {isPanelCollapsed ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                                </button>
                            </>
                        )}
                        <button onClick={() => setView('library')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label={t('library.title')}>
                            <LibraryIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => setView('devcases')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label="Developer Case Viewer" title="Developer Case Viewer 🔬">
                            🔬
                        </button>
                        <button onClick={() => setShowRemoteMicTest(!showRemoteMicTest)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label="Test Remote Microphone" title="Test Remote Microphone">
                            🎙️
                        </button>
                        <ThemeSwitcher />
                        <button onClick={() => setView('settings')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label={t('settings.title')}>
                            <CogIcon className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-px bg-gray-700 mx-1"></div>
                        <UserMenu />
                    </div>
                </header>
                
                <div className="flex-grow min-h-0 overflow-hidden relative p-4">
                    {showRemoteMicTest && (
                        <div className="mb-4 rounded-lg p-4" style={{ borderColor: currentTheme.colors.accentPrimary, borderWidth: '1px', backgroundColor: `${currentTheme.colors.accentPrimary}15` }}>
                            <RemoteMicrophonePanel 
                                signalingServerUrl="ws://localhost:8080"
                                onAudioStreamReceived={setRemoteAudioStream}
                                onDisconnect={() => setRemoteAudioStream(null)}
                            />
                        </div>
                    )}
                    {renderContent()}
                </div>
            </main>

            {/* Global Modals */}
            <TemplateModal />
            <InterestingCaseModal initialContent={text} />
            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                message={confirmationState.message}
                onConfirm={confirmationState.onConfirm}
                onClose={closeConfirmation}
            />
        </>
    );
};

export default MainPage;
