
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import type { CustomCommand, AIPromptConfig, ColorSettings, InterestingCase, SettingsData, LayoutDensity, HotkeysConfig, StyleExample, AISettings } from '../types';
import { initialAIPromptConfigs } from '../data/promptData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { useTranslations } from './LanguageContext';
import { initializeAIService } from '../services/aiService';

interface SettingsContextType {
    customCommands: CustomCommand[];
    setCustomCommands: (commands: CustomCommand[]) => void;
    addOrUpdateCustomCommand: (command: Omit<CustomCommand, 'id'>) => void;
    aiPromptConfig: AIPromptConfig;
    setAiPromptConfig: (config: AIPromptConfig) => void;
    aiSettings: AISettings;
    setAISettings: (settings: AISettings) => void;
    colorSettings: ColorSettings;
    setColorSettings: (settings: ColorSettings) => void;
    interestingCases: InterestingCase[];
    deletedFiles: InterestingCase[];
    saveInterestingCase: (caseData: Omit<InterestingCase, 'id' | 'createdAt'> & { id?: string }) => void;
    moveCaseToTrash: (caseId: string) => void;
    restoreCase: (caseId: string) => void;
    permanentlyDeleteCase: (caseId: string) => void;
    layoutDensity: LayoutDensity;
    setLayoutDensity: (density: LayoutDensity) => void;
    hotkeys: HotkeysConfig;
    setHotkeys: (hotkeys: HotkeysConfig) => void;
    styleExamples: StyleExample[];
    addStyleExample: (raw: string, final: string) => void;
    removeStyleExample: (id: string) => void;
    updateStyleExamples: (examples: StyleExample[]) => void;
    clearStyleExamples: () => void;
    isStyleTrainingLimitReached: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialSettingsData: SettingsData = {
    customCommands: [],
    interestingCases: [],
    deletedFiles: [],
    colorSettings: { voice: '#86efac', pasted: '#93c5fd', dragged: '#fde047' },
    aiPromptConfig: initialAIPromptConfigs,
    aiSettings: {
        providers: [],
        defaultProvider: '',
        promptConfig: initialAIPromptConfigs['en']
    },
    layoutDensity: 'comfortable',
    hotkeys: {
        toggleRecord: 'Alt+R',
        triggerAI: 'Alt+A',
        toggleLayout: 'Alt+L'
    },
    styleExamples: []
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { language, t } = useTranslations();
    const { setConfirmationState, closeConfirmation } = useApp();
    const [data, setData] = useLocalStorage<SettingsData>(`speaksync_settings_${currentUser?.id}`, initialSettingsData);

    const setCustomCommands = (newCommands: CustomCommand[]) => {
        setData(prev => ({ ...prev, customCommands: newCommands }));
    };

    const addOrUpdateCustomCommand = (newCommand: Omit<CustomCommand, 'id'>) => {
        const existingIndex = data.customCommands.findIndex(cmd => cmd.spoken.toLowerCase() === newCommand.spoken.toLowerCase());
        let updatedCommands = [...data.customCommands];
        if (existingIndex > -1) {
            updatedCommands[existingIndex] = { ...updatedCommands[existingIndex], replacement: newCommand.replacement };
        } else {
            updatedCommands.push({ ...newCommand, id: crypto.randomUUID() });
        }
        setCustomCommands(updatedCommands);
    };

    const aiPromptConfig = data.aiPromptConfig[language] || initialAIPromptConfigs[language];

    const setAiPromptConfig = (newConfig: AIPromptConfig) => {
        setData(prev => ({
            ...prev,
            aiPromptConfig: { ...prev.aiPromptConfig, [language]: newConfig }
        }));
    };

    const setAISettings = (newSettings: AISettings) => {
        setData(prev => ({ ...prev, aiSettings: newSettings }));
    };

    const setColorSettings = (newColors: ColorSettings) => {
        setData(prev => ({ ...prev, colorSettings: newColors }));
    };
    
    const saveInterestingCase = (caseData: Omit<InterestingCase, 'id' | 'createdAt'> & { id?: string }) => {
        setData(prev => {
            let updatedCases = [...prev.interestingCases];
            if (caseData.id) {
                const index = updatedCases.findIndex(c => c.id === caseData.id);
                if (index > -1) updatedCases[index] = { ...updatedCases[index], ...caseData };
            } else {
                const newCase: InterestingCase = { ...caseData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
                updatedCases.unshift(newCase);
            }
            return { ...prev, interestingCases: updatedCases };
        });
    };
    
    const moveCaseToTrash = (caseId: string) => {
        const caseToMove = data.interestingCases.find(c => c.id === caseId);
        if (!caseToMove) return;
        setData(prev => ({
            ...prev,
            interestingCases: prev.interestingCases.filter(c => c.id !== caseId),
            deletedFiles: [...prev.deletedFiles, caseToMove],
        }));
    };

    const restoreCase = (caseId: string) => {
        const caseToRestore = data.deletedFiles.find(c => c.id === caseId);
        if (!caseToRestore) return;
        setData(prev => ({
            ...prev,
            deletedFiles: prev.deletedFiles.filter(c => c.id !== caseId),
            interestingCases: [...prev.interestingCases, caseToRestore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        }));
    };

    const permanentlyDeleteCase = (caseId: string) => {
        setConfirmationState({
            isOpen: true,
            title: t('confirmModal.title'),
            message: t('settings.trash.deleteConfirm'),
            onConfirm: () => {
                setData(prev => ({ ...prev, deletedFiles: prev.deletedFiles.filter(c => c.id !== caseId) }));
                closeConfirmation();
            }
        });
    };

    const setLayoutDensity = (density: LayoutDensity) => {
        setData(prev => ({ ...prev, layoutDensity: density }));
    };

    const setHotkeys = (hotkeys: HotkeysConfig) => {
        setData(prev => ({ ...prev, hotkeys }));
    };

    const addStyleExample = (raw: string, final: string) => {
        setData(prev => {
            const currentExamples = prev.styleExamples || [];
            // Hard limit at 20 examples
            if (currentExamples.length >= 20) {
                console.warn('⚠️ Style training limit reached (20/20). Please compact examples to continue.');
                return prev;
            }
            const newExample = { id: crypto.randomUUID(), raw, final };
            const updatedExamples = [newExample, ...currentExamples];
            return { ...prev, styleExamples: updatedExamples };
        });
    };

    const removeStyleExample = (id: string) => {
        setData(prev => ({
            ...prev,
            styleExamples: (prev.styleExamples || []).filter(ex => ex.id !== id)
        }));
    };

    const updateStyleExamples = (examples: StyleExample[]) => {
        setData(prev => ({ ...prev, styleExamples: examples }));
    };

    const clearStyleExamples = () => {
        setData(prev => ({ ...prev, styleExamples: [] }));
    };

    const isStyleTrainingLimitReached = (data.styleExamples || []).length >= 20;

    const hotkeys = data.hotkeys || initialSettingsData.hotkeys;

    // Initialize AI service whenever AI settings change
    useEffect(() => {
        const aiSettings = data.aiSettings || initialSettingsData.aiSettings;
        initializeAIService(aiSettings);
    }, [data.aiSettings]);

    const value: SettingsContextType = {
        customCommands: data.customCommands,
        setCustomCommands,
        addOrUpdateCustomCommand,
        aiPromptConfig,
        setAiPromptConfig,
        aiSettings: data.aiSettings || initialSettingsData.aiSettings,
        setAISettings,
        colorSettings: data.colorSettings,
        setColorSettings,
        interestingCases: data.interestingCases,
        deletedFiles: data.deletedFiles,
        saveInterestingCase,
        moveCaseToTrash,
        restoreCase,
        permanentlyDeleteCase,
        layoutDensity: data.layoutDensity || 'comfortable',
        setLayoutDensity,
        hotkeys,
        setHotkeys,
        styleExamples: data.styleExamples || [],
        addStyleExample,
        removeStyleExample,
        updateStyleExamples,
        clearStyleExamples,
        isStyleTrainingLimitReached
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
