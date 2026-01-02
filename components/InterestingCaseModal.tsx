import React, { useState, useEffect } from 'react';
import type { InterestingCase } from '../types';
import { useTranslations } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';

interface InterestingCaseModalProps {
  initialContent: string;
}

const InterestingCaseModal: React.FC<InterestingCaseModalProps> = ({ initialContent }) => {
  const { t } = useTranslations();
  const { currentTheme } = useTheme();
  const { isOpen, onClose, editingCase } = useApp().caseModal;
  const { saveInterestingCase } = useSettings();

  const [studyNumber, setStudyNumber] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (editingCase) {
            setStudyNumber(editingCase.studyNumber);
            setTags(editingCase.tags.join(', '));
            setNotes(editingCase.notes);
            setContent(editingCase.content);
        } else {
            setStudyNumber('');
            setTags('');
            setNotes('');
            setContent(initialContent);
        }
    }
  }, [editingCase, isOpen, initialContent]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyNumber.trim()) {
      alert(t('library.studyNumberRequired'));
      return;
    }
    saveInterestingCase({
      id: editingCase?.id,
      studyNumber: studyNumber.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      notes,
      content,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in" style={{ backgroundColor: currentTheme.colors.bgSecondary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px' }} onClick={e => e.stopPropagation()}>
        <div className="p-4" style={{ borderBottomColor: currentTheme.colors.borderColor, borderBottomWidth: '1px' }}>
          <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.textPrimary }}>{editingCase ? t('library.editCase') : t('library.addCase')}</h2>
        </div>
        <form onSubmit={handleSave} className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="studyNumber" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>{t('library.studyNumber')}</label>
              <input
                id="studyNumber"
                type="text"
                value={studyNumber}
                onChange={e => setStudyNumber(e.target.value)}
                className="w-full p-2 rounded-md text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: currentTheme.colors.bgPrimary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px', color: currentTheme.colors.textPrimary }}
                placeholder={t('library.studyNumberPlaceholder')}
                required
              />
            </div>
             <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>{t('library.tags')}</label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full p-2 rounded-md text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: currentTheme.colors.bgPrimary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px', color: currentTheme.colors.textPrimary }}
                placeholder={t('library.tagsPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>{t('library.notes')}</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2 rounded-md text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: currentTheme.colors.bgPrimary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px', color: currentTheme.colors.textPrimary }}
                rows={3}
                placeholder={t('library.notesPlaceholder')}
              />
            </div>
             <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>{t('library.content')}</label>
              <textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full p-2 rounded-md text-sm font-mono focus:outline-none focus:ring-2"
                style={{ backgroundColor: currentTheme.colors.bgPrimary, borderColor: currentTheme.colors.borderColor, borderWidth: '1px', color: currentTheme.colors.textPrimary }}
                rows={8}
                placeholder={t('templateModal.templateContentPlaceholder')}
              />
            </div>
          </div>
          <div className="p-4 flex justify-end space-x-3" style={{ borderTopColor: currentTheme.colors.borderColor, borderTopWidth: '1px', backgroundColor: currentTheme.colors.bgSecondary }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white font-semibold transition-colors" style={{ backgroundColor: currentTheme.colors.bgTertiary }}>{t('templateModal.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors">{editingCase ? t('templateModal.saveChanges') : t('library.addCase')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterestingCaseModal;