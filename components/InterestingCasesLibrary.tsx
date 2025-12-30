
import React, { useState, useMemo, useEffect } from 'react';
import type { InterestingCase } from '../types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CopyIcon, CheckIcon } from './Icons';
import { useTranslations } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface CaseDetailModalProps {
    caseData: InterestingCase;
    onClose: () => void;
    onEdit: (caseData: InterestingCase) => void;
    onDelete: (caseId: string) => void;
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ caseData, onClose, onEdit, onDelete }) => {
    const { t } = useTranslations();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(caseData.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('library.caseDetails')}</h2>
                        <p className="text-sm text-purple-300">{t('library.studyNumber')}: {caseData.studyNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => onEdit(caseData)} className="p-2 text-blue-300 hover:bg-gray-700 rounded-full" title={t('templates.edit')}><PencilIcon className="h-5 w-5"/></button>
                         <button onClick={() => onDelete(caseData.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded-full" title={t('templates.delete')}><TrashIcon className="h-5 w-5"/></button>
                    </div>
                </header>
                <div className="p-6 flex-grow overflow-y-auto">
                    {caseData.tags.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('library.tags')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {caseData.tags.map(tag => <span key={tag} className="px-3 py-1 text-xs rounded-full bg-blue-900/50 text-blue-300">{tag}</span>)}
                            </div>
                        </div>
                    )}
                     {caseData.notes && (
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('library.notes')}</h3>
                            <p className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-3 rounded-md">{caseData.notes}</p>
                        </div>
                    )}
                     <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-gray-400">{t('library.content')}</h3>
                            <button onClick={handleCopy} className="p-2 text-gray-300 hover:bg-gray-700 rounded-full" title={t('editor.copyText')}>
                                {copied ? <CheckIcon/> : <CopyIcon/>}
                            </button>
                        </div>
                        <pre className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-3 rounded-md font-sans text-sm max-h-[40vh] overflow-y-auto">{caseData.content}</pre>
                    </div>
                </div>
                <footer className="p-4 border-t border-gray-700 flex justify-end">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors">{t('library.close')}</button>
                </footer>
            </div>
        </div>
    );
};

interface InterestingCasesLibraryProps {
  cases: InterestingCase[];
  onBack: () => void;
  onEdit: (caseData: InterestingCase) => void;
  onDelete: (caseId: string) => void;
}

const InterestingCasesLibrary: React.FC<InterestingCasesLibraryProps> = ({ cases, onBack, onEdit, onDelete }) => {
  const { t } = useTranslations();
  const { setConfirmationState, closeConfirmation } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<InterestingCase | null>(null);

  useEffect(() => {
    // If the selected case is no longer in the main list (i.e., it was deleted),
    // close the detail modal.
    if (selectedCase && !cases.find(c => c.id === selectedCase.id)) {
      setSelectedCase(null);
    }
  }, [cases, selectedCase]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cases.forEach(c => c.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchLower === '' ||
        c.studyNumber.toLowerCase().includes(searchLower) ||
        c.notes.toLowerCase().includes(searchLower) ||
        c.content.toLowerCase().includes(searchLower);
      
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => c.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [cases, searchTerm, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleDeleteClick = (caseData: InterestingCase) => {
    setConfirmationState({
      isOpen: true,
      title: t('library.deleteTitle') || 'Delete Case',
      message: t('library.deleteConfirm', { studyNumber: caseData.studyNumber }),
      onConfirm: () => {
        onDelete(caseData.id);
        closeConfirmation();
      }
    });
  };

  return (
    <main className="bg-gray-900 text-gray-200 min-h-screen p-4 font-sans">
      <div className="w-full max-w-7xl mx-auto pb-12">
        <header className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label={t('settings.back')}>
            <ArrowLeftIcon />
          </button>
          <h1 className="text-3xl font-bold text-white">{t('library.title')}</h1>
        </header>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder={t('library.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="md:col-span-3 w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
           {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('library.filterByTag')}</h3>
                <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                        <button 
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                selectedTags.includes(tag)
                                ? 'bg-purple-500 text-white font-bold' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >{tag}</button>
                    ))}
                </div>
            </div>
           )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.length > 0 ? filteredCases.map(c => (
                <div key={c.id} onClick={() => setSelectedCase(c)} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-colors flex flex-col justify-between">
                    <div>
                        <p className="font-bold text-lg text-purple-300">{c.studyNumber}</p>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.notes || t('library.noNotes')}</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                            {c.tags.slice(0, 5).map(tag => <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-blue-900/50 text-blue-300">{tag}</span>)}
                            {c.tags.length > 5 && <span className="text-xs text-gray-500">+{c.tags.length - 5} more</span>}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-right">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
            )) : (
                <div className="col-span-full text-center text-gray-500 py-16">
                    <h3 className="text-xl font-semibold">{t('library.noCasesFound')}</h3>
                    <p>{t('library.noCasesFoundDesc')}</p>
                </div>
            )}
        </div>
      </div>
      {selectedCase && <CaseDetailModal caseData={selectedCase} onClose={() => setSelectedCase(null)} onEdit={onEdit} onDelete={() => handleDeleteClick(selectedCase)} />}
    </main>
  );
};

export default InterestingCasesLibrary;
