import React from 'react';
import type { ReportData } from '../ReportGenerator';
import type { PersonalInfo } from '../../../types';
import { useTranslations } from '../../../context/LanguageContext';

interface SpecificationProps {
    reportData: ReportData;
    personalInfo: Partial<PersonalInfo>;
    reportDate: Date;
}

const Specification: React.FC<SpecificationProps> = ({ reportData, personalInfo, reportDate }) => {
    const { t } = useTranslations();
    const safeDate = reportDate || new Date();
    const monthName = safeDate.toLocaleString(t('langName') === 'Polski' ? 'pl' : 'en-US', { month: 'long' }).toUpperCase();
    const year = safeDate.getFullYear();

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: 1.5 }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12pt', fontWeight: 'normal', textDecoration: 'underline' }}>
                    Specyfikacja udzielonych świadczeń
                </h2>
            </div>

            <div style={{ marginBottom: '15px', lineHeight: 1.8 }}>
                <div>Imię i Nazwisko Przyjmującego Zamówienie: <strong>{personalInfo.fullName?.toUpperCase()}</strong></div>
                <div>Komórka Organizacyjna: <strong>{personalInfo.department?.toUpperCase()}</strong></div>
                <div>Umowa nr <strong>{personalInfo.contractNumber}</strong></div>
                <div>na udzielanie świadczeń w zakresie: <strong>{personalInfo.specialty?.toUpperCase()}</strong></div>
                <div>Miesiąc: <strong>{monthName} {year}</strong></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '9pt' }}>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'normal' }}>{t('studyManager.table.nfzCode')}</th>
                        <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'normal' }}>{t('studyManager.table.studyNumber')}</th>
                        <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'normal' }}>{t('studyManager.table.descriptionDate')}</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.studies.map(study => (
                         <tr key={study.id}>
                            <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{reportData.groupedByCode.find(g => g.code.code === study.code)?.code.fullCode}</td>
                            <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{study.patientId}</td>
                            <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{new Date(study.date).toLocaleDateString('pl-PL')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

             <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '10pt' }}>Zestawienie według kodów świadczeń:</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '9pt' }}>
                <thead style={{ background: '#f0f0f0' }}>
                     <tr>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'normal', width: '40px' }}>Lp</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'normal' }}>Kod świadczenia</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'normal' }}>Zakres świadczeń medycznych</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'normal', width: '60px' }}>{t('studyManager.table.count')}</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.groupedByCode.map((group, index) => (
                         <tr key={group.code.code}>
                            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{group.code.fullCode}</td>
                            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{group.code.desc}</td>
                            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{group.count}</td>
                        </tr>
                    ))}
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', paddingRight: '20px' }}>Razem</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{reportData.studies.length}</td>
                    </tr>
                </tbody>
             </table>

             <div style={{ marginTop: '20px', fontSize: '10pt' }}>
                <p>Razem kwota brutto: <strong>{reportData.totalAmount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
            </div>
        </div>
    );
};

export default Specification;
